import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BottomNavComponent, DialogComponent } from '../../../shared';
import { DialogService } from '../../../shared/services/dialog.service';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, BottomNavComponent, HeaderComponent, DialogComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  protected dialogService = inject(DialogService);

  protected onGlobalDialogAction(action: string): void {
    this.dialogService.close();
  }
}
