import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Home, Calendar, BarChart3, Clock, Settings } from 'lucide-angular';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss'
})
export class BottomNavComponent {
  // Lucide icons
  protected readonly HomeIcon = Home;
  protected readonly CalendarIcon = Calendar;
  protected readonly BarChart3Icon = BarChart3;
  protected readonly ClockIcon = Clock;
  protected readonly SettingsIcon = Settings;
}
