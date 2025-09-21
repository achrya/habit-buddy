---
name: 🔧 Memory Leak - Interval Cleanup
about: Inconsistent interval cleanup causing potential memory leaks
title: "Fix potential memory leaks from inconsistent interval cleanup"
labels: ["bug", "memory-leak", "medium", "cleanup"]
assignees: []
---

## 🔧 Memory Leak Issue Description

Interval cleanup in `ngOnDestroy` is not implemented consistently across all components that create intervals, leading to potential memory leaks and continued execution of reminder checks after components are destroyed.

## 📍 Location

**Files with interval issues:**
- `/src/app/features/goals/components/goals/goals.component.ts` (lines 192-196) ✅ Has cleanup
- `/src/app/features/statistics/components/stats/stats.component.ts` (lines 48-55) ❌ No cleanup
- `/src/app/features/calendar/components/calendar/calendar.component.ts` (lines 81-87) ❌ No cleanup  
- `/src/app/features/reminders/components/reminders/reminders.component.ts` (lines 42-48) ❌ No cleanup

## 🔍 Current Behavior

**GoalsComponent (Good example):**
```typescript
export class GoalsComponent implements OnInit, OnDestroy {
  private reminderCheckInterval?: number;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.reminderCheckInterval = window.setInterval(() => {
        this.checkReminders();
      }, 30000);
    }
  }

  ngOnDestroy(): void {
    if (this.reminderCheckInterval) {
      clearInterval(this.reminderCheckInterval);
    }
  }
}
```

**Other components (Problematic):**
```typescript
ngOnInit(): void {
  // ❌ No cleanup - memory leak potential
  setInterval(() => {
    this.checkReminders();
  }, 30000);
}
```

## 🚨 Problems

1. **Memory Leaks**: Intervals continue running after component destruction
2. **Unnecessary Processing**: Reminder checks continue when not needed
3. **Battery Drain**: Background intervals consume resources
4. **Potential Errors**: Accessing destroyed component properties

## ✅ Expected Behavior

- All intervals properly cleaned up in `ngOnDestroy`
- No background processing after component destruction
- Consistent interval management pattern across components

## 🔧 Suggested Fix

**1. Fix StatsComponent:**

```typescript
export class StatsComponent implements OnInit, OnDestroy {
  private reminderCheckInterval?: number;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.reminderCheckInterval = window.setInterval(() => {
        this.checkReminders();
      }, 30000);
    }
    this.checkReminders();
  }

  ngOnDestroy(): void {
    if (this.reminderCheckInterval) {
      clearInterval(this.reminderCheckInterval);
    }
  }
}
```

**2. Fix CalendarComponent:**

```typescript
export class CalendarComponent implements OnInit, OnDestroy {
  private reminderCheckInterval?: number;

  ngOnInit(): void {
    // ... existing query param logic
    
    if (typeof window !== 'undefined') {
      this.reminderCheckInterval = window.setInterval(() => {
        this.checkReminders();
      }, 30000);
    }
    this.checkReminders();
  }

  ngOnDestroy(): void {
    if (this.reminderCheckInterval) {
      clearInterval(this.reminderCheckInterval);
    }
  }
}
```

**3. Fix RemindersComponent:**

```typescript
export class RemindersComponent implements OnInit, OnDestroy {
  private reminderCheckInterval?: number;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.reminderCheckInterval = window.setInterval(() => {
        this.checkReminders();
      }, 30000);
    }
    this.checkReminders();
  }

  ngOnDestroy(): void {
    if (this.reminderCheckInterval) {
      clearInterval(this.reminderCheckInterval);
    }
  }
}
```

**4. Create reusable interval management mixin (Optional enhancement):**

```typescript
// shared/mixins/interval-manager.mixin.ts
export interface IntervalManager {
  intervals: Set<number>;
  createInterval(callback: () => void, delay: number): number;
  clearAllIntervals(): void;
}

export function withIntervalManager<T extends Constructor>(Base: T) {
  return class extends Base implements IntervalManager {
    intervals = new Set<number>();

    createInterval(callback: () => void, delay: number): number {
      if (typeof window === 'undefined') return -1;
      
      const intervalId = window.setInterval(callback, delay);
      this.intervals.add(intervalId);
      return intervalId;
    }

    clearInterval(intervalId: number): void {
      if (this.intervals.has(intervalId)) {
        clearInterval(intervalId);
        this.intervals.delete(intervalId);
      }
    }

    clearAllIntervals(): void {
      this.intervals.forEach(id => clearInterval(id));
      this.intervals.clear();
    }
  };
}

// Usage in components:
export class StatsComponent extends withIntervalManager(Component) implements OnInit, OnDestroy {
  ngOnInit(): void {
    this.createInterval(() => this.checkReminders(), 30000);
    this.checkReminders();
  }

  ngOnDestroy(): void {
    this.clearAllIntervals();
  }
}
```

## 🚨 Impact

- **Severity:** Medium
- **Memory Usage:** Prevents accumulating intervals in SPA navigation
- **Performance:** Eliminates unnecessary background processing
- **Battery Life:** Reduces power consumption on mobile devices

## 🧪 Testing

1. Navigate between components multiple times
2. Check browser DevTools for active intervals
3. Verify intervals are properly cleared on navigation
4. Monitor memory usage over time

## 📋 Acceptance Criteria

- [ ] All components with intervals implement OnDestroy
- [ ] Intervals properly stored and cleared in ngOnDestroy
- [ ] No memory leaks detectable in DevTools
- [ ] Background processing stops when components are destroyed
- [ ] Consistent interval management pattern across all components
- [ ] Optional: Implement reusable interval management solution