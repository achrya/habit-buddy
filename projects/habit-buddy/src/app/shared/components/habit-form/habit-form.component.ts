import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HabitCategory } from '../../models/habit.model';

@Component({
  selector: 'app-habit-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './habit-form.component.html',
  styleUrl: './habit-form.component.scss'
})
export class HabitFormComponent {
  @Input() categories: HabitCategory[] = [];
  @Output() habitAdded = new EventEmitter<{ title: string; categoryId: string }>();

  protected title = signal('');
  protected selectedCategory = signal('21'); // Default to Beginner

  protected onSubmit(): void {
    const title = this.title().trim();
    if (!title) return;

    this.habitAdded.emit({
      title,
      categoryId: this.selectedCategory()
    });

    // Reset form
    this.title.set('');
    this.selectedCategory.set('21');
  }
}
