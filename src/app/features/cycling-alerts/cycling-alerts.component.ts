import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { CyclingIssue } from '../../../core/models/weather.model';

@Component({
  selector: 'app-cycling-alerts',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cycling-alerts.html',
  styleUrl: './cycling-alerts.component.scss'
})
export class CyclingAlertsComponent {
  @Input() issues: CyclingIssue[] = [];

  getAlertClass(type: string): string {
    switch (type) {
      case 'danger': return 'alert-danger';
      case 'warning': return 'alert-warning';
      case 'info': return 'alert-info';
      default: return 'alert-info';
    }
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'danger': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }
}
