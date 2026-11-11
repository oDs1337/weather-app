import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CyclingScore } from '../../../core/models/weather.model';

@Component({
  selector: 'app-cycling-score-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cycling-score-card.html',
  styleUrl: './cycling-score-card.component.scss'
})
export class CyclingScoreCardComponent {
  score = input.required<CyclingScore>();
  city = input<string>('Your City');

  private translate = inject(TranslateService);

  /** CSS class for a given numeric score */
  getScoreClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  /** Overall score class / colour group */
  scoreGroup() {
    const s = this.score().overall ?? 0;
    return this.getScoreClass(s);
  }

  /** Human-readable label for the overall rating */
  getOverallLabel(): string {
    const s = this.score().overall ?? 0;
    const key = s >= 80 ? 'excellent' : s >= 60 ? 'good' : s >= 40 ? 'moderate' : 'poor';
    return this.translate.instant(`cyclingScore.${key}`);
  }

  /** SVG icon for each subscore dimension */
  subscores() {
    const data = this.score();
    if (!data) return [];

    interface Subscore {
      key: string;
      titleKey: string;
      value: number;
      status: string;
      group: string;
      icon: 'temperature' | 'wind' | 'precipitation' | 'airQuality' | 'uvIndex' | 'humidity';
    }

    return [
      {
        key: 'temperature',
        titleKey: 'cyclingScore.temperature',
        value: data.temperature,
        status: data.details.temperatureComfort,
        group: this.getScoreClass(data.temperature),
        icon: 'temperature' as const,
      },
      {
        key: 'wind',
        titleKey: 'cyclingScore.wind',
        value: data.wind,
        status: data.details.windCondition,
        group: this.getScoreClass(data.wind),
        icon: 'wind' as const,
      },
      {
        key: 'precipitation',
        titleKey: 'cyclingScore.precipitation',
        value: data.precipitation,
        status: data.details.precipitationRisk,
        group: this.getScoreClass(data.precipitation),
        icon: 'precipitation' as const,
      },
      {
        key: 'airQuality',
        titleKey: 'cyclingScore.airQuality',
        value: data.airQuality,
        status: data.details.airQualityStatus,
        group: this.getScoreClass(data.airQuality),
        icon: 'airQuality' as const,
      },
      {
        key: 'uvIndex',
        titleKey: 'cyclingScore.uvIndex',
        value: data.uvIndex,
        status: data.details.uvRiskLevel,
        group: this.getScoreClass(data.uvIndex),
        icon: 'uvIndex' as const,
      },
      {
        key: 'humidity',
        titleKey: 'cyclingScore.humidity',
        value: data.humidity,
        status: data.details.humidityComfort,
        group: this.getScoreClass(data.humidity),
        icon: 'humidity' as const,
      },
    ];
  }
}
