import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HabitService } from '../../../shared/services/habit.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  constructor(
    private habitService: HabitService,
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
        try {
          const success = this.habitService.importHabits(result);
          if (success) {
            alert('✅ Habits imported successfully!');
            // Navigate to goals page to see imported habits
            this.router.navigate(['/goals']);
          } else {
            alert('❌ Invalid JSON file. Please make sure the file contains valid habit data.');
          }
        } catch (error) {
          console.error('Import error:', error);
          alert('❌ Error importing habits. Please check the file format.');
        }
      };
      reader.onerror = () => {
        alert('❌ Error reading file. Please try again.');
      };
      reader.readAsText(file);
    };
    input.click();
  }
}
