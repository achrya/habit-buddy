import { Injectable } from '@angular/core';
import { HabitService } from '../../services/habit.service';
import { Habit } from '../../models/habit.model';

export interface ImportResult {
  success: boolean;
  duplicates?: string[];
  message?: string;
}

export type DuplicateAction = 'skip' | 'replace' | 'keep-both';

export interface ImportOptions {
  duplicateAction?: DuplicateAction;
  validateData?: boolean;
  generateNewIds?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  constructor(private habitService: HabitService) {}

  /**
   * Import habits with automatic duplicate detection and merging
   * @param jsonData JSON string containing habit data
   * @returns Import result with success status and duplicate information
   */
  importHabits(jsonData: string): ImportResult {
    try {
      const data = this.parseAndValidateData(jsonData);
      if (!data) {
        return { success: false, message: 'Invalid JSON format. Expected an array of habits.' };
      }

      const existingHabits = this.habitService.habits();
      const duplicateTitles: string[] = [];
      const newHabits: Habit[] = [];

      // Check for duplicates and prepare new habits
      for (const importedHabit of data) {
        const existingHabit = existingHabits.find(h => 
          h.title.toLowerCase() === importedHabit.title.toLowerCase()
        );
        
        if (existingHabit) {
          duplicateTitles.push(importedHabit.title);
        } else {
          // Generate new ID to avoid conflicts
          importedHabit.id = this.generateId();
          newHabits.push(importedHabit);
        }
      }

      // Merge existing habits with new habits
      const mergedHabits = [...existingHabits, ...newHabits];
      this.updateHabits(mergedHabits);

      return { 
        success: true, 
        duplicates: duplicateTitles.length > 0 ? duplicateTitles : undefined,
        message: duplicateTitles.length > 0 
          ? `Imported ${newHabits.length} new habits. ${duplicateTitles.length} duplicates found and skipped.`
          : `Successfully imported ${newHabits.length} habits.`
      };
    } catch (error) {
      console.error('Import error:', error);
      return { success: false, message: 'Failed to parse JSON file. Please check the file format.' };
    }
  }

  /**
   * Import habits with specific duplicate handling options
   * @param jsonData JSON string containing habit data
   * @param duplicateAction How to handle duplicates
   * @param options Additional import options
   * @returns Import result with detailed feedback
   */
  importHabitsWithOptions(
    jsonData: string, 
    duplicateAction: DuplicateAction = 'skip',
    options: ImportOptions = {}
  ): ImportResult {
    try {
      const data = this.parseAndValidateData(jsonData, options.validateData);
      if (!data) {
        return { success: false, message: 'Invalid JSON format. Expected an array of habits.' };
      }

      const existingHabits = this.habitService.habits();
      const duplicateTitles: string[] = [];
      const newHabits: Habit[] = [];
      let replacedCount = 0;

      // Check for duplicates and prepare new habits based on action
      for (const importedHabit of data) {
        const existingIndex = existingHabits.findIndex(h => 
          h.title.toLowerCase() === importedHabit.title.toLowerCase()
        );
        
        if (existingIndex !== -1) {
          duplicateTitles.push(importedHabit.title);
          
          switch (duplicateAction) {
            case 'replace':
              // Replace existing habit with imported one
              importedHabit.id = options.generateNewIds !== false ? this.generateId() : importedHabit.id;
              newHabits.push(importedHabit);
              replacedCount++;
              break;
            case 'keep-both':
              // Keep both - add imported habit with modified title
              importedHabit.id = options.generateNewIds !== false ? this.generateId() : importedHabit.id;
              importedHabit.title = `${importedHabit.title} (Copy)`;
              newHabits.push(importedHabit);
              break;
            case 'skip':
            default:
              // Skip duplicate (do nothing)
              break;
          }
        } else {
          // Generate new ID to avoid conflicts
          if (options.generateNewIds !== false) {
            importedHabit.id = this.generateId();
          }
          newHabits.push(importedHabit);
        }
      }

      // Merge existing habits with new habits
      let mergedHabits = [...existingHabits, ...newHabits];
      
      // If replacing, remove the original duplicates
      if (duplicateAction === 'replace' && replacedCount > 0) {
        mergedHabits = mergedHabits.filter(habit => 
          !duplicateTitles.some(dupTitle => 
            habit.title.toLowerCase() === dupTitle.toLowerCase() && 
            !newHabits.some(newHabit => newHabit.id === habit.id)
          )
        );
      }
      
      this.updateHabits(mergedHabits);

      let message = `Successfully imported ${newHabits.length} habits.`;
      if (duplicateTitles.length > 0) {
        switch (duplicateAction) {
          case 'replace':
            message = `Imported ${newHabits.length} habits. Replaced ${replacedCount} existing habits.`;
            break;
          case 'keep-both':
            message = `Imported ${newHabits.length} habits. Added ${duplicateTitles.length} as copies.`;
            break;
          case 'skip':
            message = `Imported ${newHabits.length - duplicateTitles.length} new habits. Skipped ${duplicateTitles.length} duplicates.`;
            break;
        }
      }

      return { 
        success: true, 
        duplicates: duplicateTitles.length > 0 ? duplicateTitles : undefined,
        message
      };
    } catch (error) {
      console.error('Import error:', error);
      return { success: false, message: 'Failed to parse JSON file. Please check the file format.' };
    }
  }

  /**
   * Validate habit data structure
   * @param data Array of habit objects
   * @param strictValidation Whether to perform strict validation
   * @returns True if valid, false otherwise
   */
  validateHabitData(data: any[], strictValidation: boolean = true): boolean {
    if (!Array.isArray(data)) {
      return false;
    }

    return data.every(habit => {
      if (!habit || typeof habit !== 'object') {
        return false;
      }

      const requiredFields = [
        'id', 'title', 'daysTarget', 'categoryId', 
        'color', 'createdAt', 'checkIns'
      ];

      // Check required fields exist and have correct types
      const hasRequiredFields = requiredFields.every(field => {
        if (!(field in habit)) return false;
        
        switch (field) {
          case 'id':
          case 'title':
          case 'categoryId':
          case 'color':
          case 'createdAt':
            return typeof habit[field] === 'string';
          case 'daysTarget':
            return typeof habit[field] === 'number' && habit[field] > 0;
          case 'checkIns':
            return typeof habit[field] === 'object' && habit[field] !== null;
          default:
            return true;
        }
      });

      if (!hasRequiredFields) return false;

      // Optional fields validation
      if (habit.reminder !== undefined && habit.reminder !== null) {
        const reminderFields = ['time', 'days', 'window'];
        if (!reminderFields.every(field => field in habit.reminder)) {
          return false;
        }
        
        if (strictValidation) {
          if (typeof habit.reminder.time !== 'string') return false;
          if (!Array.isArray(habit.reminder.days)) return false;
          if (typeof habit.reminder.window !== 'number') return false;
        }
      }

      return true;
    });
  }

  /**
   * Preview import without actually importing
   * @param jsonData JSON string containing habit data
   * @returns Preview information about what would be imported
   */
  previewImport(jsonData: string): {
    success: boolean;
    totalHabits: number;
    newHabits: number;
    duplicates: string[];
    message?: string;
  } {
    try {
      const data = this.parseAndValidateData(jsonData);
      if (!data) {
        return {
          success: false,
          totalHabits: 0,
          newHabits: 0,
          duplicates: [],
          message: 'Invalid JSON format. Expected an array of habits.'
        };
      }

      const existingHabits = this.habitService.habits();
      const duplicateTitles: string[] = [];
      let newHabitsCount = 0;

      for (const importedHabit of data) {
        const existingHabit = existingHabits.find(h => 
          h.title.toLowerCase() === importedHabit.title.toLowerCase()
        );
        
        if (existingHabit) {
          duplicateTitles.push(importedHabit.title);
        } else {
          newHabitsCount++;
        }
      }

      return {
        success: true,
        totalHabits: data.length,
        newHabits: newHabitsCount,
        duplicates: duplicateTitles,
        message: `Would import ${newHabitsCount} new habits. ${duplicateTitles.length} duplicates found.`
      };
    } catch (error) {
      console.error('Preview error:', error);
      return {
        success: false,
        totalHabits: 0,
        newHabits: 0,
        duplicates: [],
        message: 'Failed to parse JSON file.'
      };
    }
  }

  /**
   * Parse and validate JSON data
   * @param jsonData JSON string
   * @param validateData Whether to validate the data structure
   * @returns Parsed data or null if invalid
   */
  private parseAndValidateData(jsonData: string, validateData: boolean = true): Habit[] | null {
    try {
      const data = JSON.parse(jsonData);
      
      if (!Array.isArray(data)) {
        return null;
      }

      if (validateData && !this.validateHabitData(data)) {
        return null;
      }

      return data as Habit[];
    } catch {
      return null;
    }
  }

  /**
   * Update habits in the habit service
   * @param habits Array of habits to update
   */
  private updateHabits(habits: Habit[]): void {
    this.habitService.updateHabitsList(habits);
  }

  /**
   * Generate a unique ID
   * @returns Unique ID string
   */
  private generateId(): string {
    return Math.random().toString(36).slice(2, 9);
  }
}
