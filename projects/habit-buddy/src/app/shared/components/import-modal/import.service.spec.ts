import { TestBed } from '@angular/core/testing';
import { ImportService } from './import.service';
import { HabitService } from '../../services/habit.service';
import { Habit } from '../../models/habit.model';

describe('ImportService', () => {
  let service: ImportService;
  let habitService: jasmine.SpyObj<HabitService>;

  const mockHabits: Habit[] = [
    {
      id: '1',
      title: 'Existing Habit',
      daysTarget: 30,
      categoryId: '30',
      color: '#ff6b6b',
      createdAt: '2024-01-01',
      checkIns: {},
      reminder: null
    }
  ];

  const mockImportData: Habit[] = [
    {
      id: '2',
      title: 'New Habit',
      daysTarget: 21,
      categoryId: '21',
      color: '#06B6D4',
      createdAt: '2024-01-15',
      checkIns: {},
      reminder: null
    },
    {
      id: '3',
      title: 'Existing Habit',
      daysTarget: 30,
      categoryId: '30',
      color: '#10B981',
      createdAt: '2024-01-20',
      checkIns: {},
      reminder: null
    }
  ];

  beforeEach(() => {
    const habitServiceSpy = jasmine.createSpyObj('HabitService', ['updateHabitsList'], {
      habits: jasmine.createSpy().and.returnValue(mockHabits)
    });

    TestBed.configureTestingModule({
      providers: [
        ImportService,
        { provide: HabitService, useValue: habitServiceSpy }
      ]
    });

    service = TestBed.inject(ImportService);
    habitService = TestBed.inject(HabitService) as jasmine.SpyObj<HabitService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('importHabits', () => {
    it('should import new habits successfully', () => {
      const jsonData = JSON.stringify([mockImportData[0]]);
      const result = service.importHabits(jsonData);

      expect(result.success).toBe(true);
      expect(result.duplicates).toBeUndefined();
      expect(result.message).toContain('Successfully imported 1 habits');
      expect(habitService.updateHabitsList).toHaveBeenCalled();
    });

    it('should detect and skip duplicates', () => {
      const jsonData = JSON.stringify(mockImportData);
      const result = service.importHabits(jsonData);

      expect(result.success).toBe(true);
      expect(result.duplicates).toEqual(['Existing Habit']);
      expect(result.message).toContain('1 new habits');
      expect(result.message).toContain('1 duplicates found');
    });

    it('should handle invalid JSON', () => {
      const result = service.importHabits('invalid json');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to parse JSON');
    });

    it('should handle invalid data structure', () => {
      const invalidData = [{ invalid: 'data' }];
      const result = service.importHabits(JSON.stringify(invalidData));

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid JSON format');
    });
  });

  describe('importHabitsWithOptions', () => {
    it('should replace duplicates when action is replace', () => {
      const jsonData = JSON.stringify(mockImportData);
      const result = service.importHabitsWithOptions(jsonData, 'replace');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Replaced 1 existing habits');
    });

    it('should keep both when action is keep-both', () => {
      const jsonData = JSON.stringify(mockImportData);
      const result = service.importHabitsWithOptions(jsonData, 'keep-both');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Added 1 as copies');
    });

    it('should skip duplicates when action is skip', () => {
      const jsonData = JSON.stringify(mockImportData);
      const result = service.importHabitsWithOptions(jsonData, 'skip');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Skipped 1 duplicates');
    });
  });

  describe('validateHabitData', () => {
    it('should validate correct habit data', () => {
      const validHabits = [
        {
          id: '1',
          title: 'Test Habit',
          daysTarget: 30,
          categoryId: '30',
          color: '#ff6b6b',
          createdAt: '2024-01-01',
          checkIns: {},
          reminder: null
        }
      ];

      expect(service.validateHabitData(validHabits)).toBe(true);
    });

    it('should reject invalid habit data', () => {
      const invalidHabits = [
        {
          id: '1',
          title: 'Test Habit',
          // Missing required fields
        }
      ];

      expect(service.validateHabitData(invalidHabits)).toBe(false);
    });

    it('should handle empty array', () => {
      expect(service.validateHabitData([])).toBe(true);
    });

    it('should reject non-array data', () => {
      expect(service.validateHabitData({} as any)).toBe(false);
    });
  });

  describe('previewImport', () => {
    it('should preview import without importing', () => {
      const jsonData = JSON.stringify(mockImportData);
      const preview = service.previewImport(jsonData);

      expect(preview.success).toBe(true);
      expect(preview.totalHabits).toBe(2);
      expect(preview.newHabits).toBe(1);
      expect(preview.duplicates).toEqual(['Existing Habit']);
      expect(preview.message).toContain('Would import 1 new habits');
    });

    it('should handle invalid JSON in preview', () => {
      const preview = service.previewImport('invalid json');

      expect(preview.success).toBe(false);
      expect(preview.totalHabits).toBe(0);
      expect(preview.newHabits).toBe(0);
      expect(preview.duplicates).toEqual([]);
    });
  });
});
