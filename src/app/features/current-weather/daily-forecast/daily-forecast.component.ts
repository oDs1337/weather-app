import { Component, input } from '@angular/core';
import { WeatherIconPipe } from '../../../../shared/pipes/weather-icon.pipe';
import { TranslateService } from '@ngx-translate/core';
import { DailyWeather } from '../../../../core/models/weather.model';

@Component({
  selector: 'app-daily-forecast',
  imports: [WeatherIconPipe],
  templateUrl: './daily-forecast.html',
  styleUrl: './daily-forecast.scss',
})
export class DailyForecastComponent {
  daily = input.required<DailyWeather[]>();

  constructor(private translate: TranslateService) {}

  dayName(dateString: string): string {
    const date = new Date(dateString);
    const currentLang = (this.translate.currentLang as any)()?.value || this.translate.currentLang || 'en';
    return date.toLocaleDateString(currentLang, { weekday: 'short' });
  }
}
