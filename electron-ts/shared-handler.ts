import { BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent, shell } from 'electron';
import SimpleElectronStore from './simple-electron-store';
import * as fs from 'fs';
import { exec } from 'child_process';
import { ISettings, Utilities } from './utility-classes';
import axios, {AxiosRequestConfig, RawAxiosRequestHeaders} from 'axios';

import { LiveTranscriptionHander } from './live-transcription-handler';
import { ModelEngine } from './model-engine';

export class SharedHandler {
  win?: BrowserWindow
  dataStore: SimpleElectronStore;
  liveTranscriptHandler: LiveTranscriptionHander | undefined;
  modelEngine: ModelEngine | undefined;

  constructor(public environment: 'dev' | 'prod') {
    this.dataStore = new SimpleElectronStore();
    ipcMain.handle('store-get', (undefined, store: string, key: string) => this.dataStore.get(store, key) );
    ipcMain.handle('store-set', (undefined, store: string, key: string, value: any) => this.dataStore.set(store, key, value) );
    ipcMain.handle('save-audio', async (event, arrayBuffer): Promise<{file: string, sizeMB: number}> => this.saveAudio(arrayBuffer));

    ipcMain.handle('compress-audio',
      async (event, uncompressedFilePath: string, bitRateK: number): Promise<string> =>
        this.compressAudio(uncompressedFilePath, bitRateK));

    ipcMain.handle('store-delete', (undefined, store: string, key: string) => this.dataStore.delete(store, key) );
    ipcMain.handle('data-path', () => this.dataStore.getUserDataPath() );
    ipcMain.handle('store-keys', (undefined, store: string) => this.dataStore.keys(store) );
    ipcMain.handle('store-fileinfo', (undefined, store: string) => this.dataStore.getFileInfo(store) );
    ipcMain.handle('ping', () => 'pong');
    ipcMain.handle('file-exists', (undefined, filePath: string) => fs.existsSync(filePath) );
    ipcMain.handle('glob', () => fs.readdirSync('.'));
    ipcMain.handle('get-settings', () => this.getSettings());
    ipcMain.handle('save-settings', (undefined, settings: ISettings) => this.dataStore.set(Utilities.STORE_CONFIG, 'settings', settings));
    ipcMain.handle('open-file', (undefined, filePath: string) =>  shell.openPath(filePath));

    ipcMain.handle('encrypt', (undefined, plain: string, pass: string) => this.aesGcmEncrypt(plain, pass));
    ipcMain.handle('decrypt', (undefined, encrypted: string, pass: string) => this.aesGcmDecrypt(encrypted, pass));
    ipcMain.handle('remote-config', () => this.remoteConfig());
  }

  async remoteConfig() {

    const client = axios.create({
      baseURL: 'https://api.jsonbin.io/v3/b',
    });

    const config: AxiosRequestConfig = {
      headers: {
        'X-Access-Key': '$2a$10$FqcHES6dO/oc5NO65d4TPeWGBrWgLuzhbjIs9DUfoachTEpm6g6nW',
      } as RawAxiosRequestHeaders,
    };


    const queryString: string = `meta=false`;
    const docResponse = await client.get(`/66d79ca8acd3cb34a87e1d3d?${queryString}`, config);
    this.log({
      level: 'info',
      message:  `response from json bin: ${JSON.stringify(docResponse.data)}`
    })
    return docResponse.data
  }


  binDir(): string {
    return this.environment === 'dev' ? `public\\bin` : `resources\\app\\bin`;
  }

  binPath(exeName: string): string {
    return `${this.binDir()}/${exeName}`;
  }

  getSettings(): ISettings {
    const settings = this.dataStore.get(
      Utilities.STORE_CONFIG,
      'settings'
    ) as any;
    return settings || Utilities.DefaultSettings();
  }

  setBrowserWindow(win: BrowserWindow) {
    this.win = win;

    this.liveTranscriptHandler = new LiveTranscriptionHander(
      this.binDir(),
      win,
      () => this.getSettings()
    );

    this.modelEngine = new ModelEngine(win, () => this.getSettings());

    this.liveTranscriptHandler.error$.subscribe(x => this.error(x));
    this.liveTranscriptHandler.log$.subscribe(x => this.log(x));

    this.modelEngine.error$.subscribe(x => this.error(x));
    this.modelEngine.log$.subscribe(x => this.log(x));
  }

  private log(msg: {
    level: 'trace' | 'info' | 'important';
    message: string;
  }) {
    if (this.win) {
      this.win.webContents.send('session-log', msg);
      if (msg.level !== 'trace') {
        this.dataStore.sessionLog([msg.message])
      }
    } else {
      if (msg.level !== 'trace') {
        this.dataStore.sessionLog([`Not sent to client: ${msg.message}`])
      }
    }
  }

  private error(msg: string) {
    if (this.win) {
      this.win.webContents.send('session-error', msg)
    }
    this.dataStore.sessionLog(['----', `ERROR: ${msg}`,'----']);
  }

  async compressAudio(uncompressedFilePath: string, bitRateK: number): Promise<string> {
    if (bitRateK < 0) {
      bitRateK = 24;
    }
    const outfile = `${this.dataStore.getUserDataPath()}\\${Utilities.formattedNow()}_compressed.mp3`;
    const cmd = `${this.binDir()}\\ffmpeg -i "${uncompressedFilePath}" -b:a ${bitRateK}k -map a ${outfile}`
    return new Promise((resolve, reject) => {
      exec(cmd, (err) => {
        if (err) {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject(`Failed to compress the file: ${err}`);
        }
        resolve(outfile);
      });
    });
  }

  async saveAudio(arrayBuffer: ArrayBuffer): Promise<{file: string, sizeMB: number}> {
    const { canceled, filePath } = await dialog.showSaveDialog({
      filters: [{ name: 'Audio Files', extensions: ['mp3'] }],
      defaultPath: `recording_${Utilities.formattedNow()}.mp3`,
    });

    if (!canceled && filePath) {
      return new Promise((resolve, reject) => {
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFile(filePath, buffer, (err) => {
          if (err) {
            // eslint-disable-next-line prefer-promise-reject-errors
            reject(`Failed to save the file: ${err}`);
          }
          const stats = fs.statSync(filePath)
          const fileSizeInBytes = stats.size;
          // Convert the file size to megabytes (optional)
          const mb = fileSizeInBytes / (1024*1024);
          resolve({ file: filePath, sizeMB: mb });
        });
      });
    } else {
      return { file: '', sizeMB: 0 };
    }
  }

  async aesGcmEncrypt(plaintext: string, password: string) {
    const pwUtf8 = new TextEncoder().encode(password);                                 // encode password as UTF-8
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);                      // hash the password

    const iv = crypto.getRandomValues(new Uint8Array(12));                             // get 96-bit random iv
    const ivStr = Array.from(iv).map(b => String.fromCharCode(b)).join('');            // iv as utf-8 string

    const alg = { name: 'AES-GCM', iv: iv };                                           // specify algorithm to use

    const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['encrypt']); // generate key from pw

    const ptUint8 = new TextEncoder().encode(plaintext);                               // encode plaintext as UTF-8
    const ctBuffer = await crypto.subtle.encrypt(alg, key, ptUint8);                   // encrypt plaintext using key

    const ctArray = Array.from(new Uint8Array(ctBuffer));                              // ciphertext as byte array
    const ctStr = ctArray.map(byte => String.fromCharCode(byte)).join('');             // ciphertext as string

    return btoa(ivStr+ctStr);                                                          // iv+ciphertext base64-encoded
  }

  async aesGcmDecrypt(ciphertext: string, password: string) {
    const pwUtf8 = new TextEncoder().encode(password);                                 // encode password as UTF-8
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);                      // hash the password

    const ivStr = atob(ciphertext).slice(0,12);                                        // decode base64 iv
    const iv = new Uint8Array(Array.from(ivStr).map(ch => ch.charCodeAt(0)));          // iv as Uint8Array

    const alg = { name: 'AES-GCM', iv: iv };                                           // specify algorithm to use

    const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt']); // generate key from pw

    const ctStr = atob(ciphertext).slice(12);                                          // decode base64 ciphertext
    const ctUint8 = new Uint8Array(Array.from(ctStr).map(ch => ch.charCodeAt(0)));     // ciphertext as Uint8Array
    // note: why doesn't ctUint8 = new TextEncoder().encode(ctStr) work?

    try {
        const plainBuffer = await crypto.subtle.decrypt(alg, key, ctUint8);            // decrypt ciphertext using key
        const plaintext = new TextDecoder().decode(plainBuffer);                       // plaintext from ArrayBuffer
        return plaintext;                                                              // return the plaintext
    } catch (e) {
        throw new Error('Decrypt failed');
    }
}
}
