---
name: 🐛 Reminder Window Validation Bug
about: Incorrect time window calculation for check-ins
title: "Fix reminder window validation logic in canCheckIn method"
labels: ["bug", "high", "logic-error", "reminders"]
assignees: []
---

## 🐛 Bug Description

The reminder window validation in `canCheckIn` method has incorrect logic that may allow check-ins outside the intended time window or block valid check-ins within the window.

## 📍 Location

**File:** `/src/app/shared/services/habit.service.ts`
**Method:** `canCheckIn()` (lines 233-265)

## 🔍 Current Behavior

```typescript
const diff = Math.min(
  Math.abs(minsNow - target),
  24 * 60 - Math.abs(minsNow - target)
);

if (diff > window / 2) {
  return { ok: false, msg: `Check-in allowed only within ${Math.round(window / 60 * 100) / 100}h window around reminder.` };
}
```

Issues with current logic:
1. The window calculation doesn't properly handle time boundaries (e.g., around midnight)
2. Using `window / 2` suggests the window should be centered around the target time, but this isn't clearly documented
3. The circular time calculation may not work correctly for all time ranges

## ✅ Expected Behavior

- Check-ins should be allowed within a specified time window around the reminder time
- Window calculation should properly handle day boundaries
- Clear documentation of whether window is total duration or radius around target time

## 🔧 Suggested Fix

```typescript
private canCheckIn(habit: Habit): { ok: boolean; msg?: string } {
  if (this.hasClockTampering()) {
    return { ok: false, msg: 'Clock tampering detected. Check-in disabled.' };
  }

  const today = this.getTodayString();
  if (habit.checkIns && habit.checkIns[today]) {
    return { ok: false, msg: 'Already checked in today.' };
  }

  if (habit.reminder) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = this.hhmmToMins(habit.reminder.time);
    const windowMinutes = habit.reminder.window || this.DEFAULT_WINDOW_MIN;
    const weekday = now.getDay();

    if (!habit.reminder.days.includes(weekday)) {
      return { ok: false, msg: 'Today is not a scheduled reminder day for this habit.' };
    }

    // Calculate the minimum distance considering 24-hour wrap-around
    const directDiff = Math.abs(currentMinutes - targetMinutes);
    const wrapAroundDiff = (24 * 60) - directDiff;
    const minDiff = Math.min(directDiff, wrapAroundDiff);

    // Check if current time is within the allowed window (total window, not radius)
    if (minDiff > windowMinutes / 2) {
      const windowHours = Math.round((windowMinutes / 60) * 100) / 100;
      return { 
        ok: false, 
        msg: `Check-in allowed only within ${windowHours}h window around ${habit.reminder.time}.` 
      };
    }
  }

  return { ok: true };
}
```

## 🚨 Impact

- **Severity:** High
- **User Impact:** Users may be blocked from valid check-ins or allowed invalid ones
- **Business Logic:** Reminder system effectiveness compromised

## 🧪 Steps to Reproduce

1. Set a reminder for 23:30 with a 2-hour window
2. Try to check in at 00:30 (should be within window but may be blocked)
3. Test various edge cases around midnight and day boundaries

## 📋 Acceptance Criteria

- [ ] Window calculation properly handles 24-hour time boundaries
- [ ] Clear definition of window (total duration vs radius) in documentation
- [ ] Edge cases around midnight work correctly
- [ ] Window size validation prevents invalid configurations
- [ ] Unit tests cover all time boundary scenarios