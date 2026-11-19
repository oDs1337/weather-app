import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CyclingScore } from '../../core/models/weather.model';
import { getAirQualityColor } from '../../core/utils/air-quality.utils';
import { WeatherIconService } from '../../core/utils/weather-icon-svg.service';

type ScoreGroup = 'excellent' | 'good' | 'fair' | 'poor';

interface SubscoreItem {
  key: string;
  titleKey: string;
  value: number;
  status: string;
  group: ScoreGroup;
  iconSrc: string;
}

const RADIUS = 55;
const CENTER = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const GRADIENT_MAP: Record<ScoreGroup, readonly [string, string]> = {
  excellent: ['#00C853', '#69F0AE'],
  good: ['#B8E054', '#DDF88E'],
  fair: ['#FFD700', '#FF8C00'],
  poor: ['#FF1744', '#FF5252'],
};

const LABEL_KEY_MAP: Record<ScoreGroup, string> = {
  excellent: 'cyclingScore.excellent',
  good: 'cyclingScore.good',
  fair: 'cyclingScore.moderate',
  poor: 'cyclingScore.poor',
};

const BADGE_CLASS_MAP: Record<ScoreGroup, string> = {
  excellent: 'status-excellent',
  good: '',
  fair: 'status-moderate',
  poor: 'status-poor',
};

function toScoreGroup(score: number): ScoreGroup {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

@Component({
  selector: 'app-cycling-score-card',
  imports: [TranslatePipe],
  templateUrl: './cycling-score-card.html',
  styleUrl: './cycling-score-card.component.scss',
})
export class CyclingScoreCardComponent {
  private readonly translate = inject(TranslateService);
  private readonly iconService = inject(WeatherIconService);
  private readonly router = inject(Router);

  readonly score = input.required<CyclingScore>();
  readonly city = input('Your City');
  readonly pm25 = input(0);
  readonly dynamicAdvice = input('');

  protected readonly circumference = CIRCUMFERENCE;
  protected readonly overallScore = computed(() => this.score().overall ?? 0);
  protected readonly scoreGroup = computed(() => toScoreGroup(this.overallScore()));
  protected readonly cityColor = computed(() => getAirQualityColor(this.pm25()));
  protected readonly adviceHasContent = computed(() => this.dynamicAdvice().trim().length > 0);

  protected readonly strokeDashOffset = computed(
    () => CIRCUMFERENCE * (1 - this.overallScore() / 100)
  );
  protected readonly glowFilterId = computed(() => `score-glow-${this.overallScore()}`);
  protected readonly gradientId = computed(() => `score-gradient-${this.overallScore()}`);
  protected readonly gradientUrl = computed(() => `url(#${this.gradientId()})`);
  protected readonly gradientStops = computed(() => GRADIENT_MAP[this.scoreGroup()]);
  protected readonly endpointColor = computed(() => this.gradientStops()[1]);
  protected readonly badgeClass = computed(() => BADGE_CLASS_MAP[this.scoreGroup()]);

  protected readonly endpointDot = computed(() => {
    const progress = this.overallScore() / 100;
    if (progress <= 0 || Number.isNaN(progress)) {
      return { x: CENTER, y: CENTER - RADIUS };
    }
    const angle = progress * 2 * Math.PI;
    return {
      x: CENTER + RADIUS * Math.sin(angle),
      y: CENTER - RADIUS * Math.cos(angle),
    };
  });

  protected readonly subscores = computed<SubscoreItem[]>(() => {
    const data = this.score();
    return [
      {
        key: 'temperature',
        titleKey: 'cyclingScore.temperature',
        value: data.temperature,
        status: data.details.temperatureComfort,
        group: toScoreGroup(data.temperature),
        iconSrc: this.iconService.iconSrc('metric-temperature.svg'),
      },
      {
        key: 'wind',
        titleKey: 'cyclingScore.wind',
        value: data.wind,
        status: data.details.windCondition,
        group: toScoreGroup(data.wind),
        iconSrc: this.iconService.iconSrc('weather-wind.svg'),
      },
      {
        key: 'precipitation',
        titleKey: 'cyclingScore.precipitation',
        value: data.precipitation,
        status: data.details.precipitationRisk,
        group: toScoreGroup(data.precipitation),
        iconSrc: this.iconService.iconSrc('metric-precipitation.svg'),
      },
      {
        key: 'airQuality',
        titleKey: 'cyclingScore.airQuality',
        value: data.airQuality,
        status: data.details.airQualityStatus,
        group: toScoreGroup(data.airQuality),
        iconSrc: this.iconService.iconSrc('metric-air-quality.svg'),
      },
      {
        key: 'uvIndex',
        titleKey: 'cyclingScore.uvIndex',
        value: data.uvIndex,
        status: data.details.uvRiskLevel,
        group: toScoreGroup(data.uvIndex),
        iconSrc: this.iconService.iconSrc('metric-uv.svg'),
      },
      {
        key: 'humidity',
        titleKey: 'cyclingScore.humidity',
        value: data.humidity,
        status: data.details.humidityComfort,
        group: toScoreGroup(data.humidity),
        iconSrc: this.iconService.iconSrc('metric-humidity.svg'),
      },
    ];
  });

  protected goBack(): void {
    this.router.navigate(['/']);
  }

  protected getOverallLabel(): string {
    return this.translate.instant(LABEL_KEY_MAP[this.scoreGroup()]);
  }
}
