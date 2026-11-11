import { Component, inject, input } from '@angular/core';
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
export class DailyForecastComponent {
  private iconService = inject(WeatherIconService);
  private languageService = inject(LanguageService);

  daily = input.required<DailyWeather[]>();

  /** Render inline SVG for a weather code. */
  readonly iconSvg = (code: number) => this.iconService.renderIcon(code, 28);

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
