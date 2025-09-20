import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpOverlayComponent } from './help-overlay.component';

describe('HelpOverlayComponent', () => {
  let component: HelpOverlayComponent;
  let fixture: ComponentFixture<HelpOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpOverlayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HelpOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
