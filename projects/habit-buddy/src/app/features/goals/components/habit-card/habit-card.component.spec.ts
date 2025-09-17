import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HabitCardComponent } from './habit-card.component';
import { Habit, HabitStats } from '../../../../shared/models/habit.model';

describe('HabitCardComponent', () => {
  let component: HabitCardComponent;
  let fixture: ComponentFixture<HabitCardComponent>;

  const mockHabit: Habit = {
    id: '1',
    title: 'Test Habit',
    daysTarget: 21,
    categoryId: '21',
    color: '#ff6b6b',
    createdAt: '2023-01-01',
    checkIns: {},
    reminder: null
  };

  const mockStats: HabitStats = {
    current: 5,
    longest: 10
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabitCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HabitCardComponent);
    component = fixture.componentInstance;
    component.habit = mockHabit;
    component.stats = mockStats;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display habit title', () => {
    const titleElement = fixture.debugElement.nativeElement.querySelector('h3');
    expect(titleElement.textContent).toContain('Test Habit');
  });

  it('should emit checkin event when checkin button is clicked', () => {
    spyOn(component.checkin, 'emit');
    
    const checkinButton = fixture.debugElement.nativeElement.querySelector('button');
    checkinButton.click();
    
    expect(component.checkin.emit).toHaveBeenCalled();
  });

  it('should emit remove event when remove button is clicked', () => {
    spyOn(component.remove, 'emit');
    
    const buttons = fixture.debugElement.nativeElement.querySelectorAll('button');
    const removeButton = buttons[buttons.length - 1];
    removeButton.click();
    
    expect(component.remove.emit).toHaveBeenCalled();
  });
});