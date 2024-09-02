import { ipcMain, BrowserWindow } from 'electron';
import StreamingTranscriptService from './streaming-transcript-service';
import { ISettings } from './utility-classes';
import SimpleElectronStore from './simple-electron-store';
import { Subject } from 'rxjs';

export class LiveTranscriptionHander {
  streamingSvc: StreamingTranscriptService;

  log$ = new Subject<{
    level: 'trace' | 'info' | 'important';
    message: string;
  }>();
  error$ = new Subject<string>();

  fullContent: string[] = [];
  constructor(
    public binDir: string,
    public mainWindow: BrowserWindow,
    public getSettings: () => ISettings,
  ) {
    this.streamingSvc = new StreamingTranscriptService(this.binDir);

    this.streamingSvc.log$.subscribe((msg) =>  {
      this.log$.next({
        level: msg.level,
        message: `Streaming: ${msg.message}`
      });

    });
    this.streamingSvc.error$.subscribe((msg) =>  this.error$.next(`streaming: ${msg}`));

    this.streamingSvc.partialTranscript$.subscribe((partialTranscript) => {
      this.mainWindow.webContents.send('partial-transcript', [this.fullContent, partialTranscript]);
    });
    this.streamingSvc.finalTranscript$.subscribe((finalTranscript) => {
      this.fullContent.push(finalTranscript)
      this.mainWindow.webContents.send('final-transcript', this.fullContent)
    });
    this.streamingSvc.sessionOpen$.subscribe((sessionId) =>
      this.mainWindow.webContents.send('session-open', sessionId)
    );
    this.streamingSvc.sessionClosed$.subscribe((value) =>
      this.mainWindow.webContents.send('session-closed', value.reason)
    );
    this.streamingSvc.sessionError$.subscribe((err) =>
      this.mainWindow.webContents.send('session-error', err)
    );

    ipcMain.handle('stream-start', async (): Promise<string> => {
      this.fullContent = [];
      this.log$.next({level: 'important', message: 'streamingSvc.start()'});
      return this.streamingSvc.start(this.getSettings());
    });
    ipcMain.handle('stream-stop', async (): Promise<string> => {
      this.log$.next({level: 'important', message: 'streamingSvc.stop()'});
      return this.streamingSvc.stop();
    });
  }
}
