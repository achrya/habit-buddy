import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, HelpCircle } from 'lucide-angular';
import { HelpOverlayComponent } from '../help-overlay/help-overlay.component';

@Component({
  selector: 'app-global-help',
  imports: [CommonModule, LucideAngularModule, HelpOverlayComponent],
  templateUrl: './global-help.component.html',
  styleUrls: ['./global-help.component.scss']
})
export class GlobalHelpComponent {
  protected readonly isHelpOverlayOpen = signal(false);
  protected readonly HelpCircleIcon = HelpCircle;

  protected onHelpClick(): void {
    this.isHelpOverlayOpen.set(!this.isHelpOverlayOpen());
  }

  protected onHelpOverlayClose(): void {
    this.isHelpOverlayOpen.set(false);
  }
}
