import { Component, inject, signal } from '@angular/core';
import { ElectronRenderService } from '../../services/electronRender.service';
import { ISettings, Utilities } from '../../../../electron-ts/utility-classes';

import { TranscriptInstance } from '../../classes/transcript-instance';
import { MatTableModule} from '@angular/material/table';
import { MarkdownModule } from 'ngx-markdown';
import { InstanceComponent } from '../instance/instance.component';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    MatTableModule,
    MarkdownModule,
    InstanceComponent,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    NgIf,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  private _snackBar = inject(MatSnackBar);

  instances = signal<TranscriptInstance[]>([]);
  instance = signal<TranscriptInstance | undefined>(undefined);

  response = '';
  additionalContent = signal('');
  currentQuestion = 'Given the following transcript content of a class lecture, what other information on the internet supplements the topics covered?';
  displayedColumns: string[] = ['name', ];
  settings!: ISettings;

  ref: MatSnackBarRef<TextOnlySnackBar> | undefined;
  // displayedColumns: string[] = ['name', 'date', 'note', 'file'];
  constructor(private electronRenderService: ElectronRenderService) {
    this.refresh();

    this.electronRenderService.pendingRequests$.subscribe((requests) => {
      if (this.ref) {
        try {
          this.ref.dismiss();
        } finally {
          this.ref = undefined;
        }
      }
      if (requests && requests.length > 0)
      this.ref = this._snackBar.open("Waiting for AI Cloud response.  Be patient, it can take a while ...", 'OK');
    });
  }

  refresh() {
    this.electronRenderService.GetInstances().subscribe((instances) => {
      instances.forEach((i) => i.name = i.name === undefined || i.name.length === 0 ? i.date : i.name);
      this.instances.set(instances.filter(i => i.transcript && i.transcript.length > 0))
    });
    this.electronRenderService.GetSettings().subscribe((settings) => {
        this.settings = settings;
    });
  }

  askCache() {

  }

  askCurrent() {

    const instance = this.instance();
    if (instance === undefined) {
      this._snackBar.open(
        'No instance transcript to query', 'ok', { duration: 800 }
      );
      return;
    }
    const perplexity = this.settings.AIConfigs.find(x => x.provider === Utilities.PERPLEXITY);
    if (perplexity === undefined) {
      this._snackBar.open(
        'Cannot find config for current events AI provider', 'ok', { duration: 800 }
      );
      return;
    }
    const model = perplexity.preferredChatModel || perplexity.chatModels[0];
    if (model === undefined) {
      this._snackBar.open(
        'Cannot determine model for current events AI', 'ok', { duration: 800 }
      );
      return;
    }

    const messages: {
      role: 'system' | 'user' | 'assistant';
      content: string;
    }[] = [];

    messages.push({ role: 'system', content: this.currentQuestion});
    messages.push({ role: 'user', content: instance.transcript});

    this.electronRenderService.LLMRequest(messages, perplexity, model).subscribe((response) => {
      if (response.error) {
        this._snackBar.open(
          `Current events request error: ${response.error}`, 'ok', { duration: 800 }
        );
      } else {
        this.response = response.text
      }
    })
  }

}
