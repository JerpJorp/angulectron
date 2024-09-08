import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { IpcRenderer, ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { BehaviorSubject, from, map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { IFileInfo } from '../../../electron-ts/file-info';
import { IAIConfig, ISettings, Utilities } from '../../../electron-ts/utility-classes';
import { TranscriptInstance } from '../classes/transcript-instance';
import { IChatServiceResponse, IGenericMessage } from '../../../electron-ts/model-engine';
import { IRemoteConfig }  from '../../../electron-ts/remote-config';

@Injectable({
  providedIn: 'root',
})
export class ElectronRenderService {
  ipcRenderer!: typeof ipcRenderer;
  webFrame!: typeof webFrame;
  childProcess!: typeof childProcess;
  fs!: typeof fs;

  instanceTags$ = new BehaviorSubject<{[index: string]: string[]}>({});
  tags$ = new BehaviorSubject<string[]>([]);

  pendingRequests$ = new Subject<string[]>();
  partialTranscript$ = new Subject<string[]>();
  finalTranscript$ = new Subject<string[]>();
  sessionLog$ = new Subject<{
    level: 'trace' | 'info' | 'important';
    message: string;
  }>();
  sessionError$ = new Subject<string>();

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

      this.ipcRenderer.on('pending-requests', (undefined, requests: string[]) => this.pendingRequests$.next(requests));
      this.ipcRenderer.on('partial-transcript', (undefined, value: string[]) => this.partialTranscript$.next(value));
      this.ipcRenderer.on('final-transcript', (undefined, value: string[]) => this.finalTranscript$.next(value));
      this.ipcRenderer.on('session-log', (undefined, log: {
          level: 'trace' | 'info' | 'important';
          message: string;
        }) => {
          if (log.level != 'trace') {
            console.log(`session log: ${JSON.stringify(log)}`);
          }
          this.sessionLog$.next(log);
        });
      this.ipcRenderer.on('session-error', (undefined, err: string) => {
        console.warn(`session error: ${err}`);
        this.sessionError$.next(err);
      });

      this.instanceTags$.subscribe(tagInstances => {
          const all = Object.values(tagInstances).reduce((p, i) => p = [...p, ...i], []);
          this.tags$.next(Array.from(new Set(all)));
      })

      this.GetInstances().subscribe((instances) => console.log(`Retrieved ${instances.length} sessions from storage`))
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

  Transcribe(instance: TranscriptInstance, audioFilePath: string): Observable<IChatServiceResponse> {
    return from(this.ipcRenderer.invoke('transcribe', audioFilePath)).pipe(tap((response) => {
      if (response.error) {
        return;
      }
      if (instance.transcript && instance.transcript.length > 0) {
        if (instance.history === undefined) {
          instance.history = [];
        }
        instance.history.push({
          message: `new transcript.  Old value`,
          value: instance.transcript,
        })
      }
      instance.transcript = response.text;
    }))
  }

  Interaction(instance: TranscriptInstance, name: string, systemMessage: string, humanMessage: string): Observable<IChatServiceResponse> {
    return from(this.ipcRenderer.invoke('interaction-request', systemMessage, humanMessage)).pipe(tap((response) => {
        if (response.error)  {
          return;
        }
        let interaction = instance.interactions.find((x) => x.name === name);
        if (interaction ) {
          if (interaction.value && interaction.value.length > 0) {
            if (instance.history === undefined) {
              instance.history = [];
            }
            instance.history.push({
              message: `new reqsponse for ${name}.  Old value`,
              value: interaction.value,
            })
          }
        } else {
          interaction = {name: name, value: ''};
          instance.interactions.push(interaction);
        }
        interaction.value = response.text;
    }));
  }

  LLMRequest(messageStack: IGenericMessage[], llm?: IAIConfig, model?: string): Observable<IChatServiceResponse> {
    return from(this.ipcRenderer.invoke('llm-request', messageStack, llm, model));
  }

  GetInstance(instance: TranscriptInstance): Observable<TranscriptInstance | undefined> {
    const obs$ = from(this.StoreGet(Utilities.INSTANCE_CONFIG, instance.id));
    return obs$.pipe(map(i => {
      this.cleanInstance(i as TranscriptInstance | undefined);
      return i as TranscriptInstance | undefined;
    }));
  }

  private cleanInstance(instance: TranscriptInstance | undefined) {
    if (instance) {
      if(instance.tags == undefined) {
        instance.tags = [];
      }
    }
  }
  GetInstances(): Observable<TranscriptInstance[]> {
    const return$ = this.StoreGetFileInfo(Utilities.INSTANCE_CONFIG).pipe(map((x) => {
      const tagInfo: { [index: string]: string[] } = {}
      const instances = Object.values(x.info.data) as TranscriptInstance[];
      instances
        .map(i => i as TranscriptInstance)
        .forEach(i => {
          this.cleanInstance(i);
          tagInfo[i.id] = i.tags;
        });
      this.instanceTags$.next(tagInfo);
      return instances;
    }));
    return return$;
  }

  DeleteInstance(instance: TranscriptInstance): Observable<void> {
    const tagInfo = this.instanceTags$.value;
    tagInfo[instance.id] = [];
    this.instanceTags$.next(tagInfo);

    return this.StoreDelete(Utilities.INSTANCE_CONFIG, instance.id);
  }

  SaveInstance(instance: TranscriptInstance): Observable<void> {
    const tagInfo = this.instanceTags$.value;
    tagInfo[instance.id] = instance.tags || [];
    this.instanceTags$.next(tagInfo);
    return  this.StoreSet(Utilities.INSTANCE_CONFIG, instance.id, instance);
  }

  SaveAudio(arrayBuffer: ArrayBuffer): Observable<string> {
    return from(this.ipcRenderer.invoke('save-audio', arrayBuffer));

  }
  StoreGetKeys(store: string): Observable<string[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return from(this.ipcRenderer.invoke('store-keys', store));
  }
  StoreGetFileInfo(store: string): Observable<{ path: string; info: IFileInfo }> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return from(this.ipcRenderer.invoke('store-fileinfo', store));
  }
  StoreDataPath(): Observable<string> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return from(this.ipcRenderer.invoke('data-path'));
  }
  StoreGet(store: string, key: string): Observable<unknown> {
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
  OpenFile(file: string): Observable<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return from(this.ipcRenderer.invoke('open-file', file));
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

  Encrypt(plain: string, password: string) {
    return from(this.ipcRenderer.invoke('encrypt', plain, password));
  }

  Decrypt(encrypted: string, password: string) {
    return from(this.ipcRenderer.invoke('decrypt', encrypted, password));
  }

  RemoteConfig(): Observable<IRemoteConfig> {
    return from (this.ipcRenderer.invoke('remote-config'))
  }
  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }
}
