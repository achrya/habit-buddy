import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CalendarComponent } from './calendar.component';
import { HabitService } from '../../../../shared/services/habit.service';
import { NotificationService } from '../../../../shared/services/notification.service';

describe('CalendarComponent', () => {
  let component: CalendarComponent;
  let fixture: ComponentFixture<CalendarComponent>;
  let habitService: jasmine.SpyObj<HabitService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const habitServiceSpy = jasmine.createSpyObj('HabitService', ['toggleCheckinToday'], {
      habits$: of([])
    });
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['checkReminders']);

    await TestBed.configureTestingModule({
      imports: [CalendarComponent],
      providers: [
        { provide: HabitService, useValue: habitServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    habitService = TestBed.inject(HabitService) as jasmine.SpyObj<HabitService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to previous month', () => {
    const initialMonth = component.calendarMonth();
    component.previousMonth();
    expect(component.calendarMonth()).toBe(initialMonth === 0 ? 11 : initialMonth - 1);
  });

  it('should navigate to next month', () => {
    const initialMonth = component.calendarMonth();
    component.nextMonth();
    expect(component.calendarMonth()).toBe(initialMonth === 11 ? 0 : initialMonth + 1);
  });

  it('should set calendar mode', () => {
    component.setCalendarMode('test-habit-id');
    expect(component.calendarMode()).toBe('test-habit-id');
  });
});
