---
name: 🐛 Badge System Logic Inconsistency
about: Critical bug in badge progression system causing conflicts
title: "Fix HabitService badge logic inconsistency in daysTarget assignment"
labels: ["bug", "critical", "logic-error", "badge-system"]
assignees: []
---

## 🐛 Bug Description

The badge progression system has conflicting logic where `addHabit` sets `daysTarget` to 30, but `updateHabitBadge` recalculates it based on badge levels, creating inconsistent behavior in the habit tracking system.

## 📍 Location

**File:** `/src/app/shared/services/habit.service.ts`
**Methods:** `addHabit()` (line 143) and `updateHabitBadge()` (line 173)

## 🔍 Current Behavior

1. When a new habit is created via `addHabit()`, `daysTarget` is hardcoded to 30 days
2. When `updateHabitBadge()` is called during check-ins, it recalculates `daysTarget` based on the current badge level
3. This creates inconsistent targets and confuses the badge progression system

## ✅ Expected Behavior

- Badge progression should have consistent `daysTarget` logic
- Either set initial `daysTarget` based on badge level OR don't modify it in `updateHabitBadge`
- Badge requirements should be clearly defined and consistently applied

## 🔧 Suggested Fix

```typescript
// Option 1: Fix addHabit to use badge-based daysTarget
addHabit(title: string, reminder?: Reminder | null): Habit {
  const habit: Habit = {
    id: this.generateId(),
    title: title.trim(),
    daysTarget: BADGE_LEVELS[0].daysRequired, // Use initial badge requirement
    color: this.pickColor(this.habits().length),
    createdAt: new Date().toISOString().slice(0, 10),
    checkIns: {},
    reminder: reminder || null,
    badge: null
  };
  // ... rest of method
}

// Option 2: Remove daysTarget modification from updateHabitBadge
private updateHabitBadge(habit: Habit): Habit {
  const completedDays = Object.keys(habit.checkIns || {}).length;
  const newBadge = this.getBadgeForProgress(completedDays);
  
  return {
    ...habit,
    badge: newBadge
    // Remove daysTarget modification
  };
}
```

## 🚨 Impact

- **Severity:** Critical
- **User Impact:** Confusing badge progression and incorrect target displays
- **Data Integrity:** Risk of inconsistent habit data

## 🧪 Steps to Reproduce

1. Create a new habit
2. Check in for several days
3. Observe how `daysTarget` changes inconsistently
4. Compare with badge level requirements

## 📋 Acceptance Criteria

- [ ] Badge progression logic is consistent across all methods
- [ ] `daysTarget` follows a single, clear business rule
- [ ] Existing habits are migrated to use consistent logic
- [ ] Unit tests verify badge progression accuracy