import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, of, switchMap, tap } from 'rxjs';
import { AirQuality, CyclingIssue, CyclingScore, WeatherResponse } from '../../core/models/weather.model';
import { CyclingScoringService } from '../../core/services/cycling-scoring.service';
import { WeatherService } from '../../core/services/weather.service';
import { ErrorComponent } from '../../shared/components/error/error.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { AirQualityComponent } from '../air-quality/air-quality.component';
import { CyclingAlertsComponent } from '../cycling-alerts/cycling-alerts.component';
import { CyclingScoreCardComponent } from '../cycling-score-card/cycling-score-card.component';
import { CurrentWeatherCardComponent } from './current-weather-card/current-weather-card.component';
import { DailyForecastComponent } from './daily-forecast/daily-forecast.component';
import { HourlyChartComponent } from './hourly-chart/hourly-chart.component';

const DEFAULT_CITY = { name: 'Katowice', lat: 50.2649, lon: 19.0238 };

@Component({
  selector: 'app-current-weather',
  imports: [
    LoadingComponent,
    ErrorComponent,
    CurrentWeatherCardComponent,
    DailyForecastComponent,
    HourlyChartComponent,
    CyclingScoreCardComponent,
    CyclingAlertsComponent,
    AirQualityComponent,
    TranslatePipe,
  ],
  templateUrl: './current-weather.html',
  styleUrl: './current-weather.scss',
})
export class CurrentWeatherComponent {
  private readonly weatherService = inject(WeatherService);
  private readonly cyclingScoringService = inject(CyclingScoringService);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly data = signal<WeatherResponse | null>(null);
  protected readonly airQuality = signal<AirQuality | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly cyclingScore = signal<CyclingScore | null>(null);
  protected readonly cyclingIssues = signal<CyclingIssue[]>([]);
  protected readonly dynamicAdvice = signal('');
  protected readonly selectedCityName = signal(DEFAULT_CITY.name);

  constructor() {
    this.route.queryParams
      .pipe(
        switchMap((params) => {
          const parsedLat = Number.parseFloat(params['lat']);
          const parsedLon = Number.parseFloat(params['lon']);
          const hasCoords = !Number.isNaN(parsedLat) && !Number.isNaN(parsedLon);

          const lat = hasCoords ? parsedLat : DEFAULT_CITY.lat;
          const lon = hasCoords ? parsedLon : DEFAULT_CITY.lon;
          const name = hasCoords ? params['name'] || 'Your City' : DEFAULT_CITY.name;

          this.selectedCityName.set(name);
          this.loading.set(true);
          this.error.set(null);

          return this.weatherService.getCyclingWeather(lat, lon).pipe(
            tap(({ weather, airQuality }) => {
              this.data.set(weather);
              this.airQuality.set(airQuality);

              const assessment = this.cyclingScoringService.calculateCyclingScore(
                weather.current,
                weather.hourly,
                weather.daily,
                airQuality
              );

              this.cyclingScore.set(assessment.score);
              this.cyclingIssues.set(assessment.issues);
              this.dynamicAdvice.set(assessment.dynamicAdvice);
              this.loading.set(false);
            }),
            catchError(() => {
              this.error.set(this.translate.instant('error.noWeather'));
              this.loading.set(false);
              return of(null);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
