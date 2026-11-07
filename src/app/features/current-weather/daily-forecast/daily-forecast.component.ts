import { Component, input, inject } from '@angular/core';
import { WeatherIconPipe } from '../../../../shared/pipes/weather-icon.pipe';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../../../app/core/services/language.service';
import { DailyWeather } from '../../../../core/models/weather.model';

@Component({
  selector: 'app-daily-forecast',
  standalone: true,
  imports: [WeatherIconPipe],
  templateUrl: './daily-forecast.html',
  styleUrl: './daily-forecast.scss',
})
export class DailyForecastComponent {
  daily = input.required<DailyWeather[]>();

  private languageService = inject(LanguageService);

  dayName(dateString: string): string {
    const date = new Date(dateString);
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
