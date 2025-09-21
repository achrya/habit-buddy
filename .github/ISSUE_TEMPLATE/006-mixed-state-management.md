---
name: 🏗️ Mixed State Management Patterns
about: Architecture issue with BehaviorSubject and signals used together
title: "Fix mixed state management patterns in HabitService"
labels: ["architecture", "medium", "refactor", "state-management"]
assignees: []
---

## 🏗️ Architecture Issue Description

The `HabitService` uses both RxJS `BehaviorSubject` and Angular signals for the same data, creating potential synchronization issues and architectural inconsistency.

## 📍 Location

**File:** `/src/app/shared/services/habit.service.ts`
**Lines:** 15-17, 119-122

## 🔍 Current Behavior

```typescript
export class HabitService {
  // Uses BehaviorSubject
  private habitsSubject = new BehaviorSubject<Habit[]>(this.loadHabits());
  public habits$ = this.habitsSubject.asObservable();
  
  // Also uses signals for the same data
  public habits = signal(this.habitsSubject.value);

  constructor() {
    // Manual synchronization required
    this.habits$.subscribe(habits => {
      this.habits.set(habits);
      this.saveHabits(habits);
    });
  }
}
```

## 🚨 Problems

1. **Dual State Sources**: Same data managed by two different reactive systems
2. **Manual Synchronization**: Requires manual subscription to keep signals in sync
3. **Memory Overhead**: Duplicate state storage
4. **Potential Race Conditions**: Updates to one system might not immediately reflect in the other
5. **Architectural Inconsistency**: Mixing paradigms makes code harder to maintain

## ✅ Expected Behavior

Choose one consistent state management approach:
- **Option A**: Pure signals (recommended for Angular 17+)
- **Option B**: Pure RxJS observables

## 🔧 Suggested Fix

**Option A: Migrate to Pure Signals (Recommended)**

```typescript
@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private readonly LS_KEY = 'habitbuddy_v2_local';
  
  // Single source of truth using signals
  public habits = signal(this.loadHabits());

  // Computed signals for derived state
  public totalCompleted = computed(() => 
    this.habits().reduce((sum, habit) => sum + Object.keys(habit.checkIns || {}).length, 0)
  );

  public averageCompletion = computed(() => {
    const habits = this.habits();
    if (habits.length === 0) return 0;
    const totalCompletion = habits.reduce((sum, habit) => {
      const completed = Object.keys(habit.checkIns || {}).length;
      return sum + (completed / habit.daysTarget * 100);
    }, 0);
    return Math.round(totalCompletion / habits.length);
  });

  constructor() {
    // Auto-save when habits change
    effect(() => {
      this.saveHabits(this.habits());
    });
  }

  addHabit(title: string, reminder?: Reminder | null): Habit {
    const habit: Habit = {
      id: this.generateId(),
      title: title.trim(),
      daysTarget: 30,
      color: this.pickColor(this.habits().length),
      createdAt: new Date().toISOString().slice(0, 10),
      checkIns: {},
      reminder: reminder || null,
      badge: null
    };

    this.habits.update(habits => [habit, ...habits]);
    return habit;
  }

  removeHabit(id: string): void {
    this.habits.update(habits => habits.filter(habit => habit.id !== id));
  }

  updateHabitsList(habits: Habit[]): void {
    this.habits.set(habits);
  }
}
```

**Option B: Pure RxJS (Alternative)**

```typescript
@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private habitsSubject = new BehaviorSubject<Habit[]>(this.loadHabits());
  public habits$ = this.habitsSubject.asObservable();

  // Computed observables
  public totalCompleted$ = this.habits$.pipe(
    map(habits => habits.reduce((sum, habit) => sum + Object.keys(habit.checkIns || {}).length, 0))
  );

  public averageCompletion$ = this.habits$.pipe(
    map(habits => {
      if (habits.length === 0) return 0;
      const totalCompletion = habits.reduce((sum, habit) => {
        const completed = Object.keys(habit.checkIns || {}).length;
        return sum + (completed / habit.daysTarget * 100);
      }, 0);
      return Math.round(totalCompletion / habits.length);
    })
  );

  constructor() {
    this.habits$.subscribe(habits => this.saveHabits(habits));
  }
}
```

## 🚨 Impact

- **Severity:** Medium
- **Architecture:** Improves consistency and maintainability
- **Performance:** Reduces memory overhead and eliminates manual synchronization
- **Developer Experience:** Clearer, more predictable state management

## 📋 Acceptance Criteria

- [ ] Choose and implement single state management approach
- [ ] Remove manual synchronization code
- [ ] Update all components to use consistent API
- [ ] Ensure no regression in functionality
- [ ] Update computed values to use chosen approach
- [ ] Add unit tests for state management