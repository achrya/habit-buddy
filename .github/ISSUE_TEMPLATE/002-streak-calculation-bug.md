---
name: 🐛 Streak Calculation Logic Bug
about: Critical bug in streak calculation causing incorrect current streaks
title: "Fix streak calculation bug in calcStreaksForHabit method"
labels: ["bug", "critical", "logic-error", "streaks"]
assignees: []
---

## 🐛 Bug Description

The current streak calculation in `calcStreaksForHabit` has flawed logic that doesn't properly handle gaps in check-ins and may give false positive streaks, leading to incorrect streak displays.

## 📍 Location

**File:** `/src/app/shared/services/habit.service.ts`
**Method:** `calcStreaksForHabit()` (lines 286-321)

## 🔍 Current Behavior

The current streak calculation logic has several issues:
1. Doesn't properly handle gaps between check-ins
2. May count non-consecutive days as part of a streak
3. Current streak calculation starts from today but doesn't validate consecutive days properly

## ✅ Expected Behavior

- Current streak should only count consecutive days ending today
- Longest streak should find the actual longest consecutive sequence
- Gaps in check-ins should break streaks properly

## 🔧 Suggested Fix

```typescript
calcStreaksForHabit(habit: Habit): HabitStats {
  const checkIns = habit.checkIns || {};
  const sortedDates = Object.keys(checkIns).sort();
  
  if (sortedDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  let longest = 0;
  let current = 0;
  
  // Calculate longest streak
  let currentStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currentDate = new Date(sortedDates[i]);
    const diffTime = currentDate.getTime() - prevDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
    } else {
      longest = Math.max(longest, currentStreak);
      currentStreak = 1;
    }
  }
  longest = Math.max(longest, currentStreak);
  
  // Calculate current streak (must end today)
  const today = new Date().toISOString().slice(0, 10);
  if (checkIns[today]) {
    current = 1;
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1);
    
    while (checkIns[checkDate.toISOString().slice(0, 10)]) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }
  
  return { current, longest };
}
```

## 🚨 Impact

- **Severity:** Critical
- **User Impact:** Incorrect streak counts demotivate users
- **Data Integrity:** False streak information affects user engagement

## 🧪 Steps to Reproduce

1. Create a habit with check-ins: Day 1, Day 3, Day 4, Day 5 (gap between Day 1 and Day 3)
2. Check current streak calculation
3. Verify it incorrectly includes Day 1 in the streak

## 📋 Acceptance Criteria

- [ ] Current streak only counts consecutive days ending today
- [ ] Longest streak finds actual longest consecutive sequence
- [ ] Gaps properly break streak calculations
- [ ] Edge cases (single day, no check-ins) handled correctly
- [ ] Unit tests verify all streak scenarios