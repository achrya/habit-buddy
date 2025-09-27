import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, HelpCircle } from 'lucide-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Output() helpClick = new EventEmitter<void>();

  protected readonly HelpCircleIcon = HelpCircle;

  protected onHelpClick(): void {
    this.helpClick.emit();
  }
}
