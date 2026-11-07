import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AirQuality } from '../../../core/models/weather.model';

@Component({
  selector: 'app-air-quality',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './air-quality.component.html',
  styleUrls: ['./air-quality.component.scss']
})
export class AirQualityComponent {
  @Input() data!: AirQuality;

  getAqClass(pm25: number): string {
    if (pm25 <= 12) return 'aq-good';
    if (pm25 <= 35.4) return 'aq-moderate';
    if (pm25 <= 55.4) return 'aq-unhealthy-sensitive';
    if (pm25 <= 150.4) return 'aq-unhealthy';
    return 'aq-very-unhealthy';
  }

  getStatClass(pm: number): string {
    if (pm <= 12) return 'stat-good';
    if (pm <= 35.4) return 'stat-moderate';
    if (pm <= 55.4) return 'stat-unhealthy-sensitive';
    if (pm <= 150.4) return 'stat-unhealthy';
    return 'stat-very-unhealthy';
  }

  getAqStatus(pm25: number): string {
    if (pm25 <= 12) return 'Good';
    if (pm25 <= 35.4) return 'Moderate';
    if (pm25 <= 55.4) return 'Unhealthy for Sensitive Groups';
    if (pm25 <= 150.4) return 'Unhealthy';
    return 'Very Unhealthy';
  }
}
