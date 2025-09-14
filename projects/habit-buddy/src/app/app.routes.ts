import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/goals',
    pathMatch: 'full'
  },
  {
    path: 'goals',
    loadComponent: () => import('./features/goals/components/goals/goals.component').then(m => m.GoalsComponent)
  },
  {
    path: 'calendar',
    loadComponent: () => import('./features/calendar/components/calendar/calendar.component').then(m => m.CalendarComponent)
  },
  {
    path: 'stats',
    loadComponent: () => import('./features/statistics/components/stats/stats.component').then(m => m.StatsComponent)
  },
  {
    path: 'reminders',
    loadComponent: () => import('./features/reminders/components/reminders/reminders.component').then(m => m.RemindersComponent)
  }
];
