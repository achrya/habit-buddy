import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { HabitService, NotificationService } from '../../../../shared';
import { GoalsComponent } from './goals.component';

describe('GoalsComponent', () => {
  let component: GoalsComponent;
  let fixture: ComponentFixture<GoalsComponent>;
  let habitService: jasmine.SpyObj<HabitService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const habitServiceSpy = jasmine.createSpyObj('HabitService', ['addHabit', 'removeHabit', 'toggleCheckinToday', 'calcStreaksForHabit'], {
      habits: of([]),
      habits$: of([])
    });
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['playBell', 'triggerConfetti', 'checkReminders']);

    await TestBed.configureTestingModule({
      imports: [GoalsComponent],
      providers: [
        { provide: HabitService, useValue: habitServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoalsComponent);
    component = fixture.componentInstance;
    habitService = TestBed.inject(HabitService) as jasmine.SpyObj<HabitService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add a habit when habitAdded event is triggered', () => {
    const mockHabit = { title: 'Test Habit', categoryId: '21' };
    const mockCreatedHabit = { id: '1', title: 'Test Habit', daysTarget: 21, categoryId: '21', color: '#ff6b6b', createdAt: '2023-01-01', checkIns: {}, reminder: null };
    
    habitService.addHabit.and.returnValue(mockCreatedHabit);
    
    (component as any).onHabitAdded(mockHabit);
    
    expect(habitService.addHabit).toHaveBeenCalledWith('Test Habit', 21, '21');
    expect(notificationService.playBell).toHaveBeenCalled();
    expect(notificationService.triggerConfetti).toHaveBeenCalled();
  });
});
