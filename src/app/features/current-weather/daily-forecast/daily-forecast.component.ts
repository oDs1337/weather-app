import { Component, input } from '@angular/core';
import { WeatherIconPipe } from '../../../../shared/pipes/weather-icon.pipe';
import { DailyWeather } from '../../../../core/models/weather.model';

@Component({
  selector: 'app-daily-forecast',
  imports: [WeatherIconPipe],
  templateUrl: './daily-forecast.html',
  styleUrl: './daily-forecast.scss',
})
export class DailyForecastComponent {
  daily = input.required<DailyWeather[]>();

  dayName(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
}
