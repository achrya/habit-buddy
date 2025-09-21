---
name: 🗓️ Calendar UX Logic Improvement
about: Calendar day click logic is too restrictive without proper user feedback
title: "Improve calendar day click logic and user experience"
labels: ["ux", "enhancement", "medium", "calendar"]
assignees: []
---

## 🗓️ UX Issue Description

The calendar `onDayClick` logic only allows today's date to be clicked but provides poor user feedback for historical dates and doesn't support future planning features that users might expect.

## 📍 Location

**File:** `/src/app/features/calendar/components/calendar/calendar.component.ts`
**Method:** `onDayClick()` (lines 133-150)

## 🔍 Current Behavior

```typescript
protected async onDayClick(dateStr: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr !== today) {
    this.dialogService.showWarning('Only today can be toggled (no backfill).');
    return;
  }
  // ... only today's check-in logic
}
```

**Problems:**
1. **Restrictive Logic**: Users can't interact with any historical data
2. **Poor Feedback**: Generic warning doesn't explain why or offer alternatives
3. **Missing Features**: No way to view habit details for specific dates
4. **Inconsistent UX**: Calendar suggests interactivity but most days are non-functional

## ✅ Expected Behavior

- Clear visual indication of clickable vs non-clickable days
- Informative feedback for different types of day clicks
- Useful interactions for historical dates (view details, stats)
- Better user understanding of calendar functionality

## 🔧 Suggested Fix

**1. Enhanced day click logic with different actions:**

```typescript
protected async onDayClick(dateStr: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const clickedDate = new Date(dateStr);
  const todayDate = new Date(today);
  
  // Handle different date scenarios
  if (dateStr === today) {
    await this.handleTodayClick(dateStr);
  } else if (clickedDate < todayDate) {
    this.handlePastDateClick(dateStr);
  } else {
    this.handleFutureDateClick(dateStr);
  }
}

private async handleTodayClick(dateStr: string): Promise<void> {
  const habit = this.getSelectedHabit();
  if (!habit) {
    this.dialogService.showInfo('Select a habit to check in for today.');
    return;
  }

  const result = await this.habitService.toggleCheckinToday(habit.id);
  if (result.success) {
    this.notificationService.playBell();
    this.notificationService.triggerConfetti();
  } else if (result.message) {
    this.dialogService.showError(result.message);
  }
}

private handlePastDateClick(dateStr: string): void {
  const habit = this.getSelectedHabit();
  
  if (this.calendarMode() === 'all') {
    this.showAllHabitsForDate(dateStr);
  } else if (habit) {
    this.showHabitDetailsForDate(habit, dateStr);
  }
}

private handleFutureDateClick(dateStr: string): void {
  const clickedDate = new Date(dateStr);
  const daysFromNow = Math.ceil((clickedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  this.dialogService.showInfo(
    `Future Planning`,
    `This date is ${daysFromNow} day${daysFromNow === 1 ? '' : 's'} from now. You can check in when the date arrives!`
  );
}
```

**2. Add informative modals for historical data:**

```typescript
private showHabitDetailsForDate(habit: Habit, dateStr: string): void {
  const isCompleted = !!(habit.checkIns && habit.checkIns[dateStr]);
  const date = new Date(dateStr);
  const dateDisplay = date.toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const title = `${habit.title} - ${dateDisplay}`;
  const message = isCompleted 
    ? `✅ You completed this habit on ${dateDisplay}. Great work!`
    : `⭕ This habit was not completed on ${dateDisplay}.`;

  // Add additional context
  const stats = this.habitService.calcStreaksForHabit(habit);
  const additionalInfo = `\n\nCurrent streak: ${stats.current} days\nLongest streak: ${stats.longest} days`;

  this.dialogService.showInfo(title, message + additionalInfo);
}

private showAllHabitsForDate(dateStr: string): void {
  const date = new Date(dateStr);
  const dateDisplay = date.toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const completedHabits = this.habits().filter(habit => 
    habit.checkIns && habit.checkIns[dateStr]
  );

  const totalHabits = this.habits().length;
  const completedCount = completedHabits.length;

  let message = `On ${dateDisplay}, you completed ${completedCount} out of ${totalHabits} habits.`;
  
  if (completedHabits.length > 0) {
    message += `\n\nCompleted habits:\n${completedHabits.map(h => `• ${h.title}`).join('\n')}`;
  }

  this.dialogService.showInfo(`Daily Summary - ${dateDisplay}`, message);
}
```

**3. Add visual indicators for different day types:**

```typescript
protected getDayClasses(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const clickedDate = new Date(dateStr);
  const todayDate = new Date(today);
  
  let classes = 'calendar-day';
  
  if (dateStr === today) {
    classes += ' today clickable';
  } else if (clickedDate < todayDate) {
    classes += ' past clickable-info';
  } else {
    classes += ' future clickable-info';
  }
  
  // Add completion status
  if (this.isDayChecked(dateStr)) {
    classes += ' completed';
  }
  
  return classes;
}

protected getDayTooltip(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const clickedDate = new Date(dateStr);
  const todayDate = new Date(today);
  
  if (dateStr === today) {
    return 'Click to check in for today';
  } else if (clickedDate < todayDate) {
    return 'Click to view details for this date';
  } else {
    return 'Future date - check in when it arrives';
  }
}
```

**4. Update template with better visual feedback:**

```html
<div 
  class="{{ getDayClasses(day.date) }}"
  title="{{ getDayTooltip(day.date) }}"
  (click)="onDayClick(day.date)"
  [style.cursor]="day.date ? 'pointer' : 'default'">
  {{ day.day }}
  <!-- Visual indicators -->
  <div class="day-status" *ngIf="day.date">
    <span class="completion-dot" *ngIf="isDayChecked(day.date)">✓</span>
  </div>
</div>
```

## 🚨 Impact

- **Severity:** Medium
- **User Experience:** Much more intuitive and informative calendar interaction
- **Feature Discovery**: Users understand what they can and cannot do
- **Data Utilization**: Historical data becomes useful for reflection and analysis

## 📋 Acceptance Criteria

- [ ] Different click behaviors for today, past, and future dates
- [ ] Informative dialogs for historical date interactions
- [ ] Clear visual indicators for different day types
- [ ] Helpful tooltips explaining what each day click does
- [ ] No regression in today's check-in functionality
- [ ] Improved user understanding of calendar features
- [ ] Better accessibility with proper ARIA labels