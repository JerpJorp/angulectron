import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveTranscriptSessionComponent } from './live-transcript-session.component';

describe('LiveTranscriptSessionComponent', () => {
  let component: LiveTranscriptSessionComponent;
  let fixture: ComponentFixture<LiveTranscriptSessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveTranscriptSessionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveTranscriptSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
