---
name: 🔐 ID Generation Collision Risk
about: Data integrity issue with potential duplicate ID generation
title: "Fix ID generation collision risk in generateId method"
labels: ["bug", "data-integrity", "medium", "security"]
assignees: []
---

## 🔐 Data Integrity Issue Description

The current ID generation method uses `Math.random().toString(36).slice(2, 9)` which can produce duplicate IDs under high-volume usage, leading to data corruption and unpredictable behavior.

## 📍 Location

**Files:**
- `/src/app/shared/services/habit.service.ts` (line 475)
- `/src/app/shared/components/import-modal/import.service.ts` (line 330)

## 🔍 Current Behavior

```typescript
private generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}
```

**Problems with this approach:**
1. **Limited Entropy**: Only 7 characters from base-36 (0-9, a-z)
2. **Collision Probability**: ~36^7 = 78 billion possible IDs, but birthday paradox makes collisions likely with much fewer IDs
3. **No Collision Detection**: No mechanism to detect or prevent duplicate IDs
4. **Predictable Pattern**: IDs follow a predictable pattern that could be exploited

## ✅ Expected Behavior

- Generate cryptographically secure, unique identifiers
- Extremely low collision probability even with millions of habits
- Unpredictable ID format for security
- Fallback mechanism for collision detection

## 🔧 Suggested Fix

**Option A: Use crypto.randomUUID() (Recommended)**

```typescript
private generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID
  return this.generateSecureId();
}

private generateSecureId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  
  // Convert to hex string
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
```

**Option B: Enhanced random ID with collision detection**

```typescript
private generateId(): string {
  let id: string;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    id = this.generateSecureRandomId();
    attempts++;
    
    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique ID after maximum attempts');
    }
  } while (this.isIdInUse(id));
  
  return id;
}

private generateSecureRandomId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.getRandomValues(new Uint32Array(2))
    .reduce((acc, val) => acc + val.toString(36), '');
  
  return `${timestamp}-${randomPart}`;
}

private isIdInUse(id: string): boolean {
  return this.habits().some(habit => habit.id === id);
}
```

**Option C: Timestamp + Random (Good performance)**

```typescript
private generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}
```

## 🚨 Impact

- **Severity:** Medium
- **Data Integrity:** Risk of habit data corruption with duplicate IDs
- **User Experience:** Unpredictable behavior when IDs collide
- **Scalability:** Problem worsens as user base grows

## 🧪 Steps to Reproduce

Collision probability testing:
1. Generate 10,000+ IDs using current method
2. Check for duplicates using Set comparison
3. Observe collision occurrences

## 📋 Acceptance Criteria

- [ ] Implement cryptographically secure ID generation
- [ ] Ensure collision probability is negligible (< 1 in 10^12)
- [ ] Maintain reasonable ID length for storage efficiency
- [ ] Add collision detection mechanism
- [ ] Update both HabitService and ImportService
- [ ] Test ID uniqueness under high load
- [ ] Ensure backward compatibility with existing IDs