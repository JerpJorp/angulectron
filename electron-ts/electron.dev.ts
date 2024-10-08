import {
  app,
  BrowserWindow,
  screen,
} from 'electron';
import * as url from 'url';
import { SharedHandler } from './shared-handler';

// TODO: Implement SimpleElectronStore for data storage
// const dataStore = new SimpleElectronStore();

// TODO: Set up IPC handler for 'store-get' operation
// ipcMain.handle(
//   'store-get',
//   (event: IpcMainInvokeEvent, store: string, key: string) =>
//     dataStore.get(store, key)
// );

let win: BrowserWindow | null = null;
const shared = new SharedHandler('dev');
function createWindow(): BrowserWindow {
  const size = screen.getPrimaryDisplay().workAreaSize;
  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    icon: './public/favicon.ico',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  shared.setBrowserWindow(win);

  win.loadURL(
    url.format({
      pathname: 'localhost:4200',
      protocol: 'http:',
      slashes: true,
    })
  );
  win.webContents.openDevTools();

  win.on('closed', () => {
    win = null;
  });

  return win;
}

try {
  app.on('ready', () => setTimeout(createWindow, 1000));
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (win === null) {
      createWindow();
    }
  });
} catch (e) {
  // Catch Error
  // throw e;
}
