---
name: ⏰ Time Validation Edge Cases
about: Regex validation doesn't handle all time input edge cases
title: "Fix time validation regex in ReminderModalComponent"
labels: ["bug", "validation", "low", "edge-cases"]
assignees: []
---

## ⏰ Validation Issue Description

The time validation regex in `ReminderModalComponent.isValidTime()` doesn't handle edge cases like '24:00', leading zeros, or other time format variations properly.

## 📍 Location

**File:** `/src/app/features/reminders/components/reminder-modal/reminder-modal.component.ts`
**Method:** `isValidTime()` (lines 119-122)

## 🔍 Current Behavior

```typescript
private isValidTime(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}
```

**Problems with current regex:**
1. **Doesn't handle '24:00'**: Some systems use 24:00 to represent midnight
2. **Inconsistent leading zeros**: Allows both '9:30' and '09:30' but validation may be inconsistent
3. **No validation of logical time**: Accepts invalid combinations
4. **Limited format support**: Only supports HH:MM, not other common formats

## ✅ Expected Behavior

- Handle all valid 24-hour time formats consistently
- Provide clear feedback for invalid times
- Support common time input variations
- Normalize time format for consistent storage

## 🔧 Suggested Fix

**Enhanced time validation with normalization:**

```typescript
private isValidTime(time: string): boolean {
  if (!time || typeof time !== 'string') {
    return false;
  }

  // Trim whitespace
  const trimmedTime = time.trim();
  
  // Handle empty string
  if (trimmedTime === '') {
    return false;
  }

  // Enhanced regex for 24-hour format
  // Accepts: HH:MM, H:MM, with optional leading zeros
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$|^24:00$/;
  
  if (!timeRegex.test(trimmedTime)) {
    return false;
  }

  // Additional validation for edge cases
  const [hoursStr, minutesStr] = trimmedTime.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  // Validate ranges
  if (hours < 0 || hours > 24) return false;
  if (minutes < 0 || minutes > 59) return false;
  
  // Special case: 24:00 is valid (represents midnight of next day)
  // but 24:XX (where XX > 00) is invalid
  if (hours === 24 && minutes !== 0) {
    return false;
  }

  return true;
}

// Helper method to normalize time format
private normalizeTime(time: string): string {
  if (!this.isValidTime(time)) {
    return time; // Return as-is if invalid
  }

  const trimmedTime = time.trim();
  
  // Convert 24:00 to 00:00 for consistent storage
  if (trimmedTime === '24:00') {
    return '00:00';
  }

  // Ensure consistent HH:MM format with leading zeros
  const [hoursStr, minutesStr] = trimmedTime.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
```

**Enhanced save method with normalization:**

```typescript
protected save(): void {
  const time = this.normalizeTime(this.reminderForm.time);
  const window = Math.max(5, Math.min(1440, parseInt(this.reminderForm.window.toString(), 10) || 120));
  const days = [...this.selectedDays()];

  if (!this.isValidTime(time)) {
    this.dialogService.showError(
      'Please enter a valid time in HH:MM format (00:00 to 23:59 or 24:00)'
    );
    return;
  }

  if (!days.length) {
    this.dialogService.showWarning('No days selected. This will disable reminders for this habit.');
  }

  const reminder: Reminder = { time, days, window };
  this.saveReminder.emit({ habitId: this.habitId, reminder });
  this.close();
}
```

**Alternative: More comprehensive time parsing:**

```typescript
private parseAndValidateTime(timeInput: string): { isValid: boolean; normalizedTime?: string; error?: string } {
  if (!timeInput || typeof timeInput !== 'string') {
    return { isValid: false, error: 'Time is required' };
  }

  const trimmed = timeInput.trim().toLowerCase();
  
  // Handle common formats
  const formats = [
    /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/, // HH:MM or H:MM
    /^24:00$/, // Special case for midnight
    /^([0-1]?[0-9]|2[0-3])\.([0-5][0-9])$/, // HH.MM format
    /^([0-1]?[0-9]|2[0-3])([0-5][0-9])$/, // HHMM format
  ];

  for (const format of formats) {
    const match = trimmed.match(format);
    if (match) {
      let hours: number, minutes: number;
      
      if (trimmed === '24:00') {
        return { isValid: true, normalizedTime: '00:00' };
      }
      
      if (format === formats[2]) { // HH.MM
        [, hours, minutes] = match.map(Number);
      } else if (format === formats[3]) { // HHMM
        hours = Math.floor(Number(match[1]) / 100);
        minutes = Number(match[1]) % 100;
      } else { // HH:MM
        [, hours, minutes] = match.map(Number);
      }

      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        const normalizedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        return { isValid: true, normalizedTime };
      }
    }
  }

  return { 
    isValid: false, 
    error: 'Please enter time in HH:MM format (00:00 to 23:59)' 
  };
}
```

## 🚨 Impact

- **Severity:** Low
- **User Experience:** Better handling of time input variations
- **Data Consistency:** Normalized time storage format
- **Edge Cases:** Proper handling of midnight and format variations

## 🧪 Test Cases

Test the following inputs:
- Valid: '09:30', '9:30', '00:00', '23:59', '24:00'
- Invalid: '25:00', '12:60', '24:30', '', '12:', ':30', 'abc'

## 📋 Acceptance Criteria

- [ ] All valid 24-hour time formats accepted
- [ ] Invalid times properly rejected with helpful error messages
- [ ] Time format normalized for consistent storage
- [ ] Edge case '24:00' handled correctly (converted to '00:00')
- [ ] Leading zeros handled consistently
- [ ] User-friendly error messages for invalid formats