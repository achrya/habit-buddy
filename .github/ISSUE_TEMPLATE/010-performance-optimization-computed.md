---
name: ⚡ Performance Optimization - Computed Calculations
about: Performance issue with repeated expensive calculations in GoalsComponent
title: "Optimize computed calculations in GoalsComponent filter operations"
labels: ["performance", "medium", "optimization", "computed"]
assignees: []
---

## ⚡ Performance Issue Description

Multiple filter computations in `GoalsComponent` recalculate expensive habit statistics unnecessarily, causing performance degradation when users have many habits.

## 📍 Location

**File:** `/src/app/features/goals/components/goals/goals.component.ts`
**Methods:** Multiple computed properties (lines 48-157)

## 🔍 Current Behavior

Several computed properties repeatedly call expensive operations:

```typescript
protected readonly filteredHabits = computed(() => {
  // ... filtering logic that calls getHabitStats multiple times
  return allHabits.filter(habit => {
    const stats = this.getHabitStats(habit); // ❌ Expensive call per habit per filter
    return stats.current > 0;
  });
});

protected readonly otherFilterOptionsWithCounts = computed(() => {
  return this.otherFilterOptions.map(option => {
    // ... more expensive calculations per option
    count = allHabits.filter(habit => {
      const stats = this.getHabitStats(habit); // ❌ Called again for same habits
      return stats.current > 0;
    }).length;
  });
});
```

**Performance Problems:**
1. `getHabitStats()` called multiple times for the same habit
2. Streak calculations repeated across different computed properties
3. No memoization of expensive calculations
4. O(n²) complexity in some filter operations

## ✅ Expected Behavior

- Calculate habit stats once and reuse across all computations
- Memoize expensive operations
- Minimize redundant calculations
- Maintain reactive updates while improving performance

## 🔧 Suggested Fix

**1. Create memoized habit stats:**

```typescript
// Memoized habit stats computation
protected readonly habitStatsMap = computed(() => {
  const habits = this.habits();
  const statsMap = new Map<string, HabitStats>();
  
  for (const habit of habits) {
    statsMap.set(habit.id, this.habitService.calcStreaksForHabit(habit));
  }
  
  return statsMap;
});

// Helper method using memoized stats
protected getHabitStats(habit: Habit): HabitStats {
  return this.habitStatsMap().get(habit.id) || { current: 0, longest: 0 };
}
```

**2. Optimize filtered habits computation:**

```typescript
protected readonly filteredHabits = computed(() => {
  const filter = this.activeFilter();
  const allHabits = this.habits();
  const statsMap = this.habitStatsMap();
  
  switch (filter) {
    case 'all':
      return allHabits;
    case 'active':
      return allHabits.filter(habit => {
        const stats = statsMap.get(habit.id);
        return stats ? stats.current > 0 : false;
      });
    // ... other cases using statsMap
  }
});
```

**3. Create computed filter counts:**

```typescript
protected readonly filterCounts = computed(() => {
  const habits = this.habits();
  const statsMap = this.habitStatsMap();
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const counts = {
    total: habits.length,
    active: 0,
    withReminders: 0,
    recent: 0,
    completedToday: 0,
    badges: new Map<BadgeLevel, number>()
  };
  
  // Single pass through habits to calculate all counts
  for (const habit of habits) {
    const stats = statsMap.get(habit.id);
    
    if (stats && stats.current > 0) counts.active++;
    if (habit.reminder) counts.withReminders++;
    if (new Date(habit.createdAt) >= sevenDaysAgo) counts.recent++;
    if (habit.checkIns && habit.checkIns[today]) counts.completedToday++;
    
    // Badge counting
    const badgeConfig = getBadgeConfigForDays(stats?.current || 0);
    const currentCount = counts.badges.get(badgeConfig.level) || 0;
    counts.badges.set(badgeConfig.level, currentCount + 1);
  }
  
  return counts;
});
```

**4. Use computed counts in filter options:**

```typescript
protected readonly otherFilterOptionsWithCounts = computed(() => {
  const counts = this.filterCounts();
  
  return this.otherFilterOptions.map(option => ({
    ...option,
    count: counts[option.value as keyof typeof counts] || 0
  }));
});
```

## 🚨 Impact

- **Severity:** Medium
- **Performance:** Significant improvement with large habit collections
- **User Experience:** Smoother UI interactions and filtering
- **Scalability:** Better performance as user data grows

## 🧪 Performance Testing

1. Create 100+ habits with various check-in patterns
2. Measure filter computation time before/after optimization
3. Use Chrome DevTools Performance tab to profile
4. Verify no regression in functionality

## 📋 Acceptance Criteria

- [ ] Habit stats calculated only once per computation cycle
- [ ] Filter operations use memoized data
- [ ] Performance improvement measurable (>50% reduction in computation time)
- [ ] All existing functionality preserved
- [ ] Memory usage doesn't increase significantly
- [ ] Reactive updates still work correctly