---
name: 📂 Category Assignment Inconsistency
about: Business logic unclear for categoryId field assignment
title: "Fix habit category assignment logic and business rules"
labels: ["business-logic", "low", "data-model", "cleanup"]
assignees: []
---

## 📂 Business Logic Issue Description

The `categoryId` field lacks clear business rules and is inconsistently populated. In sample data, it's set to the string representation of `daysTarget`, but the model shows it as optional with no clear purpose.

## 📍 Location

**Files:**
- `/src/app/shared/models/habit.model.ts` (line 5)
- `/src/app/shared/services/habit.service.ts` (sample data creation, lines 424, 434, 444, 454, 464)

## 🔍 Current Behavior

**In the model:**
```typescript
export interface Habit {
  id: string;
  title: string;
  daysTarget: number;
  categoryId?: string; // Optional - will be assigned automatically
  badge?: HabitBadge | null;
  // ...
}
```

**In sample data:**
```typescript
{
  id: this.generateId(),
  title: 'Morning Meditation',
  daysTarget: 30,
  categoryId: '30', // Set to string of daysTarget
  // ...
}
```

**In addHabit method:**
```typescript
addHabit(title: string, reminder?: Reminder | null): Habit {
  const habit: Habit = {
    // ...
    daysTarget: 30,
    // categoryId is not set at all
    // ...
  };
}
```

## 🚨 Problems

1. **Inconsistent Assignment**: Sample data sets categoryId, but addHabit doesn't
2. **Unclear Business Purpose**: What are categories supposed to represent?
3. **Poor Data Modeling**: Using daysTarget as categoryId suggests categories represent difficulty levels
4. **Unused Feature**: No UI or business logic actually uses categories

## ✅ Expected Behavior

**Option A: Implement proper category system**
```typescript
export enum HabitCategory {
  HEALTH = 'health',
  PRODUCTIVITY = 'productivity',
  LEARNING = 'learning',
  FITNESS = 'fitness',
  MINDFULNESS = 'mindfulness',
  SOCIAL = 'social'
}

export interface Habit {
  // ...
  categoryId?: HabitCategory;
  // ...
}
```

**Option B: Remove unused categoryId field**
```typescript
export interface Habit {
  id: string;
  title: string;
  daysTarget: number;
  // Remove categoryId entirely
  badge?: HabitBadge | null;
  // ...
}
```

## 🔧 Suggested Fix

**Recommended: Option B (Remove unused field)**

1. **Update Habit model:**
```typescript
export interface Habit {
  id: string;
  title: string;
  daysTarget: number;
  badge?: HabitBadge | null;
  color: string;
  createdAt: string;
  checkIns: Record<string, string>;
  reminder?: Reminder | null;
}
```

2. **Remove from sample data:**
```typescript
{
  id: this.generateId(),
  title: 'Morning Meditation',
  daysTarget: 30,
  // Remove categoryId: '30',
  color: this.COLORS[0],
  // ...
}
```

3. **Add migration for existing data:**
```typescript
private migrateHabits(habits: Habit[]): Habit[] {
  return habits.map(habit => {
    const { categoryId, ...cleanHabit } = habit as any;
    return cleanHabit;
  });
}
```

## 🚨 Impact

- **Severity:** Low
- **Data Model:** Cleaner, more focused interface
- **Maintainability:** Removes unused/confusing field
- **Performance:** Slightly reduced memory usage

## 📋 Acceptance Criteria

- [ ] Decide whether to implement or remove categoryId
- [ ] Update Habit interface accordingly
- [ ] Remove categoryId from sample data if unused
- [ ] Add data migration for existing users
- [ ] Update any TypeScript interfaces that reference categories
- [ ] Ensure no runtime errors from missing categoryId