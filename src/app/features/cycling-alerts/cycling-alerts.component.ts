import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
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

  constructor(private translateService: TranslateService) {}

  getSeverityLabel(type: string): string {
    const key = type === 'danger' ? 'critical' : (type === 'warning' ? 'warning' : 'informational');
    return this.translateService.instant(`cyclingAlerts.${key}`);
  }

  isCritical(type: string): boolean {
    return type === 'danger';
  }

  isWarning(type: string): boolean {
    return type === 'warning';
  }
}
