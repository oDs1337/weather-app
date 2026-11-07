import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../../app/core/services/language.service';

@Pipe({
  name: 'localizedDate',
  standalone: true,
})
export class LocalizedDatePipe implements PipeTransform {
  private languageService = inject(LanguageService);

  transform(dateString: string | Date): string {
    if (!dateString) return '';

    let date: Date;
    
    // Handle various date formats from the API
    if (typeof dateString === 'string') {
      const parsed = new Date(dateString);
      if (isNaN(parsed.getTime())) {
        const parts = dateString.split('T')[0].split('-');
        if (parts.length === 3) {
          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          return '';
        }
      } else {
        date = parsed;
      }
    } else {
      date = dateString;
    }

    if (isNaN(date.getTime())) return '';

    // Get current language from LanguageService
    const lang = this.languageService.getLanguage();
    
    let dayName: string;
    let monthName: string;
    
    switch (lang) {
      case 'pl':
        dayName = this.getDayPolish(date.getDay());
        monthName = this.getMonthPolish(date.getMonth());
        break;
      case 'fr':
        dayName = this.getDayFrench(date.getDay());
        monthName = this.getMonthFrench(date.getMonth());
        break;
      case 'ru':
        dayName = this.getDayRussian(date.getDay());
        monthName = this.getMonthRussian(date.getMonth());
        break;
      case 'uk':
        dayName = this.getDayUkrainian(date.getDay());
        monthName = this.getMonthUkrainian(date.getMonth());
        break;
      default: // English and fallback
        dayName = this.getDayEnglish(date.getDay());
        monthName = this.getMonthEnglish(date.getMonth());
    }

    const day = date.getDate();
    return `${dayName}, ${monthName} ${day}`;
  }

  private getDayEnglish(dayIndex: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  }

  private getMonthEnglish(monthIndex: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
  }

  private getDayPolish(dayIndex: number): string {
    const days = ['Ndz', 'Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob'];
    return days[dayIndex];
  }

  private getMonthPolish(monthIndex: number): string {
    const months = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 
                    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
    return months[monthIndex];
  }

  private getDayFrench(dayIndex: number): string {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[dayIndex];
  }

  private getMonthFrench(monthIndex: number): string {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[monthIndex];
  }

  private getDayRussian(dayIndex: number): string {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[dayIndex];
  }

  private getMonthRussian(monthIndex: number): string {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return months[monthIndex];
  }

  private getDayUkrainian(dayIndex: number): string {
    const days = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[dayIndex];
  }

  private getMonthUkrainian(monthIndex: number): string {
    const months = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 
                    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
    return months[monthIndex];
  }
}
