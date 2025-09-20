# Import Service

The `ImportService` is a dedicated service for handling habit import functionality with advanced duplicate detection and user options. It provgides a clean separation of concerns from the main `HabitService`.

## Features

- **Smart Duplicate Detection**: Case-insensitive title matching
- **Multiple Import Strategies**: Skip, replace, or keep duplicates
- **Data Validation**: Comprehensive habit data structure validation
- **Preview Mode**: Preview imports without actually importing
- **Flexible Options**: Customizable import behavior

## Usage

### Basic Import

```typescript
import { ImportService } from './shared/services/import.service';

constructor(private importService: ImportService) {}

// Import with automatic duplicate detection
const result = this.importService.importHabits(jsonData);
if (result.success) {
  console.log(result.message);
  if (result.duplicates) {
    console.log('Duplicates found:', result.duplicates);
  }
}
```

### Advanced Import with Options

```typescript
// Import with specific duplicate handling
const result = this.importService.importHabitsWithOptions(
  jsonData, 
  'replace', // duplicateAction
  { 
    validateData: true, 
    generateNewIds: true 
  }
);
```

### Preview Import

```typescript
// Preview what would be imported
const preview = this.importService.previewImport(jsonData);
console.log(`Would import ${preview.newHabits} new habits`);
console.log(`Duplicates: ${preview.duplicates.length}`);
```

## Import Strategies

### 1. Skip Duplicates (Default)
- **Action**: Keep existing habits, ignore imported duplicates
- **Use Case**: When you only want to add new habits
- **Result**: Only non-duplicate habits are imported

### 2. Replace Existing
- **Action**: Replace existing habits with imported versions
- **Use Case**: When you want to update existing habits with new data
- **Result**: Existing habits are replaced with imported versions

### 3. Keep Both
- **Action**: Add imported habits as copies
- **Use Case**: When you want to keep both versions for comparison
- **Result**: Imported habits are added with "(Copy)" suffix

## Data Validation

The service includes comprehensive validation for:

- **Required Fields**: id, title, daysTarget, categoryId, color, createdAt, checkIns
- **Data Types**: Ensures correct types for all fields
- **Optional Fields**: Validates reminder structure when present
- **Array Structure**: Ensures data is a valid array of habits

## Error Handling

The service provides detailed error messages for:

- Invalid JSON format
- Missing required fields
- Incorrect data types
- Malformed habit structures

## Integration

The `ImportService` works alongside:

- **HabitService**: Uses `updateHabitsList()` to update habits
- **ImportModalComponent**: Provides UI for duplicate resolution
- **SidebarComponent**: Handles file selection and import workflow

## API Reference

### Methods

#### `importHabits(jsonData: string): ImportResult`
Basic import with automatic duplicate detection and merging.

#### `importHabitsWithOptions(jsonData: string, duplicateAction: DuplicateAction, options?: ImportOptions): ImportResult`
Advanced import with specific duplicate handling options.

#### `validateHabitData(data: any[], strictValidation?: boolean): boolean`
Validates habit data structure.

#### `previewImport(jsonData: string): PreviewResult`
Preview import without actually importing data.

### Types

#### `ImportResult`
```typescript
interface ImportResult {
  success: boolean;
  duplicates?: string[];
  message?: string;
}
```

#### `DuplicateAction`
```typescript
type DuplicateAction = 'skip' | 'replace' | 'keep-both';
```

#### `ImportOptions`
```typescript
interface ImportOptions {
  duplicateAction?: DuplicateAction;
  validateData?: boolean;
  generateNewIds?: boolean;
}
```

## Example JSON Structure

```json
[
  {
    "id": "habit-1",
    "title": "Morning Meditation",
    "daysTarget": 30,
    "categoryId": "30",
    "color": "#8B5CF6",
    "createdAt": "2024-01-15",
    "checkIns": {
      "2024-01-15": "hash-value",
      "2024-01-16": "hash-value"
    },
    "reminder": {
      "time": "07:00",
      "days": [1, 2, 3, 4, 5],
      "window": 30
    }
  }
]
```

## Best Practices

1. **Always validate data** before importing
2. **Use preview mode** for large imports
3. **Handle errors gracefully** with user feedback
4. **Provide clear feedback** about import results
5. **Consider user experience** when choosing duplicate strategies

## Testing

The service includes comprehensive unit tests covering:

- Basic import functionality
- Duplicate detection and handling
- Data validation
- Error scenarios
- Preview functionality

Run tests with:
```bash
npm test -- --include="**/import.service.spec.ts"
```
