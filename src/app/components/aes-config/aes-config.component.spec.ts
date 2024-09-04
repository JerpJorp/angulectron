import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AesConfigComponent } from './aes-config.component';

describe('AesConfigComponent', () => {
  let component: AesConfigComponent;
  let fixture: ComponentFixture<AesConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AesConfigComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AesConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
