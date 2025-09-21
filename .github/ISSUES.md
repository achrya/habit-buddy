# Habit Buddy - GitHub Issues

This document contains all identified issues in the Habit Buddy application, organized by severity and category.

## 🔥 Critical Issues

### [#001 - Badge System Logic Inconsistency](./ISSUE_TEMPLATE/001-badge-system-inconsistency.md)
**Priority: Critical** | **Labels: bug, critical, logic-error, badge-system**
- Badge progression system has conflicting logic in `addHabit` vs `updateHabitBadge`
- Causes inconsistent `daysTarget` behavior and confusing badge progression

### [#002 - Streak Calculation Bug](./ISSUE_TEMPLATE/002-streak-calculation-bug.md)
**Priority: Critical** | **Labels: bug, critical, logic-error, streaks**
- Current streak calculation doesn't handle gaps correctly
- May give false positive streaks, affecting user motivation

### [#003 - Clock Tampering Detection Error](./ISSUE_TEMPLATE/003-clock-tampering-detection-error.md)
**Priority: Critical** | **Labels: bug, security, critical, logic-error**
- Security vulnerability in clock tampering detection logic
- Incorrect time comparison allows users to bypass check-in restrictions

## ⚠️ High Priority Issues

### [#004 - Reminder Window Validation Bug](./ISSUE_TEMPLATE/004-reminder-window-validation-bug.md)
**Priority: High** | **Labels: bug, high, logic-error, reminders**
- Incorrect time window calculation for reminder-based check-ins
- May block valid check-ins or allow invalid ones

## 🔧 Medium Priority Issues

### [#005 - Duplicate Reminder Intervals](./ISSUE_TEMPLATE/005-duplicate-reminder-intervals.md)
**Priority: Medium** | **Labels: performance, architecture, medium, refactor**
- Multiple components create redundant 30-second intervals
- Causes unnecessary resource usage and potential conflicts

### [#006 - Mixed State Management](./ISSUE_TEMPLATE/006-mixed-state-management.md)
**Priority: Medium** | **Labels: architecture, medium, refactor, state-management**
- HabitService uses both BehaviorSubject and signals for same data
- Creates potential synchronization issues and architectural inconsistency

### [#007 - Badge Award Logic Error](./ISSUE_TEMPLATE/007-badge-award-logic-error.md)
**Priority: Medium** | **Labels: bug, business-logic, medium, badge-system**
- Badges awarded incorrectly for 0 days completed
- Contradicts intended achievement system

### [#009 - ID Generation Collision Risk](./ISSUE_TEMPLATE/009-id-generation-collision-risk.md)
**Priority: Medium** | **Labels: bug, data-integrity, medium, security**
- Current ID generation can produce duplicates under high usage
- Risk of data corruption and unpredictable behavior

### [#010 - Performance Optimization - Computed](./ISSUE_TEMPLATE/010-performance-optimization-computed.md)
**Priority: Medium** | **Labels: performance, medium, optimization, computed**
- Multiple filter computations recalculate expensive operations
- Performance issues with many habits

### [#011 - Error Handling Import Service](./ISSUE_TEMPLATE/011-error-handling-import-service.md)
**Priority: Medium** | **Labels: bug, error-handling, medium, user-experience**
- Generic error handling without specific user feedback
- Makes import problems difficult to diagnose and fix

### [#013 - Memory Leak - Intervals](./ISSUE_TEMPLATE/013-memory-leak-intervals.md)
**Priority: Medium** | **Labels: bug, memory-leak, medium, cleanup**
- Inconsistent interval cleanup causing potential memory leaks
- Background processing continues after component destruction

### [#014 - Type Safety Improvements](./ISSUE_TEMPLATE/014-type-safety-improvements.md)
**Priority: Medium** | **Labels: typescript, type-safety, medium, refactor**
- Loose typing in several critical methods
- Reduces code maintainability and runtime safety

### [#015 - Calendar UX Logic](./ISSUE_TEMPLATE/015-calendar-ux-logic.md)
**Priority: Medium** | **Labels: ux, enhancement, medium, calendar**
- Calendar day click logic is too restrictive
- Poor user feedback for historical dates and future planning

## 🔍 Low Priority Issues

### [#008 - Category Assignment Inconsistency](./ISSUE_TEMPLATE/008-category-assignment-inconsistency.md)
**Priority: Low** | **Labels: business-logic, low, data-model, cleanup**
- Unclear business rules for categoryId field
- Inconsistent population and no clear purpose

### [#012 - Time Validation Edge Cases](./ISSUE_TEMPLATE/012-time-validation-edge-cases.md)
**Priority: Low** | **Labels: bug, validation, low, edge-cases**
- Time validation regex doesn't handle all edge cases
- Issues with '24:00', leading zeros, and format variations

---

## Issue Statistics

- **Total Issues:** 15
- **Critical:** 3
- **High Priority:** 1  
- **Medium Priority:** 9
- **Low Priority:** 2

## Categories

- **Logic Errors:** 4 issues
- **Architecture:** 2 issues
- **Performance:** 2 issues
- **Business Logic:** 2 issues
- **UX/Validation:** 2 issues
- **Security:** 2 issues
- **Type Safety:** 1 issue

---

*All issues are ready for assignment and development. Each issue contains detailed problem description, suggested fixes, acceptance criteria, and impact assessment.*