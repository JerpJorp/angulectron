import {
  AssemblyAI,
  RealtimeTranscriber,
  RealtimeTranscript,
} from 'assemblyai';

import { Subject, Subscription } from 'rxjs';
import { SoxRecording } from './sox';
import { ISettings, Utilities } from './utility-classes';

export default class StreamingTranscriptService {

  log$ = new Subject<{
    level: 'trace' | 'info' | 'important';
    message: string;
  }>();

  error$ = new Subject<string>();

  assemblyAI?: AssemblyAI;

  transcriber?: RealtimeTranscriber;

  sessionOpen$ = new Subject<string>();

  sessionError$ = new Subject<Error>();

  sessionClosed$ = new Subject<{ code: number; reason: string }>();

  partialTranscript$ = new Subject<string>();

  finalTranscript$ = new Subject<string>();

  recording: SoxRecording | undefined;

  running = false;

  readonly SAMPLE_RATE = 16_000;

  dubugSub: Subscription | undefined;

  constructor(private binDir: string) {}

  private initializeModel(apiKey: string): {
    assemblyAI: AssemblyAI;
    transcriber: RealtimeTranscriber;
  } {
    this.assemblyAI = new AssemblyAI({
      apiKey: apiKey,
    });
    this.transcriber = this.assemblyAI.realtime.transcriber({
      sampleRate: this.SAMPLE_RATE,
    });
    this.transcriber.on('open', ({ sessionId }) => {
      this.log$.next({ level: 'trace', message: 'sessionOpen$.next' });
      this.sessionOpen$.next(sessionId);
    });

    this.transcriber.on('error', (error: Error) => {
      this.log$.next({ level: 'trace', message: `sessionError$.next -> ${error}`});
      this.sessionError$.next(error);
    });

    this.transcriber.on('close', (code: number, reason: string) => {
      this.log$.next({ level: 'trace', message: `sessionClosed$.next ${code}: ${reason}`});
      this.sessionClosed$.next({ code, reason });
    });

    this.transcriber.on('transcript', (transcript: RealtimeTranscript) => {
      this.log$.next({ level: 'trace', message: `transcriber.on transcript`});
      if (!transcript.text) {
        return;
      }

      if (transcript.message_type === 'PartialTranscript') {
        this.log$.next({
          level: 'trace',
          message: `partialTranscript$.next text length ${transcript.text.length}`
        });
        this.partialTranscript$.next(transcript.text);
      } else {
        this.log$.next({
          level: 'trace',
          message: `finalTranscript$.next text length ${transcript.text.length}`
        });
        this.finalTranscript$.next(transcript.text);
      }
    });

    return { assemblyAI: this.assemblyAI, transcriber: this.transcriber };
  }

  getApiKey(settings: ISettings): string {
    const myProvider = settings.AIConfigs.find(
      (x) => x.provider === Utilities.ASSEMBLYAI
    );
    return myProvider ? myProvider.apiKey : '';
  }

  async start(settings: ISettings): Promise<string> {
    this.log$.next({
      level: 'important',
      message: 'start()'
    });
    const apiKey = this.getApiKey(settings);
    if (apiKey === '') {
      this.error$.next(
        'start(): no api key for streaming provider.  Cannot initiate live transcription.'
      );
      return new Promise((resolve) => {
        resolve(
          'no key! Assembly AI API key must be set in AI config for streaming transcription services to be available'
        );
      });
    }

    this.log$.next({
      level: 'trace',
      message: 'start(): initializeModel'
    });
    const objects = this.initializeModel(apiKey);
    this.log$.next({
      level: 'trace',
      message: 'start(): this.transcriber.connect'
    });
    await objects.transcriber.connect();

    if (this.dubugSub) {
      this.dubugSub.unsubscribe();
      this.dubugSub = undefined;
    }

    this.log$.next({
      level: 'trace',
      message: 'start(): new SoxRecording'
    });
    this.recording = new SoxRecording({
      binDir: this.binDir,
      channels: 1,
      sampleRate: this.SAMPLE_RATE,
      audioType: 'wav',
    });
    this.dubugSub = this.recording.debug$.subscribe((msg) => {
      this.log$.next({
        level: 'trace',
        message: `SOX: ${msg}`
      });
    });
    this.log$.next({
      level: 'trace',
      message: 'start(): recording.stream().pipeTo'
    });
    this.recording.stream().pipeTo(objects.transcriber.stream());
    this.running = true;
    this.log$.next({
      level: 'trace',
      message: `start(): returning "started" promise`
    });
    return 'started';
  }

  async stop(): Promise<string> {
    this.log$.next({
      level: 'important',
      message: `async stop`
    });
    if (this.recording) {
      this.log$.next({
        level: 'trace',
        message: `this.recording.stop()`
      });
      this.recording.stop();
      this.log$.next({
        level: 'trace',
        message: `this.transcriber.close()`
      });
      this.log$.next({
        level: 'trace',
        message: `this.recording = undefined`
      });
      this.recording = undefined;
    }
    if (this.transcriber) {
      await this.transcriber.close();
      this.transcriber = undefined;
      this.log$.next({
        level: 'trace',
        message: `stop(): returning "stopped" await`
      });
      return 'stopped';
    }
    return new Promise((resolve) => {
      this.log$.next({
        level: 'trace',
        message: `stop(): returning "stopped" promise`
      });
      resolve('stopped');
    });
  }
}
