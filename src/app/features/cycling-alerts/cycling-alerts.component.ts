import { Component, inject, input } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CyclingIssue } from '../../core/models/weather.model';

@Component({
  selector: 'app-cycling-alerts',
  imports: [TranslatePipe],
  templateUrl: './cycling-alerts.html',
  styleUrl: './cycling-alerts.component.scss',
})
export class CyclingAlertsComponent {
  private readonly translate = inject(TranslateService);

  readonly issues = input<CyclingIssue[]>([]);

  protected getSeverityLabel(type: CyclingIssue['type']): string {
    const key = type === 'danger' ? 'critical' : type === 'warning' ? 'warning' : 'informational';
    return this.translate.instant(`cyclingAlerts.${key}`);
  }
}
