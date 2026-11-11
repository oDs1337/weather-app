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

  getSeverityLabel(type: string): string {
    switch (type) {
      case 'danger': return 'critical';
      case 'warning': return 'warning';
      case 'info': return 'informational';
      default: return 'informational';
    }
  }

  isCritical(type: string): boolean {
    return type === 'danger';
  }

  isWarning(type: string): boolean {
    return type === 'warning';
  }
}
