import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { ElectronRenderService } from '../../services/electronRender.service';
import { MarkdownModule } from 'ngx-markdown';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ISettings } from '../../../../electron-ts/utility-classes';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';


@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    MarkdownModule,
    NgIf,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
  ],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class WelcomeComponent {
  private _snackBar = inject(MatSnackBar);

  defaultConfig = false;
  password = '';

  constructor(private electronRenderService: ElectronRenderService) {
      this.electronRenderService.GetSettings().subscribe((settings) => {
        const keys = settings.AIConfigs.map(x => x.apiKey);
        const nonEmptyKeys = keys.filter(x => x.length > 0);
        if (nonEmptyKeys.length === 0) {
          // all api keys are blank - this is the default, and pretty much nothing will work
          this.defaultConfig = true;
        }
      })
  }

  getRemoteConfig() {
    this.electronRenderService.RemoteConfig().subscribe((x) => {
      const encrypted = x.content;
      try {
        this.electronRenderService.Decrypt(encrypted, this.password).subscribe((plain) => {
            const obj = JSON.parse(plain);
            const settings = obj.settings as ISettings;
            this.electronRenderService.SaveSettings(settings).subscribe(() => {
              this._snackBar.open('Settings updated', 'ok');
              this.defaultConfig = false;
            })
        },
        (error) => {
          this._snackBar.open('Incorrect password!', 'ok');
        })
      } catch (error) {
        this._snackBar.open('Incorrect password!', 'ok');
      }
    })
  }

}

