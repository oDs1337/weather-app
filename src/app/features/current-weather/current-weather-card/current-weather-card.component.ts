import { Component, input } from '@angular/core';
import { WeatherCodePipe } from '../../../../shared/pipes/weather-code.pipe';
import { WeatherIconPipe } from '../../../../shared/pipes/weather-icon.pipe';
import { CurrentWeather } from '../../../../core/models/weather.model';

@Component({
  selector: 'app-current-weather-card',
  imports: [WeatherCodePipe, WeatherIconPipe],
  templateUrl: './current-weather.html',
  styleUrl: './current-weather.scss',
})
export class CurrentWeatherCardComponent {
  current = input.required<CurrentWeather>();
}
