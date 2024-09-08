import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormsModule } from '@angular/forms'

import { Subscription } from 'rxjs';

import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';

import { ElectronRenderService } from '../../services/electronRender.service';
import { NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-tags-select',
  standalone: true,
  imports: [
    FormsModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    NgFor,
    NgIf,
    MatButtonModule,
  ],
  templateUrl: './tags-select.component.html',
  styleUrl: './tags-select.component.css'
})
export class TagsSelectComponent implements OnDestroy {
  @Input() title = 'Tags'
  @Input() tagThing!: ITagThing
  @Output() changed = new EventEmitter<void>();

    tags: string[] = [];
    visibleTags: string[] = [];
    newTag = '';
    tagsSub$: Subscription;

    constructor(private electronRenderService: ElectronRenderService) {
        this.tagsSub$ = this.electronRenderService.tags$.subscribe(x => {
          this.tags = x;
          this.visibleTags = x;
        })
    }

    ngOnDestroy(): void {
      this.tagsSub$.unsubscribe();
    }

    removeTag(tag: string) {
      this.tagThing.tags = this.tagThing.tags.filter(x => x!== tag);
      this.changed.emit();
    }
    filterTags() {
      if (this.newTag.length > 0) {
          const tag = this.newTag.toLocaleUpperCase();
          this.visibleTags = this.tags
            .map(t => t.toLocaleUpperCase())
            .filter(t => t.indexOf(tag) > -1)
            .filter(t => this.tagThing.tags.indexOf(t) === -1)
      }
    }

    addTagKeyDown(event: KeyboardEvent) {
      if (this.newTag.length > 0 && event.key === "Enter" || event.key === "Tab") {
        const newTag = this.newTag.toLocaleUpperCase();
        this.newTag = '';
        if (this.tagThing.tags.find(t => t === newTag) === undefined) {
          this.tagThing.tags.push(newTag);
          this.changed.emit();
        }
      }
    }
}

export interface ITagThing {
  tags: string[];
}
