import { Component, computed, signal, inject } from '@angular/core';
import { ElectronRenderService } from '../../services/electronRender.service';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MarkdownModule } from 'ngx-markdown';
import { MatCardModule } from '@angular/material/card';
import { TranscriptInstance } from '../../classes/transcript-instance';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-transcript-session',
  standalone: true,
  imports: [
    MatListModule,
    MatButtonModule,
    MarkdownModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    NgIf,
  ],
  templateUrl: './transcript-session.component.html',
  styleUrl: './transcript-session.component.css',
})
export class TranscriptSessionComponent {
  private _snackBar = inject(MatSnackBar);

  transcriptArray = signal<string[]>([]);
  transcript = computed(() => this.transcriptArray().join('\n'));
  transcriptInstance = signal<TranscriptInstance | undefined>(undefined);
  recordingState = signal('');
  recordingMessage = signal('');
  recorder: MediaRecorder | undefined;
  sessionError = signal<string>('');
  inSession = signal(false);
  cancelling = false;
  dirty = signal(false);

  constructor(private electronRenderService: ElectronRenderService) {
    this.electronRenderService.partialTranscript$.subscribe((textList) =>
      this.transcriptArray.set(textList)
    );
    this.electronRenderService.finalTranscript$.subscribe((textList) =>
      this.transcriptArray.set(textList)
    );
    this.electronRenderService.sessionLog$.subscribe((log) =>
      console.log(`session log: ${log}`)
    );
    this.electronRenderService.sessionError$.subscribe((err) => {
      console.warn(`session error: ${err}`);
      this.openSnackBar(err, 'OK');
    });
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      politeness: 'assertive',
      panelClass: 'panel-class-alert',
    });
  }

  startSreaming() {
    this.electronRenderService
      .StreamStart()
      .subscribe(() => console.log('stream start'));
    this.transcriptInstance.set(TranscriptInstance.Factory());
    this.inSession.set(true);
  }

  stopStreaming() {
    this.cancelling = false;
    this.electronRenderService.StreamStop().subscribe(() => {
      console.log('stream stop');
      this.endSession();
    });

    const instance = this.transcriptInstance() || TranscriptInstance.Factory();
    instance.transcript = this.transcript();
    this.transcriptInstance.set(instance);
  }

  cancelStreaming() {
    this.cancelling = true;
    this.electronRenderService.StreamStop().subscribe(() => {
      console.log('stream cancel');
      this.endSession();
    });

    const instance = this.transcriptInstance() || TranscriptInstance.Factory();
    instance.transcript = this.transcript();
    this.transcriptInstance.set(instance);
  }

  stopRecording() {
    this.cancelling = false;
    this.recordingState.set('stop');
    if (this.recorder) {
      this.recorder.stop();
    }
  }

  cancelRecording() {
    this.cancelling = true;
    this.recordingState.set('cancel');
    if (this.recorder) {
      this.recorder.stop();
    }
  }

  async startBoth() {
    this.startSreaming();
    this.startRecording();
  }

  stopBoth() {
    this.stopStreaming();
    this.stopRecording();
  }

  cancelBoth() {
    this.stopStreaming();
    this.cancelRecording();
  }

  publishChanges() {
    this.dirty.set(true);
  }

  saveInstance() {
    const instance = this.transcriptInstance();
    if (instance) {
      this.electronRenderService.SaveInstance(instance).subscribe(() => this.dirty.set(false))
    } else {
      this.dirty.set(false);
    }
  }

  endSession(): void {
    this.inSession.set(false);
    this.dirty.set(true);
    if (this.cancelling) {
      return;
    }

    if (this.transcript()?.length > 0) {
      const instance = this.transcriptInstance();
      if (instance) {
        if (instance.transcript?.length > 0) {
          instance.history.push({
            message: 'replacing transcript: old transcript',
            value: instance.transcript,
          });
        }
      }
      this.transcriptArray.set([]);
    }
  }

  async startRecording() {
    this.transcriptInstance.set(TranscriptInstance.Factory());
    this.recordingState.set('start');
    const audioChunks: Blob[] = [];
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    this.recorder = new MediaRecorder(stream);

    this.recorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
      this.recordingMessage.set(
        `recording: ${audioChunks.length} chunks so far`
      );
    };

    this.recorder.onstart = () => {
      this.recordingMessage.set('Recording started from your microphone.');
      this.inSession.set(true);
    };

    this.recorder.onstop = () => {
      if (this.recordingState() === 'cancel') {
        this.recordingMessage.set('cleared: recording not saved.');
        audioChunks.splice(0, audioChunks.length);
      } else {
        this.recordingMessage.set('recording stopped: saving file...');
        const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg-3' });
        const reader = new FileReader();
        reader.onload = async () => {
          this.electronRenderService
            .SaveAudio(reader.result as ArrayBuffer)
            .subscribe((fileName) => {
              this.recordingMessage.set(`File saved as ${fileName}`);
              const instance =
                this.transcriptInstance() || TranscriptInstance.Factory();
              if (instance.file) {
                instance.history.push({
                  message: 'new file',
                  value: instance.file,
                });
              }
              instance.file = fileName;
              this.transcriptInstance.set(instance);
              audioChunks.splice(0, audioChunks.length);
            });
        };
        reader.readAsArrayBuffer(audioBlob);
      }
      this.endSession();
    };

    this.recorder.start();
  }
}
