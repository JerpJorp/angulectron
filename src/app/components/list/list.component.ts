import { Component, computed, OnDestroy, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { NgClass, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';

import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ElectronRenderService } from '../../services/electronRender.service';
import { TranscriptInstance } from '../../classes/transcript-instance';
import { InstanceComponent } from '../instance/instance.component';
import { TagsSelectComponent } from '../tags-select/tags-select.component';

@Component({
  selector: 'app-transcription',
  standalone: true,
  imports: [
    MatTableModule,
    MarkdownModule,
    InstanceComponent,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    NgIf,
    NgClass,
    TagsSelectComponent,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent {

  instances = signal<TranscriptInstance[]>([]);
  filterTags = signal<string[]>([]);
  filteredInstances = computed(() => {
    const i = this.instances();
    const list = this.filterTags();
    return list.length === 0 ? i :  i.filter(x => x.tags && x.tags.filter(t => list.find(x =>   x === t) !== undefined).length === list.length);
  });
  instance = signal<TranscriptInstance | undefined>(undefined);
  displayedColumns: string[] = ['name', ];
  tagThing: { tags: string[] } = { tags: [] };
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

  filterList() {
    console.log(this.filterTags());
    console.log(this.tagThing.tags);
    console.log('....')
    this.filterTags.set([...this.tagThing.tags]);
  }

}
