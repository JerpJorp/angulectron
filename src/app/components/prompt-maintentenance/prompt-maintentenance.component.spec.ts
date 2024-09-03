import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromptMaintentenanceComponent } from './prompt-maintentenance.component';

describe('PromptMaintentenanceComponent', () => {
  let component: PromptMaintentenanceComponent;
  let fixture: ComponentFixture<PromptMaintentenanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromptMaintentenanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PromptMaintentenanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
