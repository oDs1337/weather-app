import { Component, ElementRef, afterRenderEffect, inject, input, signal, viewChild } from '@angular/core';
import { DailyWeather } from '../../../core/models/weather.model';
import { LanguageService } from '../../../core/services/language.service';
import { IconVariant, WeatherIconService } from '../../../core/utils/weather-icon-svg.service';

export function parseIsoHour(isoString: string): number | null {
  if (!isoString || isoString.length < 13) return null;
  const timePart = isoString.slice(11);
  const colonIdx = timePart.indexOf(':');
  if (colonIdx <= 0) return null;
  const hour = Number.parseInt(timePart.slice(0, colonIdx), 10);
  return Number.isNaN(hour) ? null : hour;
}

export function determineDailyVariant(dayData: DailyWeather): IconVariant {
  const sunriseHour = parseIsoHour(dayData.sunrise);
  const sunsetHour = parseIsoHour(dayData.sunset);
  if (sunriseHour === null || sunsetHour === null) return 'day';

  let daylightHours = sunsetHour - sunriseHour;
  if (daylightHours < 0) daylightHours += 24;
  return daylightHours >= 24 - daylightHours ? 'day' : 'night';
}

@Component({
  selector: 'app-daily-forecast',
  templateUrl: './daily-forecast.html',
  styleUrl: './daily-forecast.scss',
})
export class DailyForecastComponent {
  private readonly iconService = inject(WeatherIconService);
  private readonly languageService = inject(LanguageService);

  readonly daily = input.required<DailyWeather[]>();
  protected readonly hasMore = signal(false);
  protected readonly dailyScroll = viewChild<ElementRef<HTMLElement>>('dailyScroll');

  constructor() {
    afterRenderEffect(() => {
      this.daily();
      this.checkScroll();
    });
  }

  protected checkScroll(): void {
    const el = this.dailyScroll()?.nativeElement;
    if (!el) return;
    this.hasMore.set(el.scrollWidth > el.clientWidth);
  }

  protected dayName(dateString: string): string {
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return '';

    const lang = this.languageService.currentLanguage();
    const formatted = new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  protected dayDate(dateString: string): string {
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return '';

    const lang = this.languageService.currentLanguage();
    return new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric' }).format(date);
  }

  protected iconSrc(dayData: DailyWeather): string {
    return this.iconService.getWeatherIconPath(dayData.weather_code, {
      forceVariant: determineDailyVariant(dayData),
    });
  }
}
