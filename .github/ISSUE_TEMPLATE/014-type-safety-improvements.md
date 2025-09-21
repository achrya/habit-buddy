---
name: 🔒 Type Safety Improvements
about: Loose typing in several critical methods causing potential runtime errors
title: "Fix type safety issues across services and components"
labels: ["typescript", "type-safety", "medium", "refactor"]
assignees: []
---

## 🔒 Type Safety Issue Description

Several methods have loose typing that could lead to runtime errors and reduces code maintainability. The most critical is `NotificationService.checkReminders()` accepting `any[]` instead of `Habit[]`.

## 📍 Location

**Files with type safety issues:**
- `/src/app/shared/services/notification.service.ts` (line 76)
- `/src/app/shared/services/habit.service.ts` (various methods)
- Component event handlers with loose typing

## 🔍 Current Behavior

**1. NotificationService.checkReminders():**
```typescript
checkReminders(habits: any[]): void {  // ❌ Should be Habit[]
  if (typeof window === 'undefined') return;
  
  habits.forEach(habit => {
    if (!habit.reminder) return;  // No type safety for habit properties
    // ... rest of method
  });
}
```

**2. Loose event handler typing:**
```typescript
// In various components
protected onSomeEvent(event: any): void {  // ❌ Should be specific type
  // ...
}
```

**3. Generic object types:**
```typescript
// In various places
const config: any = { ... };  // ❌ Should have proper interface
```

## ✅ Expected Behavior

- Strong typing throughout the codebase
- Proper interfaces for all data structures
- Type-safe event handlers
- No use of `any` type except where absolutely necessary

## 🔧 Suggested Fix

**1. Fix NotificationService typing:**

```typescript
import { Habit } from '../models/habit.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  checkReminders(habits: Habit[]): void {
    if (typeof window === 'undefined') return;
    
    const now = new Date();
    const minsNow = now.getHours() * 60 + now.getMinutes();
    const weekday = now.getDay();

    habits.forEach(habit => {
      if (!habit.reminder) return;
      if (!habit.reminder.days.includes(weekday)) return;

      const lastNotifiedKey = `hb_notified_${habit.id}_${now.toISOString().slice(0, 16)}`;
      if (localStorage.getItem(lastNotifiedKey)) return;

      const target = this.hhmmToMins(habit.reminder.time);
      const diff = Math.min(
        Math.abs(minsNow - target),
        24 * 60 - Math.abs(minsNow - target)
      );

      if (diff <= (habit.reminder.window || 120) / 2) {
        this.notify(`Reminder: ${habit.title}`, `Time to ${habit.title}`);
        this.playBell();
        this.triggerConfetti();
        localStorage.setItem(lastNotifiedKey, '1');
      }
    });
  }
}
```

**2. Create proper interfaces for configuration objects:**

```typescript
// shared/models/notification.model.ts
export interface NotificationOptions {
  title: string;
  body: string;
  silent?: boolean;
  icon?: string;
}

export interface AudioContextConfig {
  type: OscillatorType;
  frequency: number;
  gain: number;
  duration: number;
}

export interface ConfettiConfig {
  particleCount: number;
  spread: number;
  origin: { y: number };
}
```

**3. Fix HabitService method signatures:**

```typescript
export class HabitService {
  // Strong typing for method parameters
  addHabit(title: string, reminder?: Reminder | null): Habit {
    if (!title || typeof title !== 'string') {
      throw new Error('Title must be a non-empty string');
    }
    
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

    const updatedHabits = [habit, ...this.habits()];
    this.habitsSubject.next(updatedHabits);
    return habit;
  }

  // Proper return type specification
  async toggleCheckinToday(habitId: string): Promise<CheckinResult> {
    const habit = this.habits().find(h => h.id === habitId);
    if (!habit) {
      return { success: false, message: 'Habit not found.' };
    }
    // ... rest of method
  }

  // Strong typing for utility methods
  private pickColor(index: number): string {
    if (typeof index !== 'number' || index < 0) {
      throw new Error('Index must be a non-negative number');
    }
    return this.COLORS[index % this.COLORS.length];
  }
}

// Define result interfaces
export interface CheckinResult {
  success: boolean;
  message?: string;
}
```

**4. Fix component event handlers:**

```typescript
// Instead of generic any
protected onHabitAdded(event: any): void { ... }

// Use specific types
export interface HabitAddedEvent {
  title: string;
  reminder?: Reminder | null;
}

protected onHabitAdded(event: HabitAddedEvent): void {
  const newHabit = this.habitService.addHabit(event.title, event.reminder);
  // ... rest of method
}
```

**5. Add strict TypeScript configuration:**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**6. Create type guards for runtime validation:**

```typescript
// shared/utils/type-guards.ts
export function isHabit(obj: any): obj is Habit {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.daysTarget === 'number' &&
    typeof obj.color === 'string' &&
    typeof obj.createdAt === 'string' &&
    typeof obj.checkIns === 'object'
  );
}

export function isReminder(obj: any): obj is Reminder {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.time === 'string' &&
    Array.isArray(obj.days) &&
    typeof obj.window === 'number'
  );
}

// Usage in services
checkReminders(habits: unknown[]): void {
  const validHabits = habits.filter(isHabit);
  // ... process validHabits with full type safety
}
```

## 🚨 Impact

- **Severity:** Medium
- **Code Quality:** Significantly improved maintainability and reliability
- **Developer Experience:** Better IDE support and error catching
- **Runtime Safety:** Fewer potential runtime errors

## 📋 Acceptance Criteria

- [ ] Remove all unnecessary `any` types
- [ ] Add proper interfaces for all data structures
- [ ] Update method signatures with specific types
- [ ] Add type guards for runtime validation where needed
- [ ] Enable strict TypeScript compiler options
- [ ] Ensure no type-related runtime errors
- [ ] All components and services have proper typing