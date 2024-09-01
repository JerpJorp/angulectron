import { Component, computed, Signal, signal, ViewChild } from '@angular/core';
import { ElectronRenderService } from '../../services/electronRender.service';
import { IAIConfig, ISettings } from '../../../../electron-ts/Utilities';
import { NgClass, NgFor, NgIf } from '@angular/common';
import {MatListModule} from '@angular/material/list';
import {MatButtonModule} from '@angular/material/button';
import {MatBadgeModule} from '@angular/material/badge';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatChipsModule} from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatListModule,
    MatButtonModule,
    MatBadgeModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule,
    NgFor,
    NgIf,
    NgClass,
    FormsModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {

  settings = signal<ISettings>({ AIConfigs: [], defaultChatProvider: '', defaultLiveTranscriptionProvider: '', defaultTranscribeProvider: '', interactions: []});
  providers = computed(() => this.settings()?.AIConfigs.map((p) => p.provider) );
  selectedProviderIndex = signal<number>(0);
  selectedProvider = computed<IAIConfig>(() => {
    const settings = this.settings();
    const sel = this.selectedProviderIndex();

    if (settings !== undefined && sel < settings.AIConfigs.length) {
      return settings.AIConfigs[sel];
    } else {
      return {provider: '', apiKey: '', chatModels: [], preferredChatModel: '', liveTranscribe: false, transcribe: false};
    }
  })

  dirty = signal(false);

  newModel = signal('');
  constructor(private electronRenderService: ElectronRenderService) {
      this.electronRenderService.GetSettings().subscribe((x) => this.settings.set(x));
  }

  saveChanges() {
    const s = this.settings();
    if (s) {
      this.electronRenderService.SaveSettings(s);
    }

  }

  publishChange() {
    this.dirty.set(true);
    this.settings.set(this.settings());
  }

  removeModelFromProvider(modelName: string): void {
    this.selectedProvider().chatModels = this.selectedProvider().chatModels.filter((x) => x !== modelName);
    this.publishChange()
  }
  addModelKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === "Tab") {
      const newModel = this.newModel();
      this.selectedProvider().chatModels.push(newModel);
      this.publishChange();
      this.newModel.set('');
      this.settings()?.defaultChatProvider
      this.settings()?.defaultLiveTranscriptionProvider
      this.settings()?.defaultTranscribeProvider
    }
  }


}
