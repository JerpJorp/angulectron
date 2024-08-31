import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranscriptionComponent } from './transcription.component';

describe('TranscriptionComponent', () => {
  let component: TranscriptionComponent;
  let fixture: ComponentFixture<TranscriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranscriptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TranscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
