import {
  AssemblyAI,
  RealtimeTranscriber,
  RealtimeTranscript,
} from 'assemblyai';

import { Subject, Subscription } from 'rxjs';
import { SoxRecording } from './sox';
import { ISettings, Utilities } from './Utilities';

export default class StreamingTranscriptService {
  debug$ = new Subject<string>();

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

  apiKey = '';


  constructor(private binDir: string, settings: ISettings) {
    const myProvider = settings.AIConfigs.find((x) => x.provider === Utilities.ASSEMBLYAI);

    if (myProvider) {
      this.apiKey = myProvider.apiKey;
    }
  }

  private initializeModel(): {
    assemblyAI: AssemblyAI;
    transcriber: RealtimeTranscriber;
  } {
    this.assemblyAI = new AssemblyAI({
      apiKey: this.apiKey,
    });
    this.transcriber = this.assemblyAI.realtime.transcriber({
      sampleRate: this.SAMPLE_RATE,
    });
    this.transcriber.on('open', ({ sessionId }) => {
      this.debug$.next('sessionOpen$.next');
      this.sessionOpen$.next(sessionId);
    });

    this.transcriber.on('error', (error: Error) => {
      this.debug$.next(` sessionError$.next -> ${error}`);
      this.sessionError$.next(error);
    });

    this.transcriber.on('close', (code: number, reason: string) => {
      this.debug$.next(`sessionClosed$.next ${code}: ${reason}`);
      this.sessionClosed$.next({ code, reason });
    });

    this.transcriber.on('transcript', (transcript: RealtimeTranscript) => {
      this.debug$.next(`transcriber.on transcript`);
      if (!transcript.text) {
        return;
      }

      if (transcript.message_type === 'PartialTranscript') {
        this.debug$.next(
          `partialTranscript$.next text length ${transcript.text.length}`,
        );
        this.partialTranscript$.next(transcript.text);
      } else {
        this.debug$.next(
          `finalTranscript$.next text length ${transcript.text.length}`,
        );
        this.finalTranscript$.next(transcript.text);
      }
    });

    return { assemblyAI: this.assemblyAI, transcriber: this.transcriber };
  }

  async start(): Promise<string> {
    this.debug$.next('start()');
    if (this.apiKey === '') {
      this.debug$.next('start(): no api key');
      return new Promise((resolve) => {
        resolve(
          'no key! Assembly AI API key must be set in AI config for streaming transcription services to be available',
        );
      });
    }

    this.debug$.next('start(): initializeModel');
    const objects = this.initializeModel();
    this.debug$.next('start(): this.transcriber.connect');
    await objects.transcriber.connect();

    if (this.dubugSub) {
      this.dubugSub.unsubscribe();
      this.dubugSub = undefined;
    }

    this.debug$.next('start(): new SoxRecording');
    this.recording = new SoxRecording({
      binDir: this.binDir,
      channels: 1,
      sampleRate: this.SAMPLE_RATE,
      audioType: 'wav',
    });
    this.dubugSub = this.recording.debug$.subscribe((msg) => {
      this.debug$.next(`SOX: ${msg}`);
    });
    this.debug$.next('start(): recording.stream().pipeTo');
    this.recording.stream().pipeTo(objects.transcriber.stream());
    this.running = true;
    this.debug$.next(`start(): returning "started" promise`);
    return 'started';
  }

  async stop(): Promise<string> {
    this.debug$.next(`async stop`);
    if (this.recording) {
      this.debug$.next(`this.recording.stop()`);
      this.recording.stop();
      this.debug$.next(`this.transcriber.close()`);
      this.debug$.next(`this.recording = undefined`);
      this.recording = undefined;
    }
    if (this.transcriber) {
      await this.transcriber.close();
      this.transcriber = undefined;
      this.debug$.next(`stop(): returning "stopped" await`);
      return 'stopped';
    }
    return new Promise((resolve) => {
      this.debug$.next(`stop(): returning "stopped" promise`);
      resolve('stopped');
    });
  }
}
