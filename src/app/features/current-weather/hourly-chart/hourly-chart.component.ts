import { Component, computed, inject, input } from '@angular/core';
import { WeatherIconService } from '../../../../app/core/utils/weather-icon-svg.service';
import { HourlyWeather } from '../../../../core/models/weather.model';

@Component({
  selector: 'app-hourly-chart',
  standalone: true,
  imports: [],
  templateUrl: './hourly-chart.html',
  styleUrl: './hourly-chart.scss',
})
export class HourlyChartComponent {
  private iconService = inject(WeatherIconService);

  hourly = input.required<HourlyWeather[]>();

  /** Display hours for the timeline. Every 2nd hour, up to ~13 points (≈26h of data). */
  readonly displayHours = computed(() => {
    const hours = this.hourly();
    const result: { time: string; temp: number; icon: number; precip: number | null; wind: number | null }[] = [];

    for (let i = 0; i < hours.length && result.length < 13; i += 2) {
      const date = new Date(hours[i].time);
      // 24h format without leading zero ("8", "14") — saves horizontal space on mobile.
      result.push({
        time: String(date.getHours()),
        temp: hours[i].temperature_2m,
        icon: hours[i].weather_code,
        precip: hours[i].precipitation_probability ?? null,
        wind: Math.round(hours[i].windspeed_10m),
      });
    }

    return result;
  });

  /** Whether the data array is long enough that only a subset renders. */
  readonly hasMore = computed(() => this.hourly().length > this.displayHours().length * 2);

  /** Render inline SVG for a weather code. Returns trusted HTML string. */
  iconSvg(code: number): string {
    return this.iconService.renderIcon(code, 32);
  }
}
