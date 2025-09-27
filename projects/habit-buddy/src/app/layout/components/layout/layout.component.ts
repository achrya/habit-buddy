import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BottomNavComponent, DialogComponent, HelpOverlayComponent, ReminderDialogComponent, NotificationService } from '../../../shared';
import { GlobalHelpComponent } from '../../../shared/components/global-help/global-help.component';
import { DialogService } from '../../../shared/services/dialog.service';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, BottomNavComponent, HeaderComponent, DialogComponent, HelpOverlayComponent, GlobalHelpComponent, ReminderDialogComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  protected dialogService = inject(DialogService);
  protected notificationService = inject(NotificationService);
  protected readonly isHelpOverlayOpen = signal(false);

  protected onGlobalDialogAction(action: string): void {
    this.dialogService.close();
  }

  protected onHelpClick(): void {
    this.isHelpOverlayOpen.set(!this.isHelpOverlayOpen());
  }

  protected onHelpOverlayClose(): void {
    this.isHelpOverlayOpen.set(false);
  }

  protected onReminderDialogClose(): void {
    this.notificationService.closeReminderDialog();
  }

  protected async onMarkHabitAsDone(habitId: string): Promise<void> {
    await this.notificationService.markHabitAsDone(habitId);
  }

  protected onSnoozeReminder(habitId: string): void {
    this.notificationService.snoozeReminder(habitId);
  }
}
