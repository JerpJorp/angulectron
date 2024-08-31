import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ElectronRenderService } from './services/electronRender.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'angulectron';
  constructor(private electronRenderService: ElectronRenderService) {
    this.electronRenderService.Ping().subscribe((x) => {
       this.title = `Angulectron: ${x}`;
    })
  }
}
