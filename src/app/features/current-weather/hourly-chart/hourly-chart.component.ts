import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
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
  private sanitizer = inject(DomSanitizer);
  private iconService = inject(WeatherIconService);

  hourly = input.required<HourlyWeather[]>();

  /** Display hours for the timeline. Every 2nd hour, up to ~13 points (≈26h of data). */
  readonly displayHours = computed(() => {
    const hours = this.hourly();
    const result: { time: string; temp: number; icon: number; precip: number | null; wind: number | null; hourForTimeContext: number }[] = [];

    for (let i = 0; i < hours.length && result.length < 13; i += 2) {
      const date = new Date(hours[i].time);
      // 24h format without leading zero ("8", "14") — saves horizontal space on mobile.
      result.push({
        time: String(date.getHours()),
        temp: hours[i].temperature_2m,
        icon: hours[i].weather_code,
        precip: hours[i].precipitation_probability ?? null,
        wind: Math.round(hours[i].windspeed_10m),
        hourForTimeContext: date.getHours(),
      });
    }

    return result;
  });

  /** Whether the data array is long enough that only a subset renders. */
  readonly hasMore = computed(() => this.hourly().length > this.displayHours().length * 2);

  /** Build asset URL for weather icon with per-point day/night variant resolution. */
  iconSrc(hourData: { icon: number; hourForTimeContext: number }): SafeUrl | null {
    const code = hourData.icon;
    if (!code) return null;

    const resolution = this.iconService.resolve(code, { hourForTimeContext: hourData.hourForTimeContext });

    let filename: string;
    if (resolution.group === 'overcast' && !resolution.filename.startsWith('weather-overcast')) {
      filename = 'assets/icons/velora/weather-overcast.svg';
    } else {
      filename = `assets/icons/velora/${resolution.filename}.svg`;
    }

    return this.sanitizer.bypassSecurityTrustUrl(filename);
  }
}
