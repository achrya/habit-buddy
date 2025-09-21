---
name: 🔒 Clock Tampering Detection Logic Error
about: Security vulnerability in clock tampering detection
title: "Fix clock tampering detection logic in hasClockTampering method"
labels: ["bug", "security", "critical", "logic-error"]
assignees: []
---

## 🔒 Security Issue Description

The clock tampering detection logic has an incorrect time comparison that will never properly detect actual clock tampering, creating a security vulnerability in the check-in system.

## 📍 Location

**File:** `/src/app/shared/services/habit.service.ts`
**Method:** `hasClockTampering()` (lines 498-508)

## 🔍 Current Behavior

```typescript
private hasClockTampering(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const last = JSON.parse(localStorage.getItem(this.LAST_TS_KEY) || '0');
    if (!last) return false;
    const now = Date.now();
    return now + 2000 < last - 120000; // ❌ This logic is incorrect
  } catch {
    return false;
  }
}
```

The condition `now + 2000 < last - 120000` is mathematically flawed and will rarely trigger.

## ✅ Expected Behavior

Clock tampering should be detected when:
1. Current time is significantly before the last recorded timestamp (clock set backward)
2. Time difference exceeds a reasonable threshold for normal system clock drift

## 🔧 Suggested Fix

```typescript
private hasClockTampering(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const lastTimestamp = JSON.parse(localStorage.getItem(this.LAST_TS_KEY) || '0');
    if (!lastTimestamp) return false;
    
    const now = Date.now();
    const timeDifference = now - lastTimestamp;
    
    // Detect if current time is more than 2 minutes before last recorded time
    // This indicates the clock was set backward
    const TAMPERING_THRESHOLD = -2 * 60 * 1000; // -2 minutes in milliseconds
    
    return timeDifference < TAMPERING_THRESHOLD;
  } catch {
    return false;
  }
}
```

## 🚨 Impact

- **Severity:** Critical (Security)
- **Security Risk:** Users can manipulate system clock to bypass check-in restrictions
- **Business Logic:** Compromises habit tracking integrity
- **Data Integrity:** Allows false check-in data

## 🧪 Steps to Reproduce

1. Perform a check-in to set a timestamp
2. Change system clock to a time before the check-in
3. Attempt another check-in
4. Observe that clock tampering is not detected

## 📋 Acceptance Criteria

- [ ] Clock tampering is properly detected when system time moves backward significantly
- [ ] Normal clock drift (few seconds/minutes) doesn't trigger false positives
- [ ] Clear error message when tampering is detected
- [ ] Threshold is configurable for different use cases
- [ ] Unit tests verify tampering detection accuracy