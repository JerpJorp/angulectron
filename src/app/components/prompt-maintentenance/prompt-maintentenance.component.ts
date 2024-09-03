import { ChangeDetectionStrategy, Component, computed, OnInit, signal } from '@angular/core';
import { ElectronRenderService } from '../../services/electronRender.service';
import {  ISettings } from '../../../../electron-ts/utility-classes';
import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import {MatListModule} from '@angular/material/list';
import {MatButtonModule} from '@angular/material/button';
import {MatBadgeModule} from '@angular/material/badge';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatChipsModule} from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { Subject } from 'rxjs';

type interactionType = { name: string; prompt: string};

@Component({
  selector: 'app-prompt-maintentenance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatListModule,
    MatButtonModule,
    MatBadgeModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule,
    MatDividerModule,
    MatCardModule,
    NgFor,
    NgIf,
    NgClass,
    FormsModule,
    AsyncPipe,
  ],
  templateUrl: './prompt-maintentenance.component.html',
  styleUrl: './prompt-maintentenance.component.css'
})
export class PromptMaintentenanceComponent implements OnInit {

  settings$ = new Subject<ISettings>();
  settings: ISettings | undefined;
  interactions$ = new Subject<string[]>();
  interaction$ = new Subject<interactionType>();
  dirty$ = new Subject<boolean>();

  constructor(private electronRenderService: ElectronRenderService) { }

  ngOnInit(): void {
    this.refreshSettings();
  }

  refreshSettings() {
    this.electronRenderService.GetSettings().subscribe((s) => {
      if(s.interactions == undefined || s.interactions.length === 0) {
        s.interactions = [{name: 'New Interaction', prompt: ''}]
      }
      this.settings = s;
      this.initFromSettings(false);
    });
  }

  initFromSettings(dirty: boolean) {
    const s = this.settings;
    if (s) {
      this.settings$.next(s);
      this.interaction$.next(s.interactions[0]);
      setTimeout(() => {
        this.interactions$.next(s.interactions.map((i) => i.name));
      }, 0);


      this.dirty$.next(dirty);
    }
  }

  saveChanges() {
    if (this.settings) {
      this.electronRenderService.SaveSettings(this.settings);
      this.refreshSettings();
    }
  }

  publishChange() {
    this.dirty$.next(true);
  }

  selectInteraction(name: string) {
    if (this.settings) {
      const matching = this.settings.interactions.find((x) => x.name === name);
      if (matching) {
        this.interaction$.next(matching);
      }
    }
  }

  nameKeyDown(event: KeyboardEvent) {
    if (this.settings && event.key === "Enter" || event.key === "Tab") {
      setTimeout(() => {
        this.interactions$.next(this.settings!.interactions.map(x => x.name));
      }, 0);
    }
  }

  removeInteraction(interaction: interactionType): void {
    if (this.settings) {
      const idx = this.settings.interactions.findIndex((i) => i.name === interaction.name);
      if (idx > -1) {
        this.settings.interactions.splice(idx, 1);
        this.initFromSettings(true);
      }
    }
  }

  addInteraction() {
    if (this.settings) {
      this.settings.interactions.push({ name: 'new ', prompt: '' });
      this.initFromSettings(true);
      const i = this.settings.interactions;
      this.interaction$.next(i[i.length-1]);
    }

  }

}
