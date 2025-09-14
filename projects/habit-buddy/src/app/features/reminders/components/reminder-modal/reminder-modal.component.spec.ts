import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { ReminderModalComponent } from './reminder-modal.component';
import { Reminder } from '../../../../shared/models/habit.model';

describe('ReminderModalComponent', () => {
  let component: ReminderModalComponent;
  let fixture: ComponentFixture<ReminderModalComponent>;

  const mockReminder: Reminder = {
    time: '08:00',
    days: [1, 2, 3, 4, 5],
    window: 120
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReminderModalComponent, FormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReminderModalComponent);
    component = fixture.componentInstance;
    component.habitTitle.set('Test Habit');
    component.habitId.set('1');
    component.existingReminder = mockReminder;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle day selection', () => {
    const initialDays = component.selectedDays().length;
    component.toggleDay(0);
    
    expect(component.selectedDays().length).not.toBe(initialDays);
  });

  it('should check if day is selected', () => {
    component.selectedDays.set([1, 2, 3]);
    
    expect(component.isDaySelected(1)).toBe(true);
    expect(component.isDaySelected(0)).toBe(false);
  });

  it('should emit saveReminder event when save is called', () => {
    spyOn(component.saveReminder, 'emit');
    
    component.save();
    
    expect(component.saveReminder.emit).toHaveBeenCalled();
  });
});
