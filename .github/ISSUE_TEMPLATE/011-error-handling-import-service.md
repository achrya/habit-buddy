---
name: 🚨 Error Handling Improvements in ImportService
about: Generic error handling without specific user feedback
title: "Add proper error handling and user feedback in ImportService"
labels: ["bug", "error-handling", "medium", "user-experience"]
assignees: []
---

## 🚨 Error Handling Issue Description

The `ImportService` catches all errors generically without providing specific error types or user-friendly messages, making it difficult for users to understand and fix import problems.

## 📍 Location

**File:** `/src/app/shared/components/import-modal/import.service.ts`
**Methods:** `importHabits()`, `importHabitsWithOptions()`, `previewImport()` (multiple catch blocks)

## 🔍 Current Behavior

```typescript
try {
  // ... import logic
} catch (error) {
  console.error('Import error:', error);
  return { success: false, message: 'Failed to parse JSON file. Please check the file format.' };
}
```

**Problems:**
1. **Generic Error Messages**: All errors result in the same "Failed to parse JSON" message
2. **Lost Context**: Specific error information is only logged, not shown to user
3. **No Error Classification**: Can't distinguish between JSON syntax errors, validation errors, etc.
4. **Poor UX**: Users don't know how to fix their import files

## ✅ Expected Behavior

- Specific error messages for different error types
- Helpful suggestions for fixing common issues
- Proper error classification and handling
- Detailed validation feedback

## 🔧 Suggested Fix

**1. Create error classification system:**

```typescript
export enum ImportErrorType {
  INVALID_JSON = 'INVALID_JSON',
  INVALID_STRUCTURE = 'INVALID_STRUCTURE',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  INVALID_DATA_TYPES = 'INVALID_DATA_TYPES',
  CORRUPTED_DATA = 'CORRUPTED_DATA',
  EMPTY_FILE = 'EMPTY_FILE'
}

export interface ImportError {
  type: ImportErrorType;
  message: string;
  details?: string;
  suggestions?: string[];
}
```

**2. Enhanced error handling:**

```typescript
importHabits(jsonData: string): ImportResult {
  try {
    // Validate input
    if (!jsonData || jsonData.trim().length === 0) {
      return {
        success: false,
        message: 'Import file is empty. Please select a valid JSON file with habit data.'
      };
    }

    const data = this.parseAndValidateData(jsonData);
    if (!data) {
      return this.createValidationErrorResult(jsonData);
    }

    // ... rest of import logic
  } catch (error) {
    return this.handleImportError(error);
  }
}

private handleImportError(error: any): ImportResult {
  if (error instanceof SyntaxError) {
    return {
      success: false,
      message: 'Invalid JSON format detected.',
      details: `JSON parsing failed: ${error.message}`,
      suggestions: [
        'Ensure the file is valid JSON format',
        'Check for missing commas, brackets, or quotes',
        'Use a JSON validator to check your file',
        'Make sure the file wasn\'t corrupted during transfer'
      ]
    };
  }

  if (error.name === 'ValidationError') {
    return {
      success: false,
      message: 'Habit data validation failed.',
      details: error.message,
      suggestions: [
        'Ensure all habits have required fields (id, title, daysTarget, etc.)',
        'Check that data types are correct (numbers for daysTarget, strings for title)',
        'Verify checkIns is an object with date keys',
        'Export habits from the app to see the correct format'
      ]
    };
  }

  // Generic fallback with more helpful message
  console.error('Unexpected import error:', error);
  return {
    success: false,
    message: 'An unexpected error occurred during import.',
    details: error.message || 'Unknown error',
    suggestions: [
      'Try exporting and re-importing a small sample to test the format',
      'Check that the file isn\'t corrupted',
      'Contact support if the problem persists'
    ]
  };
}
```

**3. Detailed validation with specific feedback:**

```typescript
private parseAndValidateData(jsonData: string, validateData: boolean = true): Habit[] | null {
  let data: any;
  
  try {
    data = JSON.parse(jsonData);
  } catch (syntaxError) {
    throw new SyntaxError(`JSON parsing failed at position ${(syntaxError as any).position || 'unknown'}: ${syntaxError.message}`);
  }
  
  if (!Array.isArray(data)) {
    const validationError = new Error('Data must be an array of habit objects');
    validationError.name = 'ValidationError';
    throw validationError;
  }

  if (data.length === 0) {
    const validationError = new Error('Import file contains no habits');
    validationError.name = 'ValidationError';
    throw validationError;
  }

  if (validateData) {
    const validationResult = this.validateHabitDataDetailed(data);
    if (!validationResult.isValid) {
      const validationError = new Error(validationResult.errorMessage);
      validationError.name = 'ValidationError';
      throw validationError;
    }
  }

  return data as Habit[];
}
```

**4. Detailed validation with field-specific errors:**

```typescript
private validateHabitDataDetailed(data: any[]): { isValid: boolean; errorMessage?: string } {
  for (let i = 0; i < data.length; i++) {
    const habit = data[i];
    const habitIndex = i + 1;
    
    if (!habit || typeof habit !== 'object') {
      return {
        isValid: false,
        errorMessage: `Habit #${habitIndex}: Expected object, got ${typeof habit}`
      };
    }

    // Check required fields
    const requiredFields = [
      { name: 'id', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'daysTarget', type: 'number' },
      { name: 'color', type: 'string' },
      { name: 'createdAt', type: 'string' },
      { name: 'checkIns', type: 'object' }
    ];

    for (const field of requiredFields) {
      if (!(field.name in habit)) {
        return {
          isValid: false,
          errorMessage: `Habit #${habitIndex} ("${habit.title || 'Unknown'}"): Missing required field "${field.name}"`
        };
      }

      if (typeof habit[field.name] !== field.type) {
        return {
          isValid: false,
          errorMessage: `Habit #${habitIndex} ("${habit.title || 'Unknown'}"): Field "${field.name}" should be ${field.type}, got ${typeof habit[field.name]}`
        };
      }
    }

    // Additional validation
    if (habit.daysTarget <= 0) {
      return {
        isValid: false,
        errorMessage: `Habit #${habitIndex} ("${habit.title}"): daysTarget must be greater than 0`
      };
    }
  }

  return { isValid: true };
}
```

## 🚨 Impact

- **Severity:** Medium
- **User Experience:** Much better error feedback and guidance
- **Developer Experience:** Easier debugging of import issues
- **Support Burden:** Reduced support requests due to clearer error messages

## 📋 Acceptance Criteria

- [ ] Specific error messages for different error types
- [ ] Field-level validation with habit-specific error locations
- [ ] Helpful suggestions for fixing common import issues
- [ ] JSON syntax errors show approximate location
- [ ] Empty file and corrupted data detection
- [ ] Error messages are user-friendly, not technical
- [ ] Console logging preserved for debugging