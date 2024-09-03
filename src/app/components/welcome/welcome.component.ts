import { Component, signal } from '@angular/core';
import { ElectronRenderService } from '../../services/electronRender.service';
import { MarkdownModule } from 'ngx-markdown';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [ MarkdownModule, NgIf ],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {

    mardownSrc = signal<string | undefined>(undefined);

    constructor(private electronRenderService: ElectronRenderService) {
      this.electronRenderService.AssetsDir().subscribe((assetsDir) => {
        this.mardownSrc.set(`${assetsDir}/welcome.md`)
      })
    }
}
