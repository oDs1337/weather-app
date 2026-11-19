import { Component, computed, inject, input } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AirQuality } from '../../core/models/weather.model';
import {
  getO3StatusKey,
  getPm10StatusKey,
  getPm25Level,
  getPm25Severity,
  getPm25StatusKey,
} from '../../core/utils/air-quality.utils';

@Component({
  selector: 'app-air-quality',
  imports: [TranslatePipe],
  templateUrl: './air-quality.component.html',
  styleUrl: './air-quality.component.scss',
})
export class AirQualityComponent {
  private readonly translate = inject(TranslateService);

  readonly data = input.required<AirQuality>();

  protected readonly levels = [1, 2, 3, 4, 5] as const;
  protected readonly aqClass = computed(() => getPm25Severity(this.data().pm25));
  protected readonly aqiLevel = computed(() => getPm25Level(this.data().pm25));

  protected getSeverityClass(value?: number): string {
    return getPm25Severity(value);
  }

  protected getAqStatus(): string {
    return this.translate.instant(`airQuality.${getPm25StatusKey(this.data().pm25)}`);
  }

  protected getPm25Label(): string {
    const value = this.data().pm25;
    if (value <= 0) return '—';
    return this.translate.instant(`airQuality.${getPm25StatusKey(value)}`);
  }

  protected getPm10Label(): string {
    const value = this.data().pm10;
    if (value <= 0) return '—';
    return this.translate.instant(`airQuality.${getPm10StatusKey(value)}`);
  }

  protected getO3Label(): string {
    const value = this.data().o3;
    if (value <= 0) return '—';
    return this.translate.instant(`airQuality.${getO3StatusKey(value)}`);
  }
}
