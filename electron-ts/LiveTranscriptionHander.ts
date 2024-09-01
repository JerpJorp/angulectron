import { ipcMain, BrowserWindow } from 'electron';
import StreamingTranscriptService from './StreamingTranscriptService';
import { ISettings } from './Utilities';
import SimpleElectronStore from './SimpleElectronStore';

export class LiveTranscriptionHander {
  streamingSvc: StreamingTranscriptService;

  fullContent: string[] = [];
  constructor(
    public binDir: string,
    public mainWindow: BrowserWindow,
    settings: ISettings,
    public dataStore: SimpleElectronStore,
  ) {
    this.streamingSvc = new StreamingTranscriptService(this.binDir, settings);

    this.streamingSvc.debug$.subscribe((msg) => {
      this.mainWindow.webContents.send('streaming-log', msg)
      dataStore.sessionLog([msg]);
    });

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
      this.dataStore.sessionLog(['streamingSvc.start()']);
      return this.streamingSvc.start();
    });
    ipcMain.handle('stream-stop', async (): Promise<string> => {
      this.dataStore.sessionLog(['streamingSvc.stop()']);
      return this.streamingSvc.stop();
    });
  }
}
