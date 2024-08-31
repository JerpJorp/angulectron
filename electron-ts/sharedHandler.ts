import {
  app,
  BrowserWindow,
  ipcMain,
  IpcMainInvokeEvent,
  ipcRenderer,
  screen,
} from 'electron';
import SimpleElectronStore from './SimpleElectronStore';

export class SharedHandler {

  dataStore: SimpleElectronStore;

  constructor() {
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
    ipcMain.handle('store-fileinfo', (event: IpcMainInvokeEvent, store: string) =>
      this.dataStore.getFileInfo(store)
    );
    ipcMain.handle('ping', (event: IpcMainInvokeEvent, store: string) =>
      'pong'
    );

  };
}
