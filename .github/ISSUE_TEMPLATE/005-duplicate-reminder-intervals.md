---
name: ⚡ Duplicate Reminder Checking Intervals
about: Performance issue with multiple components creating redundant intervals
title: "Remove duplicate reminder checking intervals across components"
labels: ["performance", "architecture", "medium", "refactor"]
assignees: []
---

## ⚡ Performance Issue Description

Multiple components (Goals, Stats, Calendar, Reminders) all create their own 30-second intervals for reminder checking, causing unnecessary resource usage and potential conflicts.

## 📍 Location

**Files:**
- `/src/app/features/goals/components/goals/goals.component.ts` (lines 181-185)
- `/src/app/features/statistics/components/stats/stats.component.ts` (lines 48-55)
- `/src/app/features/calendar/components/calendar/calendar.component.ts` (lines 81-87)
- `/src/app/features/reminders/components/reminders/reminders.component.ts` (lines 42-48)

## 🔍 Current Behavior

Each component creates its own interval:
```typescript
// In ngOnInit of each component
setInterval(() => {
  this.checkReminders();
}, 30000);
```

This results in:
- 4+ concurrent intervals running the same reminder check
- Unnecessary CPU usage and battery drain
- Potential race conditions
- Memory leaks if intervals aren't properly cleaned up

## ✅ Expected Behavior

- Single centralized reminder checking service
- One interval for the entire application
- Components subscribe to reminder events
- Proper cleanup and lifecycle management

## 🔧 Suggested Fix

**1. Create a centralized ReminderSchedulerService:**

```typescript
@Injectable({
  providedIn: 'root'
})
export class ReminderSchedulerService {
  private intervalId?: number;
  private readonly CHECK_INTERVAL = 30000; // 30 seconds
  
  constructor(
    private notificationService: NotificationService,
    private habitService: HabitService
  ) {}

  start(): void {
    if (this.intervalId) return; // Already running
    
    if (typeof window !== 'undefined') {
      this.intervalId = window.setInterval(() => {
        this.checkReminders();
      }, this.CHECK_INTERVAL);
      
      // Check immediately
      this.checkReminders();
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private checkReminders(): void {
    const habits = this.habitService.habits();
    this.notificationService.checkReminders(habits);
  }
}
```

**2. Initialize in app.config.ts:**

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    // ... existing providers
    {
      provide: APP_INITIALIZER,
      useFactory: (reminderScheduler: ReminderSchedulerService) => () => {
        reminderScheduler.start();
      },
      deps: [ReminderSchedulerService],
      multi: true
    }
  ]
};
```

**3. Remove intervals from individual components**

## 🚨 Impact

- **Severity:** Medium
- **Performance:** Reduced CPU usage and battery drain
- **Architecture:** Cleaner separation of concerns
- **Maintainability:** Single point of control for reminder scheduling

## 📋 Acceptance Criteria

- [ ] Single ReminderSchedulerService created
- [ ] All component-level intervals removed
- [ ] Service properly initialized at app startup
- [ ] Service properly cleaned up on app shutdown
- [ ] No regression in reminder functionality
- [ ] Performance improvement measurable in DevTools