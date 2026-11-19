import { Component, computed, inject, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CurrentWeather } from '../../../core/models/weather.model';
import { WeatherIconService } from '../../../core/utils/weather-icon-svg.service';
import { WeatherCodePipe } from '../../../shared/pipes/weather-code.pipe';

@Component({
  selector: 'app-current-weather-card',
  imports: [TranslatePipe, WeatherCodePipe],
  templateUrl: './current-weather.html',
  styleUrl: './current-weather.scss',
})
export class CurrentWeatherCardComponent {
  private readonly iconService = inject(WeatherIconService);

  readonly current = input.required<CurrentWeather>();

  protected readonly iconSrc = computed(() => {
    const data = this.current();
    return this.iconService.getWeatherIconPath(data.weather_code, { isDay: !!data.is_day });
  });

  protected readonly feelsLikeIconSrc = this.iconService.iconSrc('metric-feels-like.svg');
  protected readonly windIconSrc = this.iconService.iconSrc('weather-wind.svg');
  protected readonly humidityIconSrc = this.iconService.iconSrc('metric-humidity.svg');
  protected readonly precipitationIconSrc = this.iconService.iconSrc('metric-precipitation.svg');
}
