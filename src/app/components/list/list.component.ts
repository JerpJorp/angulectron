import { Component, computed, signal } from '@angular/core';
import { ElectronRenderService } from '../../services/electronRender.service';
import { TranscriptInstance } from '../../classes/transcript-instance';
import {MatTableModule} from '@angular/material/table';
import { MarkdownModule } from 'ngx-markdown';
import { InstanceComponent } from '../instance/instance.component';
import { NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-transcription',
  standalone: true,
  imports: [
    MatTableModule,
    MarkdownModule,
    InstanceComponent,
    MatIconModule,
    MatButtonModule,
    NgIf,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent {

  instances = signal<TranscriptInstance[]>([]);
  instance = signal<TranscriptInstance | undefined>(undefined);

  displayedColumns: string[] = ['name', ];
  // displayedColumns: string[] = ['name', 'date', 'note', 'file'];
  constructor(private electronRenderService: ElectronRenderService) {
    this.refresh();
  }

  refresh() {
    this.electronRenderService.GetInstances().subscribe((instances) => {
      instances.forEach((i) => i.name = i.name === undefined || i.name.length === 0 ? i.date : i.name);
      this.instances.set(instances)
    });
  }

  deleteInstance() {

    const toDelete = this.instance();
    this.instance.set(undefined);
    if(toDelete) {
      this.electronRenderService.DeleteInstance(toDelete).subscribe(() => {
        this.refresh();
      })
    }
  }

  addInstance() {
    this.instance.set(TranscriptInstance.Factory())
  }

}
