import { Component, computed, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CyclingScore } from '../../../core/models/weather.model';
import { WeatherIconService } from '../../../app/core/utils/weather-icon-svg.service';

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
  private sanitizer = inject(DomSanitizer);
  private iconService = inject(WeatherIconService);

  /* ────────────────────────────────────────
     Radial-chart computed helpers
     ──────────────────────────────────────── */

  /** The numeric score (0–100). */
  overallScore() {
    return this.score().overall ?? 0;
  }

  /** SVG circle circumference for r=55: 2 × π × 55 ≈ 345.58. */
  circumference(): number {
    const r = 55;
    return 2 * Math.PI * r;
  }

  /** dashoffset so the arc length equals score% of the circle. */
  strokeDashOffset(): number {
    const c = this.circumference();
    return c * (1 - this.overallScore() / 100);
  }

  /** Unique SVG <filter> id per instance (needed if >1 card on page). */
  glowFilterId(): string {
    return `score-glow-${this.score().overall ?? 0}`;
  }

  /** Unique SVG <linearGradient> id per instance. */
  gradientId(): string {
    return `score-gradient-${this.score().overall ?? 0}`;
  }

  /** Returns `url(#id)` reference for SVG stroke binding. */
  gradientUrl(): string {
    return `url(#${this.gradientId()})`;
  }

  /** X/Y position of the dot at the end of the progress arc (rotated -90°, starts from top). */

  endpointDotX(): number {
    const p = this.overallScore() / 100;
    if (p <= 0 || isNaN(p)) return 70; // center-top fallback for score=0 or null
    const angle = p * 2 * Math.PI; // radians from top, clockwise
    return 70 + 55 * Math.sin(angle);
  }

  endpointDotY(): number {
    const p = this.overallScore() / 100;
    if (p <= 0 || isNaN(p)) return 15; // top-most point for score=0 or null
    const angle = p * 2 * Math.PI;
    return 70 - 55 * Math.cos(angle);
  }

  /** Inline transform string for SVG dot position. */
  endpointDotTransform(): string {
    const x = this.endpointDotX();
    const y = this.endpointDotY();
    return `translate(${x - 70}, ${y - 70})`; // offset from cx=70 cy=70 center
  }

  /** Debug: returns score for template display. */
  debugScore(): string {
    const x = this.endpointDotX();
    const y = this.endpointDotY();
    return `${this.overallScore()}% → X=${x.toFixed(1)}, Y=${y.toFixed(1)}`;
  }

  /* ────────────────────────────────────────
     Colour / badge helpers (driven by score group)
     ──────────────────────────────────────── */

  private _colorMap: Record<string, string> = {
    excellent: '#00C853',
    good:      '#B8E054',
    fair:      '#FFAB00',   // amber for moderate (~40-59)
    poor:      '#FF3D00',
  };

  private _gradientMap: Record<string, [string, string]> = {
    excellent: ['#00C853', '#69F0AE'],
    good:      ['#B8E054', '#DDF88E'],
    fair:      ['#FFD700', '#FF8C00'],   // yellow → orange
    poor:      ['#FF1744', '#FF5252'],   // red tones
  };

  /** CSS group class (excellent | good | fair | poor). */
  scoreGroup(): string {
    const s = this.overallScore();
    if (s >= 80) return 'excellent';
    if (s >= 60) return 'good';
    if (s >= 40) return 'fair';
    return 'poor';
  }

  /** Solid stroke colour for the track. */
  trackColor(): string {
    return this._colorMap[this.scoreGroup()] ?? '#FFAB00';
  }

  /** Gradient stops as "color1 color2" string for inline gradient binding. */
  gradientStops(): [string, string] {
    const colors = this._gradientMap[this.scoreGroup()] ?? ['#FFD700', '#FF8C00'];
    return colors;
  }

  /** CSS class applied to the badge container (status-moderate / status-excellent / status-poor). */
  badgeClass(): string {
    const g = this.scoreGroup();
    if (g === 'fair')   return 'status-moderate';
    if (g === 'excellent') return 'status-excellent';
    if (g === 'poor')       return 'status-poor';
    return ''; // good → no extra class needed
  }

  /* ────────────────────────────────────────
     i18n labels
     ──────────────────────────────────────── */

  getOverallLabel(): string {
    const g = this.scoreGroup();
    const keyMap: Record<string, string> = {
      excellent: 'excellent',
      good:      'good',
      fair:      'moderate',
      poor:      'poor',
    };
    return this.translate.instant(`cyclingScore.${keyMap[g] ?? 'moderate'}`);
  }

  /* ────────────────────────────────────────
     Icon helpers (unchanged from original)
     ──────────────────────────────────────── */

  temperatureIconSrc(): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(
      this.iconService.iconSrc('metric-temperature.svg')
    );
  }

  precipitationIconSrc(): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(
      this.iconService.iconSrc('metric-precipitation.svg')
    );
  }

  airQualityIconSrc(): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(
      this.iconService.iconSrc('metric-air-quality.svg')
    );
  }

  uvIndexIconSrc(): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(
      this.iconService.iconSrc('metric-uv.svg')
    );
  }

  humidityIconSrc(): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(
      this.iconService.iconSrc('metric-humidity.svg')
    );
  }

  windIconSrc(): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(
      this.iconService.iconSrc('weather-wind.svg')
    );
  }

  /* ────────────────────────────────────────
     Sub-scores (unchanged shape)
     ──────────────────────────────────────── */

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
      { key: 'temperature',  titleKey: 'cyclingScore.temperature',   value: data.temperature,  status: data.details.temperatureComfort, group: this.getSubscoreClass(data.temperature), icon: 'temperature' as const },
      { key: 'wind',         titleKey: 'cyclingScore.wind',           value: data.wind,          status: data.details.windCondition,        group: this.getSubscoreClass(data.wind),         icon: 'wind' as const },
      { key: 'precipitation',titleKey: 'cyclingScore.precipitation',  value: data.precipitation, status: data.details.precipitationRisk,    group: this.getSubscoreClass(data.precipitation), icon: 'precipitation' as const },
      { key: 'airQuality',   titleKey: 'cyclingScore.airQuality',     value: data.airQuality,  status: data.details.airQualityStatus,     group: this.getSubscoreClass(data.airQuality),   icon: 'airQuality' as const },
      { key: 'uvIndex',      titleKey: 'cyclingScore.uvIndex',        value: data.uvIndex,     status: data.details.uvRiskLevel,          group: this.getSubscoreClass(data.uvIndex),      icon: 'uvIndex' as const },
      { key: 'humidity',     titleKey: 'cyclingScore.humidity',       value: data.humidity,    status: data.details.humidityComfort,      group: this.getSubscoreClass(data.humidity),     icon: 'humidity' as const },
    ];
  }

  /** CSS class for a given numeric score (used by subscores). */
  getSubscoreClass(scoreVal: number): string {
    if (scoreVal >= 80) return 'excellent';
    if (scoreVal >= 60) return 'good';
    if (scoreVal >= 40) return 'fair';
    return 'poor';
  }

  /** Sub-score group colour for the icon. */
  subscoreColor(group: string): string {
    const colors: Record<string, string> = {
      excellent: '#00C853',
      good:      '#B8E054',
      fair:      '#FFAB00',
      poor:      '#FF3D00',
    };
    return colors[group] ?? '#ffffff';
  }

  /** Sub-score background colour. */
  subscoreBgColor(group: string): string {
    const colors: Record<string, string> = {
      excellent: 'rgba(0,200,83,0.12)',
      good:      'rgba(184,224,84,0.12)',
      fair:      'rgba(255,171,0,0.12)',
      poor:      'rgba(255,61,0,0.12)',
    };
    return colors[group] ?? 'rgba(255,255,255,0.08)';
  }
}
