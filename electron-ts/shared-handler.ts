import { BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent, shell } from 'electron';
import SimpleElectronStore from './simple-electron-store';
import * as fs from 'fs';
import { ISettings, Utilities } from './utility-classes';

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
    ipcMain.handle('save-audio', async (event, arrayBuffer): Promise<string> => this.saveAudio(arrayBuffer));
    ipcMain.handle('store-delete', (undefined, store: string, key: string) => this.dataStore.delete(store, key) );
    ipcMain.handle('data-path', () => this.dataStore.getUserDataPath() );
    ipcMain.handle('store-keys', (undefined, store: string) => this.dataStore.keys(store) );
    ipcMain.handle('store-fileinfo', (undefined, store: string) => this.dataStore.getFileInfo(store) );
    ipcMain.handle('ping', () => 'pong');
    ipcMain.handle('file-exists', (undefined, filePath: string) => fs.existsSync(filePath) );
    ipcMain.handle('glob', () => fs.readdirSync('.'));
    ipcMain.handle('get-settings', () => this.getSettings());
    ipcMain.handle('save-settings', (undefined, settings: ISettings) => this.dataStore.set(Utilities.STORE_CONFIG, 'Providers', settings));
    ipcMain.handle('open-file', (undefined, filePath: string) =>  shell.openPath(filePath));
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
      'Providers'
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

  async saveAudio(arrayBuffer: ArrayBuffer): Promise<string> {
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
          resolve(filePath);
        });
      });
    } else {
      return '';
    }
  }
}
