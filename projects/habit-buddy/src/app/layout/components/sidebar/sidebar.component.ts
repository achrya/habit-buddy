import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Home, Calendar, BarChart3, Clock, Settings } from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  // Lucide icons
  protected readonly HomeIcon = Home;
  protected readonly CalendarIcon = Calendar;
  protected readonly BarChart3Icon = BarChart3;
  protected readonly ClockIcon = Clock;
  protected readonly SettingsIcon = Settings;
}