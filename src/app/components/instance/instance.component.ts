import { Component, EventEmitter, inject, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';

import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { debounceTime, Observable, of, pipe, Subject, Subscription, switchMap, tap } from 'rxjs';

import { MarkdownModule } from 'ngx-markdown';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { ISettings, Utilities } from '../../../../electron-ts/utility-classes';
import { TranscriptInstance } from '../../classes/transcript-instance';
import { ElectronRenderService } from '../../services/electronRender.service';
import { TagsSelectComponent } from '../tags-select/tags-select.component';

@Component({
  selector: 'app-instance',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MatAutocompleteModule,
    MatTabsModule,
    MatButtonModule,
    MarkdownModule,
    MatButtonToggleModule,
    MatDividerModule,
    MatIconModule,
    MatChipsModule,
    TagsSelectComponent,
  ],
  templateUrl: './instance.component.html',
  styleUrl: './instance.component.css'
})
export class InstanceComponent implements OnChanges, OnDestroy {
  private _snackBar = inject(MatSnackBar);

  @Input() instance!: TranscriptInstance
  @Input() pending = false;
  @Input() forceDirty = false;
  @Output() saved = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  displayMode: 'edit' | 'markdown' = 'edit';

  view: string = 'note' //  note, transcript, or interaction name
  settings: ISettings = Utilities.DefaultSettings();
  markdownJSON = '';
  interactions: { [index: string]: string } = {};
  tagsSub$: Subscription;
  tags: string[] = [];
  visibleTags: string[] = [];

  markdownContent: string | undefined;
  interactionNames: string[] = []
  dirty = false;
  intialized = false;
  invalidFile = false;
  deleteAreYouSure = false;
  newTag = '';
  dirty$ = new Subject<void>();

  ref: MatSnackBarRef<TextOnlySnackBar> | undefined;

  constructor(private electronRenderService: ElectronRenderService) {

    this.dirty$.pipe(debounceTime(1500)).subscribe(() => this.saveInstance());

    this.electronRenderService.GetSettings().subscribe((s) => {
      this.settings = s;
      this.intialized = true;
      this.buildInteractions();
    });

    this.tagsSub$ = this.electronRenderService.tags$.subscribe(tags => {
      this.tags = tags;
      this.filterTags();
    });

    this.electronRenderService.pendingRequests$.subscribe((requests) => {
      if (this.ref) {
        try {
          this.ref.dismiss();
        } finally {
          this.ref = undefined;
        }
      }

      if (requests && requests.length > 0) {
        this.ref = this._snackBar.open("Waiting for AI Cloud response.  Be patient, it can take a while ...", 'OK');
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['instance'] && this.intialized) {
      this.dirty = false;
      this.buildInteractions();
      this.setMarkDownText();
    }
    if (changes['forceDirty'] && this.forceDirty) {
      this.dirty = true;
    }

  }

  ngOnDestroy(): void {
    this.tagsSub$.unsubscribe();
  }

  isInteractionName(name: string) {
    const isName = this.interactionNames.find(x => x === name) !== undefined;
    return isName;
  }

  checkFile() {
    this.invalidFile = false;
    if (this.instance.file && this.instance.file.length > 0) {
      this.instance.file = this.instance.file.replaceAll('"','');
        this.electronRenderService.FileExists(this.instance.file).subscribe((exists) => this.invalidFile = exists === false)
    }
  }

  buildInteractions() {
    this.checkFile();
    this.interactions = {};
    this.interactionNames = [];
    if(this.instance !== undefined) {
      this.settings.interactions.forEach((i) => {
          const matching =  this.instance.interactions.find((x) => x.name === i.name)
          this.interactions[i.name] = matching ? matching.value : '';
          this.interactionNames.push(i.name);
      });
    }
  }

  fileKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === "Tab") {
      this.checkFile();
    }
  }

  filterTags() {
    if (this.newTag.length > 0) {
        const tag = this.newTag.toLocaleUpperCase();
        this.visibleTags = this.tags
          .map(t => t.toLocaleUpperCase())
          .filter(t => t.indexOf(tag) > -1)
          .filter(t => this.instance.tags.indexOf(t) === -1)
    }
  }

  removeTag(tag: string) {
    this.instance.tags = this.instance.tags.filter(x => x !== tag);
    this.filterTags();
    this.dirty$.next();
  }

  addTagKeyDown(event: KeyboardEvent) {
    if (this.newTag.length > 0 && event.key === "Enter" || event.key === "Tab") {
      this.instance.tags.push(this.newTag.toLocaleUpperCase());
      this.newTag = '';
      this.filterTags();
      this.dirty$.next();
    }
  }

  openfile() {
    if (this.instance.file && this.instance.file.length) {
        const file = this.instance.file;
        this.electronRenderService.FileExists(file).subscribe((exists) => {
            if (!exists) {
              this._snackBar.open(`File ${file} does not exist`);
            } else {
              this.electronRenderService.OpenFile(file).subscribe(() => {
                console.log(`opened ${file}`);
              })
            }
        });
    }
  }
  changeDisplayMode() {
    this.setMarkDownText();
  }

  changeView() {
    let thing = ''
    if (this.view === 'transcript') {
      thing = this.instance.transcript;
    } else if (this.view === 'note') {
      thing = this.instance.note;
    } else {
      thing = this.interactions[this.view];
    }

    this.displayMode = this.hasStuff(thing) ? 'markdown' : 'edit';
    this.setMarkDownText();
  }
  hasStuff(thing: string | undefined): boolean {
      return thing !== undefined && thing?.trim().length > 0;
  }

  setMarkDownText() {
    this.markdownContent = undefined;
    if (this.displayMode === 'markdown' || this.view === 'raw') {
      if (this.isInteractionName(this.view)) {
        this.markdownContent = this.interactions[this.view];
      } else if (this.view === 'note') {
        this.markdownContent = this.instance.note;
      } else if (this.view === 'transcript') {
        this.markdownContent = this.instance.transcript;
      } else if (this.view === 'raw') {
        this.markdownContent =
          `\`\`\`json\n${JSON.stringify(this.instance, null, 2)}\n\`\`\`\n `
      }
    }
  }

  publishChanges(timer = true) {
    this.dirty = true;
    if (timer) {
      this.dirty$.next();
    }
  }

  saveInstance() {

    Object.keys(this.interactions).forEach((k) =>  {
        const matching = this.instance.interactions.find((x) => x.name === k);
        const value = this.interactions[k];
        if (matching) {
          if (this.instance.history === undefined) {
            this.instance.history = [];
          }
          this.instance.history.push({
            message: `Updating value for ${k}:  old value:`,
            value: matching.value,
          });

          matching.value = value;
        } else {
          this.instance.interactions.push({ name: k, value: value })
        }
    })

    this.electronRenderService.SaveInstance(this.instance);
    this.saved.emit();
    this.dirty = false;
  }

  runTranscribe() {

    if (this.instance === undefined) {
      return;
    }
    if (this.instance.file === undefined) {
      return;
    }

    const instance = this.instance;
    const file = this.instance.file;

    this.electronRenderService.FileExists(file).subscribe((exists) => {
      if (!exists) {
        this._snackBar.open(`unable to transcribe file ${file} as it does not exist.`);
      } else {

        const obs$: Observable<string> = file.endsWith('_compressed.mp3') ?
          of(file) :
          of(this._snackBar.open(`Compressing audio.  Long audio files may take a while`, 'OK',  {duration: 3000})).pipe(switchMap(() => {
            return this.electronRenderService.CompressAudio(file, 24).pipe(tap((compressed) => {
              this.instance.file = compressed;
              this.dirty$.next();
            }));
          }));

        obs$.subscribe((file) => {
          this.electronRenderService.Transcribe(this.instance, file).subscribe((response) => {
            if (response.error) {
              this._snackBar.open(`ERROR: ${response.error}`)
            } else {
              if (this.instance.id === instance.id) {
                this.dirty$.next();
                if (this.view === 'transcript') {
                  this.changeView();
                }
              }
            }
          });
        })
      }
    })

  }

  runInteraction(name: string) {

    const transcript = this.instance?.transcript;
    if (transcript === undefined || transcript.length === 0) {
      this._snackBar.open('No transcript for AI interaction.');
    } else if (transcript.length < 200) {
      this._snackBar.open('Transcript length is too short for AI interaction.');
    } else {
      const interaction = this.settings.interactions.find(x => x.name === name);
      if (interaction === undefined) {
        this._snackBar.open(`No interaction rule found for "${name}"`);
      } else {
        const instance = this.instance;
        this.electronRenderService.Interaction(instance, name, interaction.prompt, transcript).subscribe((response) => {
           if (response.error) {
            this._snackBar.open(`ERROR: ${response.error}`)
           } else {
            this.dirty = true;
            if (this.instance.id === instance.id) {
              this.interactions[name] = response.text;
              this.saveInstance();
              if (this.view === name) {
                this.changeView();
              }
            }
           }
        })
      }

    }

  }

  deleteClick() {
    this.deleteAreYouSure = true;
    this._snackBar.open(
      'Deleting is permanent: Audio files will remaing on your PC, but everything else will have to be recreated',
      'I know',
      {duration: 1500})
  }

  nevermind() {
    this.deleteAreYouSure = false;
  }

  reallyDelete() {
    this.deleteAreYouSure = false;
    this.delete.emit();

  }
}
