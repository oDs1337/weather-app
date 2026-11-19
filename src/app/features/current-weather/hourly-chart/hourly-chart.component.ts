import { Component, computed, inject, input } from '@angular/core';
import { HourlyWeather } from '../../../core/models/weather.model';
import { WeatherIconService } from '../../../core/utils/weather-icon-svg.service';

export interface HourlyDisplayPoint {
  isoTime: string;
  time: string;
  temp: number;
  icon: number;
  iconSrc: string;
  precip: number | null;
  wind: number | null;
  hourForTimeContext: number;
}

const MAX_DISPLAY_POINTS = 13;

export function buildHourlyDisplayPoints(
  hours: HourlyWeather[],
  iconService: WeatherIconService
): HourlyDisplayPoint[] {
  const result: HourlyDisplayPoint[] = [];

  for (let i = 0; i < hours.length && result.length < MAX_DISPLAY_POINTS; i += 2) {
    const entry = hours[i];
    const hour = new Date(entry.time).getHours();

    result.push({
      isoTime: entry.time,
      time: String(hour),
      temp: entry.temperature_2m,
      icon: entry.weather_code,
      iconSrc: iconService.getWeatherIconPath(entry.weather_code, { hourForTimeContext: hour }),
      precip: entry.precipitation_probability ?? null,
      wind: Math.round(entry.windspeed_10m),
      hourForTimeContext: hour,
    });
  }

  return result;
}

@Component({
  selector: 'app-hourly-chart',
  templateUrl: './hourly-chart.html',
  styleUrl: './hourly-chart.scss',
})
export class HourlyChartComponent {
  private readonly iconService = inject(WeatherIconService);

  readonly hourly = input.required<HourlyWeather[]>();

  protected readonly displayHours = computed(() =>
    buildHourlyDisplayPoints(this.hourly(), this.iconService)
  );

  protected readonly hasMore = computed(
    () => this.hourly().length > this.displayHours().length * 2
  );
}
