import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { RemindersComponent } from './reminders.component';
import { HabitService } from '../../../../shared/services/habit.service';
import { NotificationService } from '../../../../shared/services/notification.service';

describe('RemindersComponent', () => {
  let component: RemindersComponent;
  let fixture: ComponentFixture<RemindersComponent>;
  let habitService: jasmine.SpyObj<HabitService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const habitServiceSpy = jasmine.createSpyObj('HabitService', ['getHabitsWithReminders'], {
      habits$: of([])
    });
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['checkReminders']);

    habitServiceSpy.getHabitsWithReminders.and.returnValue([]);

    await TestBed.configureTestingModule({
      imports: [RemindersComponent],
      providers: [
        { provide: HabitService, useValue: habitServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemindersComponent);
    component = fixture.componentInstance;
    habitService = TestBed.inject(HabitService) as jasmine.SpyObj<HabitService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display empty state when no reminders', () => {
    const emptyState = fixture.debugElement.nativeElement.querySelector('.p-4.text-slate-400');
    expect(emptyState.textContent).toContain('No reminders set');
  });

  it('should get days text correctly', () => {
    const days = [1, 2, 3, 4, 5];
    const result = component.getDaysText(days);
    expect(result).toBe('Mon, Tue, Wed, Thu, Fri');
  });
});
