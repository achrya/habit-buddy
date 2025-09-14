import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { StatsComponent } from './stats.component';
import { HabitService } from '../../../../shared/services/habit.service';
import { NotificationService } from '../../../../shared/services/notification.service';

describe('StatsComponent', () => {
  let component: StatsComponent;
  let fixture: ComponentFixture<StatsComponent>;
  let habitService: jasmine.SpyObj<HabitService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const habitServiceSpy = jasmine.createSpyObj('HabitService', [], {
      habits$: of([]),
      totalCompleted: () => 10,
      averageCompletion: () => 75,
      bestCurrentStreak: () => 5,
      bestLongestStreak: () => 15,
      weeklyTrend: () => ({ labels: ['Mon', 'Tue'], data: [2, 3] }),
      monthlyTrend: () => ({ labels: ['1', '2', '3'], data: [1, 2, 1] }),
      yearlyTrend: () => ({ labels: ['Jan 24', 'Feb 24'], data: [25, 30] })
    });
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['checkReminders']);

    await TestBed.configureTestingModule({
      imports: [StatsComponent],
      providers: [
        { provide: HabitService, useValue: habitServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatsComponent);
    component = fixture.componentInstance;
    habitService = TestBed.inject(HabitService) as jasmine.SpyObj<HabitService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display stats from habit service', () => {
    const totalCompletedElement = fixture.debugElement.nativeElement.querySelector('.text-2xl');
    expect(totalCompletedElement.textContent).toContain('10');
  });

  it('should start with weekly view by default', () => {
    expect((component as any).currentView()).toBe('weekly');
  });

  it('should switch to monthly view when requested', () => {
    (component as any).switchView('monthly');
    expect((component as any).currentView()).toBe('monthly');
  });

  it('should return weekly trend when in weekly view', () => {
    const trend = (component as any).getCurrentTrend();
    expect(trend).toEqual({ labels: ['Mon', 'Tue'], data: [2, 3] });
  });

  it('should return monthly trend when in monthly view', () => {
    (component as any).switchView('monthly');
    const trend = (component as any).getCurrentTrend();
    expect(trend).toEqual({ labels: ['1', '2', '3'], data: [1, 2, 1] });
  });

  it('should return yearly trend when in yearly view', () => {
    (component as any).switchView('yearly');
    const trend = (component as any).getCurrentTrend();
    expect(trend).toEqual({ labels: ['Jan 24', 'Feb 24'], data: [25, 30] });
  });
});
