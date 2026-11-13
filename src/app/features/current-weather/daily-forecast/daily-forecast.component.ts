import { Component, inject, input, ElementRef, ViewChild, signal, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { WeatherIconService } from '../../../../app/core/utils/weather-icon-svg.service';
import { LanguageService } from '../../../../app/core/services/language.service';
import { DailyWeather } from '../../../../core/models/weather.model';

@Component({
  selector: 'app-daily-forecast',
  standalone: true,
  imports: [],
  templateUrl: './daily-forecast.html',
  styleUrl: './daily-forecast.scss',
})
export class DailyForecastComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private iconService = inject(WeatherIconService);
  private languageService = inject(LanguageService);
  private elRef = inject(ElementRef);

  daily = input.required<DailyWeather[]>();
  hasMore = signal(false);

  @ViewChild('dailyScroll', { static: false }) dailyScroll!: ElementRef;

  ngOnInit(): void {
    this.checkScroll();
  }

  /** Check if the scroll container has more content to show. */
  checkScroll(): void {
    const el = this.dailyScroll?.nativeElement as HTMLElement | undefined;
    if (!el) return;
    this.hasMore.set(el.scrollWidth > el.clientWidth);
  }

  onScroll(): void {
    this.checkScroll();
  }

  /** Day name in the user's language. */
  dayName(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00'); // force midnight local to avoid timezone shift
    if (isNaN(date.getTime())) return '';

    const lang = this.languageService.getLanguage();

    switch (lang) {
      case 'pl':
        return this.getDayPolish(date.getDay());
      case 'fr':
        return this.getDayFrench(date.getDay());
      case 'ru':
        return this.getDayRussian(date.getDay());
      case 'uk':
        return this.getDayUkrainian(date.getDay());
      default:
        return this.getDayEnglish(date.getDay());
    }
  }

  /** Month/day label (e.g. "Nov 12") for secondary date info on each card. */
  dayDate(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  }

  /**
   * Parse an ISO date/time string (YYYY-MM-DD or YYYY-MM-DDTHH:MM) and return the hour.
   * Returns null on failure.
   */
  private parseHour(isoString: string): number | null {
    try {
      if (!isoString || isoString.length < 13) return null;
      const timePart = isoString.slice(11); // "HH:..." or similar
      const colonIdx = timePart.indexOf(':');
      if (colonIdx <= 0) return null;
      const hour = parseInt(timePart.slice(0, colonIdx), 10);
      if (isNaN(hour)) return null;
      return hour;
    } catch {
      return null;
    }
  }

  /**
   * Derive the best day/night variant for a daily forecast row.
   *
   * Daily forecasts represent full calendar days — each card spans sunrise
   * to sunrise of the next day. We use the row's own `sunrise` and `sunset`
   * timestamps to determine when daylight occurs, then pick the part of the
   * cycle that is longer:
   *  - If daylight ≥ night → 'day' (most common in temperate latitudes)
   *  - Otherwise              → 'night' (high-latitude winter, polar regions)
   */
  private determineDailyVariant(dayData: DailyWeather): 'day' | 'night' {
    const sunriseHour = this.parseHour(dayData.sunrise);
    const sunsetHour = this.parseHour(dayData.sunset);

    // Both timestamps required to compute daylight duration reliably.
    if (sunriseHour === null || sunsetHour === null) return 'day';

    try {
      let daylightHours = sunsetHour - sunriseHour;
      // If sunset < sunrise the day spans midnight (e.g. polar regions); treat as full 24 h day.
      if (daylightHours < 0) daylightHours += 24;

      const nightHours = 24 - daylightHours;

      return daylightHours >= nightHours ? 'day' : 'night';
    } catch {
      return 'day';
    }
  }

  /** Build asset URL for a weather icon using central resolve(). */
  iconSrc(dayData: DailyWeather): SafeUrl {
    const variant = this.determineDailyVariant(dayData);
    const resolution = this.iconService.resolve(dayData.weather_code, { forceVariant: variant });

    let filename: string;
    if (resolution.group === 'overcast' && !resolution.filename.startsWith('weather-overcast')) {
      filename = 'assets/icons/velora/weather-overcast.svg';
    } else {
      filename = `assets/icons/velora/${resolution.filename}.svg`;
    }

    return this.sanitizer.bypassSecurityTrustUrl(filename);
  }

  // ---- Localised day names (unchanged logic from previous phases) ----

  private getDayEnglish(dayIndex: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  }

  private getDayPolish(dayIndex: number): string {
    const days = ['Ndz', 'Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob'];
    return days[dayIndex];
  }

  private getDayFrench(dayIndex: number): string {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[dayIndex];
  }

  private getDayRussian(dayIndex: number): string {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[dayIndex];
  }

  private getDayUkrainian(dayIndex: number): string {
    const days = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[dayIndex];
  }
}
