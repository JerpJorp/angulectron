import { Component, signal } from '@angular/core';
import { ElectronRenderService } from '../../services/electronRender.service';
import { TranscriptInstance } from '../../classes/transcript-instance';
import {MatTableModule} from '@angular/material/table';
@Component({
  selector: 'app-transcription',
  standalone: true,
  imports: [
    MatTableModule
  ],
  templateUrl: './transcription.component.html',
  styleUrl: './transcription.component.css'
})
export class TranscriptionComponent {

  instances = signal<TranscriptInstance[]>([]);
  displayedColumns: string[] = ['name', 'date', 'note', 'file'];
  constructor(private electronRenderService: ElectronRenderService) {
    this.electronRenderService.GetInstances().subscribe((instances) => this.instances.set(instances));
  }

}
