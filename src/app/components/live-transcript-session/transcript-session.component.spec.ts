import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranscriptSessionComponent } from './transcript-session.component';

describe('TranscriptSessionComponent', () => {
  let component: TranscriptSessionComponent;
  let fixture: ComponentFixture<TranscriptSessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranscriptSessionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TranscriptSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
