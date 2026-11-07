import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { WeatherCodePipe } from '../../../../shared/pipes/weather-code.pipe';
import { WeatherIconPipe } from '../../../../shared/pipes/weather-icon.pipe';
import { LocalizedDatePipe } from '../../../../shared/pipes/localized-date.pipe';
import { CurrentWeather } from '../../../../core/models/weather.model';

@Component({
  selector: 'app-current-weather-card',
  imports: [CommonModule, TranslatePipe, WeatherCodePipe, WeatherIconPipe, LocalizedDatePipe],
  templateUrl: './current-weather.html',
  styleUrl: './current-weather.scss',
})
export class CurrentWeatherCardComponent {
  current = input.required<CurrentWeather>();
}
