import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { IpcRenderer, ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { from, Observable, Subject } from 'rxjs';
import { IFileInfo } from '../../../electron-ts/IFileInfo';
import { ISettings } from '../../../electron-ts/Utilities';

@Injectable({
  providedIn: 'root',
})
export class ElectronRenderService {
  ipcRenderer!: typeof ipcRenderer;
  webFrame!: typeof webFrame;
  childProcess!: typeof childProcess;
  fs!: typeof fs;

  partialTranscript$ = new Subject<string[]>();
  finalTranscript$ = new Subject<string[]>();
  streamingLog$ = new Subject<string>();

  constructor() {
    // Conditional imports
    if (this.isElectron) {
      this.ipcRenderer = (window as any).require('electron').ipcRenderer;
      this.webFrame = (window as any).require('electron').webFrame;
      this.fs = (window as any).require('fs');
      this.childProcess = (window as any).require('child_process');
      this.childProcess.exec('node -v', (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout:\n${stdout}`);
      });

      this.ipcRenderer.on('partial-transcript', (undefined, value: string[]) => this.partialTranscript$.next(value));
      this.ipcRenderer.on('final-transcript', (undefined, value: string[]) => this.finalTranscript$.next(value));
      this.ipcRenderer.on('streaming-log', (undefined, value: string) => this.streamingLog$.next(value));

      // Notes :
      // * A NodeJS's dependency imported with 'window.require' MUST BE present in `dependencies` of both `app/package.json`
      // and `package.json (root folder)` in order to make it work here in Electron's Renderer process (src folder)
      // because it will loaded at runtime by Electron.
      // * A NodeJS's dependency imported with TS module import (ex: import { Dropbox } from 'dropbox') CAN only be present
      // in `dependencies` of `package.json (root folder)` because it is loaded during build phase and does not need to be
      // in the final bundle. Reminder : only if not used in Electron's Main process (app folder)

      // If you want to use a NodeJS 3rd party deps in Renderer process,
      // ipcRenderer.invoke can serve many common use cases.
      // https://www.electronjs.org/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args
    }
  }

  SaveAudio(arrayBuffer: ArrayBuffer): Observable<string> {
    return from(this.ipcRenderer.invoke('save-audio', arrayBuffer));

  }
  StoreGetKeys(store: string): Observable<string[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return from(this.ipcRenderer.invoke('store-keys', store));
  }
  StoreGetFileInfo(store: string, key: string): Observable<IFileInfo> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return from(this.ipcRenderer.invoke('store-fileinfo', store, key));
  }
  StoreDataPath(): Observable<string> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return from(this.ipcRenderer.invoke('data-path'));
  }
  StoreGet(store: string, key: string): Observable<string> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return from(this.ipcRenderer.invoke('store-get', store, key));
  }
  StoreSet(store: string, key: string, value: any): Observable<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return from(this.ipcRenderer.invoke('store-set', store, key, value));
  }
  StoreDelete(store: string, key: string): Observable<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return from(this.ipcRenderer.invoke('store-delete', store, key));
  }
  Ping(): Observable<string> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return from(this.ipcRenderer.invoke('ping'));
  }
  FileExists(file: string): Observable<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return from(this.ipcRenderer.invoke('file-exists', file));
  }

  Glob(): Observable<string[]> {
    return from(this.ipcRenderer.invoke('glob'));
  }

  GetSettings(): Observable<ISettings> {
    return from(this.ipcRenderer.invoke('get-settings'));
  }

  SaveSettings(settings: ISettings): Observable<void> {
    return from(this.ipcRenderer.invoke('save-settings', settings));
  }

  StreamStart(): Observable<void> {
    return from(this.ipcRenderer.invoke('stream-start'));
  }

  StreamStop(): Observable<void> {
    return from(this.ipcRenderer.invoke('stream-stop'));
  }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }
}
