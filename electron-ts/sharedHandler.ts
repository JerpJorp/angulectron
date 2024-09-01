import { BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent } from 'electron';
import SimpleElectronStore from './SimpleElectronStore';
import * as fs from 'fs';
import { ISettings, Utilities } from './Utilities';

import { LiveTranscriptionHander } from './LiveTranscriptionHander';
import Shared from './shared';

export class SharedHandler {
  dataStore: SimpleElectronStore;
  liveTranscriptHandler: LiveTranscriptionHander | undefined;

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
    this.liveTranscriptHandler = new LiveTranscriptionHander(
      this.binDir(),
      win,
      this.getSettings(),
      this.dataStore
    );
  }

  constructor(public environment: 'dev' | 'prod') {
    this.dataStore = new SimpleElectronStore();

    ipcMain.handle(
      'store-get',
      (event: IpcMainInvokeEvent, store: string, key: string) =>
        this.dataStore.get(store, key)
    );
    ipcMain.handle(
      'store-set',
      (event: IpcMainInvokeEvent, store: string, key: string, value: any) =>
        this.dataStore.set(store, key, value)
    );

    ipcMain.handle('save-audio', async (event, arrayBuffer): Promise<string> => {
      const { canceled, filePath } = await dialog.showSaveDialog({
        filters: [{ name: 'Audio Files', extensions: ['mp3'] }],
        defaultPath: `recording_${Shared.formattedNow()}.mp3`,
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
      }
      return '';
    });

    ipcMain.handle(
      'store-delete',
      (event: IpcMainInvokeEvent, store: string, key: string) =>
        this.dataStore.delete(store, key)
    );
    ipcMain.handle('data-path', (event: IpcMainInvokeEvent) =>
      this.dataStore.getUserDataPath()
    );
    ipcMain.handle('store-keys', (event: IpcMainInvokeEvent, store: string) =>
      this.dataStore.keys(store)
    );
    ipcMain.handle(
      'store-fileinfo',
      (event: IpcMainInvokeEvent, store: string) =>
        this.dataStore.getFileInfo(store)
    );
    ipcMain.handle('ping', (event: IpcMainInvokeEvent) => 'pong');
    ipcMain.handle(
      'file-exists',
      (event: IpcMainInvokeEvent, filePath: string) => fs.existsSync(filePath)
    );
    ipcMain.handle('glob', (event: IpcMainInvokeEvent) => fs.readdirSync('.'));

    ipcMain.handle('get-settings', (event: IpcMainInvokeEvent) => this.getSettings());

    ipcMain.handle(
      'save-settings',
      (event: IpcMainInvokeEvent, settings: ISettings) =>
        this.dataStore.set(Utilities.STORE_CONFIG, 'Providers', settings)
    );
  }
}
