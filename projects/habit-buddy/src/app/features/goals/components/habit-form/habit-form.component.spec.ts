import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { HabitFormComponent } from './habit-form.component';

describe('HabitFormComponent', () => {
  let component: HabitFormComponent;
  let fixture: ComponentFixture<HabitFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabitFormComponent, FormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HabitFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit habitAdded event when form is submitted', () => {
    spyOn(component.habitAdded, 'emit');
    
    component.title.set('Test Habit');
    component.onSubmit();
    
    expect(component.habitAdded.emit).toHaveBeenCalledWith({
      title: 'Test Habit',
      reminder: null
    });
  });

  it('should reset form after submission', () => {
    component.title.set('Test Habit');
    component.onSubmit();
    
    expect(component.title()).toBe('');
    expect(component.reminder()).toBe(null);
  });

  it('should disable buttons when input is empty', () => {
    component.title.set('');
    expect(component.hasInputContent).toBe(false);
  });

  it('should enable buttons when input has content', () => {
    component.title.set('Test Habit');
    expect(component.hasInputContent).toBe(true);
  });
});
