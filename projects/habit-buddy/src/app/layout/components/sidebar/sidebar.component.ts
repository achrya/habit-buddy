import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HabitService } from '../../../shared/services/habit.service';
import { ImportService, DuplicateAction } from '../../../shared/components/import-modal/import.service';
import { ImportModalComponent } from '../../../shared/components/import-modal/import-modal.component';
import { DialogComponent, DialogButton } from '../../../shared/components/dialog/dialog.component';
import { DialogService } from '../../../shared/services/dialog.service';
import { LucideAngularModule, Home, Calendar, BarChart3, Clock, Download, Upload, Database, Trash2 } from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ImportModalComponent, DialogComponent, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  protected isImportModalOpen = signal(false);
  protected pendingImportData: string | null = null;
  protected duplicateHabits: string[] = [];

  // Dialog states
  protected showLoadSampleDialog = signal(false);
  protected showClearDataDialog = signal(false);
  
  protected loadSampleDialogButtons: DialogButton[] = [
    { label: 'Cancel', action: 'cancel', variant: 'secondary' },
    { label: 'Load Sample Data', action: 'confirm', variant: 'primary' }
  ];
  
  protected clearDataDialogButtons: DialogButton[] = [
    { label: 'Cancel', action: 'cancel', variant: 'secondary' },
    { label: 'Delete Everything', action: 'confirm', variant: 'danger' }
  ];

  // Lucide icons
  protected readonly HomeIcon = Home;
  protected readonly CalendarIcon = Calendar;
  protected readonly BarChart3Icon = BarChart3;
  protected readonly ClockIcon = Clock;
  protected readonly DownloadIcon = Download;
  protected readonly UploadIcon = Upload;
  protected readonly DatabaseIcon = Database;
  protected readonly Trash2Icon = Trash2;

  private habitService = inject(HabitService);
  private importService = inject(ImportService);
  private router = inject(Router);
  private dialogService = inject(DialogService);

  protected exportData(): void {
    const data = this.habitService.exportHabits();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'habitbuddy_export.json';
    a.click();
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
      // First, check for duplicates using the basic import method
      const result = this.importService.importHabits(jsonData);
      
      if (!result.success) {
        this.dialogService.showError(result.message || 'Import failed');
        return;
      }

      // If there are duplicates, show the modal
      if (result.duplicates && result.duplicates.length > 0) {
        this.duplicateHabits = result.duplicates;
        this.pendingImportData = jsonData;
        this.isImportModalOpen.set(true);
      } else {
        // No duplicates, import was successful
        this.dialogService.showSuccess(result.message || 'Import successful');
        this.router.navigate(['/goals']);
      }
    } catch (error) {
      console.error('Import error:', error);
      this.dialogService.showError('Error importing habits. Please check the file format.');
    }
  }

  protected onImportModalClose(): void {
    this.isImportModalOpen.set(false);
    this.pendingImportData = null;
    this.duplicateHabits = [];
  }

  protected onImportWithAction(action: DuplicateAction): void {
    if (!this.pendingImportData) return;

    try {
      const result = this.importService.importHabitsWithOptions(this.pendingImportData, action);
      
      if (result.success) {
        this.dialogService.showSuccess(result.message || 'Import successful');
        this.router.navigate(['/goals']);
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

  protected loadSampleData(): void {
    this.showLoadSampleDialog.set(true);
  }

  protected onLoadSampleDialogClose(): void {
    this.showLoadSampleDialog.set(false);
  }

  protected onLoadSampleDialogAction(action: string): void {
    if (action === 'confirm') {
      this.habitService.loadSampleHabits();
      this.dialogService.showSuccess('Sample habits loaded! Check the Goals or Calendar page.');
      this.router.navigate(['/goals']);
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
      this.dialogService.showInfo('All data cleared. The app will reload with sample data.');
      this.router.navigate(['/goals']);
    }
    this.showClearDataDialog.set(false);
  }
}
