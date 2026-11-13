import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AirQuality } from '../../../core/models/weather.model';

@Component({
  selector: 'app-air-quality',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './air-quality.component.html',
  styleUrl: './air-quality.component.scss'
})
export class AirQualityComponent {
  @Input() data!: AirQuality;

  constructor(private translateService: TranslateService) {}

  // PM2.5 severity classification (WHO guideline: 10 μg/m³ annual mean, EU: 25 μg/m³ 24h)
  getAqClass(pm25?: number): string {
    const value = pm25 ?? 0;
    if (value <= 12) return 'aq-good';
    if (value <= 35.4) return 'aq-moderate';
    if (value <= 55.4) return 'aq-unhealthy-sensitive';
    if (value <= 150.4) return 'aq-unhealthy';
    return 'aq-very-unhealthy';
  }

  getAqStatus(pm25?: number): string {
    const value = pm25 ?? 0;
    const statusKey = value <= 12 ? 'good' : value <= 35.4 ? 'moderate' : value <= 55.4 ? 'unhealthySensitive' : value <= 150.4 ? 'unhealthy' : 'veryUnhealthy';
    return this.translateService.instant(`airQuality.${statusKey}`);
  }

  // Numeric AQ level (1–5) for visual dot indicator
  getAqiLevel(pm25?: number): number {
    const value = pm25 ?? 0;
    if (value <= 12) return 1;
    if (value <= 35.4) return 2;
    if (value <= 55.4) return 3;
    if (value <= 150.4) return 4;
    return 5;
  }

  // PM2.5 short label for grid item
  getPm25Label(pm25?: number): string {
    const value = pm25 ?? 0;
    if (value === 0 && !this.isDataAvailable('pm25')) return '—';
    const key = value <= 12 ? 'good' : value <= 35.4 ? 'moderate' : value <= 55.4 ? 'unhealthySensitive' : value <= 150.4 ? 'unhealthy' : 'veryUnhealthy';
    return this.translateService.instant(`airQuality.${key}`);
  }

  // PM10 short label — same AQ thresholds adapted for coarse particles
  getPm10Label(pm10?: number): string {
    const value = pm10 ?? 0;
    if (value === 0 && !this.isDataAvailable('pm10')) return '—';
    // PM10 WHO guideline: 50 μg/m³ annual mean, EU 40
    const key = value <= 50 ? 'good' : value <= 100 ? 'moderate' : value <= 200 ? 'unhealthy' : 'veryUnhealthy';
    return this.translateService.instant(`airQuality.${key}`);
  }

  // Check if a data field has valid (>0) values
  isDataAvailable(field: string): boolean {
    switch (field) {
      case 'pm25': return this.data.pm25 > 0;
      case 'pm10': return this.data.pm10 > 0;
      case 'o3': return this.data.o3 > 0;
      default: return false;
    }
  }

  // Aqi icon helper — kept for compatibility, returns CSS class name
  getAqiIconClass(pm25?: number): string {
    return this.getAqClass(pm25);
  }
}
