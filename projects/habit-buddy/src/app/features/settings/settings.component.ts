import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Database, Download, Upload, Trash2, Settings, User, Bell, Shield } from 'lucide-angular';
import { HabitService } from '../../shared/services/habit.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ImportModalComponent } from '../../shared/components/import-modal/import-modal.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { ImportService, DuplicateAction } from '../../shared/components/import-modal/import.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, LucideAngularModule, ImportModalComponent, DialogComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  private habitService = inject(HabitService);
  private dialogService = inject(DialogService);
  private importService = inject(ImportService);

  // Dialog states
  protected readonly showLoadSampleDialog = signal(false);
  protected readonly showClearDataDialog = signal(false);
  protected readonly isImportModalOpen = signal(false);

  // Import modal data
  protected duplicateHabits: any[] = [];
  protected pendingImportData = '';

  // Icons
  protected readonly SettingsIcon = Settings;
  protected readonly DatabaseIcon = Database;
  protected readonly DownloadIcon = Download;
  protected readonly UploadIcon = Upload;
  protected readonly Trash2Icon = Trash2;
  protected readonly UserIcon = User;
  protected readonly BellIcon = Bell;
  protected readonly ShieldIcon = Shield;

  // Data Management Methods
  protected exportData(): void {
    const habits = this.habitService.habits();
    const data = {
      habits: habits,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitbuddy-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  protected importData(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        this.handleImport(result);
      };
      reader.onerror = () => {
        this.dialogService.showError('Error reading file. Please try again.');
      };
      reader.readAsText(file);
    };
    input.click();
  }

  private handleImport(jsonData: string): void {
    try {
      const result = this.importService.importHabits(jsonData);
      
      if (!result.success) {
        this.dialogService.showError(result.message || 'Import failed');
        return;
      }

      if (result.duplicates && result.duplicates.length > 0) {
        this.duplicateHabits = result.duplicates;
        this.pendingImportData = jsonData;
        this.isImportModalOpen.set(true);
      } else {
        this.dialogService.showSuccess('Habits imported successfully!');
      }
    } catch (error: unknown) {
      this.dialogService.showError('Invalid JSON file. Please check the file format.');
    }
  }

  protected loadSampleData(): void {
    this.showLoadSampleDialog.set(true);
  }

  protected onLoadSampleDialogClose(): void {
    this.showLoadSampleDialog.set(false);
  }

  protected onLoadSampleDialogAction(action: string): void {
    if (action === 'confirm') {
      this.habitService.loadSampleHabits();
      this.dialogService.showSuccess('Sample data loaded successfully!');
    }
    this.showLoadSampleDialog.set(false);
  }

  protected clearAllData(): void {
    this.showClearDataDialog.set(true);
  }

  protected onClearDataDialogClose(): void {
    this.showClearDataDialog.set(false);
  }

  protected onClearDataDialogAction(action: string): void {
    if (action === 'confirm') {
      this.habitService.clearAllHabits();
      this.dialogService.showSuccess('All data cleared successfully!');
    }
    this.showClearDataDialog.set(false);
  }

  protected onImportModalClose(): void {
    this.isImportModalOpen.set(false);
    this.duplicateHabits = [];
    this.pendingImportData = '';
  }

  protected onImportWithAction(action: DuplicateAction): void {
    if (!this.pendingImportData) return;

    try {
      const result = this.importService.importHabitsWithOptions(this.pendingImportData, action);
      
      if (result.success) {
        this.dialogService.showSuccess(result.message || 'Habits imported successfully!');
      } else {
        this.dialogService.showError(result.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      this.dialogService.showError('Error importing habits. Please try again.');
    } finally {
      this.onImportModalClose();
    }
  }
}
