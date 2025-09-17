import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogComponent } from './dialog.component';

describe('DialogComponent', () => {
  let component: DialogComponent;
  let fixture: ComponentFixture<DialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close event when backdrop is clicked', () => {
    spyOn(component.close, 'emit');
    
    const backdropEvent = new Event('click');
    Object.defineProperty(backdropEvent, 'target', { value: backdropEvent.currentTarget });
    
    component.onBackdropClick(backdropEvent);
    
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit buttonClick event with correct action', () => {
    spyOn(component.buttonClick, 'emit');
    
    component.onButtonClick('test-action');
    
    expect(component.buttonClick.emit).toHaveBeenCalledWith('test-action');
  });

  it('should return correct button classes for different variants', () => {
    const primaryClasses = component.getButtonClasses('primary');
    const dangerClasses = component.getButtonClasses('danger');
    const secondaryClasses = component.getButtonClasses('secondary');

    expect(primaryClasses).toContain('bg-blue-600');
    expect(dangerClasses).toContain('bg-red-600');
    expect(secondaryClasses).toContain('bg-slate-100');
  });
});
