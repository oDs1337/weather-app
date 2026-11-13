import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { WeatherCodePipe } from '../../../../shared/pipes/weather-code.pipe';
import { WeatherIconService } from '../../../../app/core/utils/weather-icon-svg.service';
import { CurrentWeather } from '../../../../core/models/weather.model';

@Component({
  selector: 'app-current-weather-card',
  imports: [CommonModule, TranslatePipe, WeatherCodePipe],
  templateUrl: './current-weather.html',
  styleUrl: './current-weather.scss',
})
export class CurrentWeatherCardComponent {
  private sanitizer = inject(DomSanitizer);
  private iconService = inject(WeatherIconService);

  current = input.required<CurrentWeather>();

  /** Build asset URL for weather icon using central resolve() with is_day flag. */
  iconSrc(): SafeUrl | null {
    const data = this.current();
    if (!data) return null;

    const resolution = this.iconService.resolve(data.weather_code, { isDay: !!data.is_day });

    let filename: string;
    if (resolution.group === 'overcast' && !resolution.filename.startsWith('weather-overcast')) {
      // Fallback group — ensure we have a valid file
      filename = 'assets/icons/velora/weather-overcast.svg';
    } else {
      filename = `assets/icons/velora/${resolution.filename}.svg`;
    }

    return this.sanitizer.bypassSecurityTrustUrl(filename);
  }

  /** SafeUrl for the feels-like temperature metric icon. */
  feelsLikeIconSrc(): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(
      this.iconService.iconSrc('metric-feels-like.svg')
    );
  }

  /** SafeUrl for the wind speed detail grid icon (velora asset). */
  windIconSrc(): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(
      this.iconService.iconSrc('weather-wind.svg')
    );
  }

  /** SafeUrl for the humidity metric icon. */
  humidityIconSrc(): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(
      this.iconService.iconSrc('metric-humidity.svg')
    );
  }

  /** SafeUrl for the precipitation detail grid icon (velora asset). */
  precipitationIconSrc(): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(
      this.iconService.iconSrc('metric-precipitation.svg')
    );
  }
}
