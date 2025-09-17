import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HabitService } from '../../../shared/services/habit.service';
import { ImportService, DuplicateAction } from '../../../shared/components/import-modal/import.service';
import { ImportModalComponent } from '../../../shared/components/import-modal/import-modal.component';
import { LucideAngularModule, Home, Calendar, BarChart3, Clock, Download, Upload, Database, Trash2 } from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ImportModalComponent, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  protected isImportModalOpen = signal(false);
  protected pendingImportData: string | null = null;
  protected duplicateHabits: string[] = [];

  // Lucide icons
  protected readonly HomeIcon = Home;
  protected readonly CalendarIcon = Calendar;
  protected readonly BarChart3Icon = BarChart3;
  protected readonly ClockIcon = Clock;
  protected readonly DownloadIcon = Download;
  protected readonly UploadIcon = Upload;
  protected readonly DatabaseIcon = Database;
  protected readonly Trash2Icon = Trash2;

  constructor(
    private habitService: HabitService,
    private importService: ImportService,
    private router: Router
  ) {}

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
        alert('❌ Error reading file. Please try again.');
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
        alert(`❌ ${result.message}`);
        return;
      }

      // If there are duplicates, show the modal
      if (result.duplicates && result.duplicates.length > 0) {
        this.duplicateHabits = result.duplicates;
        this.pendingImportData = jsonData;
        this.isImportModalOpen.set(true);
      } else {
        // No duplicates, import was successful
        alert(`✅ ${result.message}`);
        this.router.navigate(['/goals']);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('❌ Error importing habits. Please check the file format.');
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
        alert(`✅ ${result.message}`);
        this.router.navigate(['/goals']);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('❌ Error importing habits. Please try again.');
    } finally {
      this.onImportModalClose();
    }
  }

  protected loadSampleData(): void {
    if (confirm('Load sample habits? This will add sample data to your current habits.')) {
      this.habitService.loadSampleHabits();
      alert('✅ Sample habits loaded! Check the Goals or Calendar page.');
      this.router.navigate(['/goals']);
    }
  }

  protected clearAllData(): void {
    if (confirm('⚠️ This will delete ALL habits and data. Are you sure?')) {
      if (confirm('This action cannot be undone. Delete everything?')) {
        this.habitService.clearAllHabits();
        alert('🗑️ All data cleared. The app will reload with sample data.');
        this.router.navigate(['/goals']);
      }
    }
  }
}
