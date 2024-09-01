import { Component, computed, signal } from '@angular/core';
import { ElectronRenderService } from '../../services/electronRender.service';

import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MarkdownModule } from 'ngx-markdown';
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'app-live-transcript-session',
  standalone: true,
  imports: [
    MatListModule,
    MatButtonModule,
    MarkdownModule,
    MatCardModule,
  ],
  templateUrl: './live-transcript-session.component.html',
  styleUrl: './live-transcript-session.component.css'
})
export class LiveTranscriptSessionComponent {

    transcriptArray = signal<string[]>([]);
    transcriptText = computed(() => {
      const content = this.transcriptArray().join("\n\n");
      console.log(`transcript text set to length ${content.length}`)
      return `### Transcript content\n\n ${content}`;
    });

    transcript = signal('');

    recordingState = signal('');
    recordingMessage = signal('');
    recorder: MediaRecorder | undefined;

    constructor(private electronRenderService: ElectronRenderService) {
      this.electronRenderService.partialTranscript$.subscribe((textList) => this.transcript.set(textList.join("\n\n")));
      this.electronRenderService.finalTranscript$.subscribe((textList) => this.transcript.set(textList.join("\n\n")));
      this.electronRenderService.streamingLog$.subscribe((log) => console.log(`streamingLog: ${log}`));
    }

    start() {
      this.electronRenderService.StreamStart().subscribe(() => console.log('stream start'));
    }

    stop() {
      this.electronRenderService.StreamStop().subscribe(() => console.log('stream stop'));
    }


    stopRecording() {
      this.recordingState.set('stop');
      if (this.recorder) {
        this.recorder.stop();
      }
    }

    cancelRecording() {
      this.recordingState.set('cancel');
      if (this.recorder) {
        this.recorder.stop();
      }
    }

    async startBoth() {
      this.start();
      this.startRecording();
    }

    stopBoth() {
      this.stop();
      this.stopRecording();
    }

    cancelBoth() {
      this.stop();
      this.cancelRecording();
    }

    async startRecording() {

      this.recordingState.set('start');
      const audioChunks: Blob[] = [];
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      this.recorder = new MediaRecorder(stream);

      this.recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
        this.recordingMessage.set(`recording: ${audioChunks.length} chunks so far`);
      };

      this.recorder.onstart = () => {
        this.recordingMessage.set('Recording started from your microphone.');
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
            this.electronRenderService.SaveAudio(reader.result as ArrayBuffer).subscribe((fileName) => {
              this.recordingMessage.set(`File saved as ${fileName}`);
              audioChunks.splice(0, audioChunks.length);
            })
          };
          reader.readAsArrayBuffer(audioBlob);
        }
      };

      this.recorder.start();

    }
}
