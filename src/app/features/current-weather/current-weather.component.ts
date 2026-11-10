import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WeatherService } from '../../../core/services/weather.service';
import { CyclingScoringService } from '../../core/services/cycling-scoring.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorComponent } from '../../../shared/components/error/error.component';
import { CurrentWeatherCardComponent } from './current-weather-card/current-weather-card.component';
import { DailyForecastComponent } from './daily-forecast/daily-forecast.component';
import { HourlyChartComponent } from './hourly-chart/hourly-chart.component';
import { CyclingScoreCardComponent } from '../cycling-score-card/cycling-score-card.component';
import { CyclingAlertsComponent } from '../cycling-alerts/cycling-alerts.component';
import { AirQualityComponent } from '../air-quality/air-quality.component';
import { TranslatePipe } from '@ngx-translate/core';
import { WeatherResponse, CyclingScore, CyclingIssue } from '../../../core/models/weather.model';

@Component({
  selector: 'app-current-weather',
  standalone: true,
  imports: [
    LoadingComponent, 
    ErrorComponent, 
    CurrentWeatherCardComponent, 
    DailyForecastComponent, 
    HourlyChartComponent,
    CyclingScoreCardComponent,
    CyclingAlertsComponent,
    AirQualityComponent,
    TranslatePipe
  ],
  templateUrl: './current-weather.html',
  styleUrl: './current-weather.scss',
})
export class CurrentWeatherComponent implements OnInit {
  private readonly weatherService = inject(WeatherService);
  private readonly cyclingScoringService = inject(CyclingScoringService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  data = signal<WeatherResponse | null>(null);
  airQuality = signal<any>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  
  // Cycling-specific signals
  cyclingScore = signal<CyclingScore | null>(null);
  cyclingIssues = signal<CyclingIssue[]>([]);
  dynamicAdvice = signal<string>('');
  selectedCityName = signal<string>('Your City');

  protected readonly todayDate = computed(() => 
    new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  );

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const lat = parseFloat(params['lat']);
      const lon = parseFloat(params['lon']);
      const name = params['name'] || 'Your City';
      
      if (!isNaN(lat) && !isNaN(lon)) {
        this.selectedCityName.set(name);
        this.fetchCyclingWeather(lat, lon);
      } else {
        // Default to Katowice if no city selected
        this.selectedCityName.set('Katowice');
        this.fetchCyclingWeather(50.2649, 19.0238);
      }
    });
  }

  private fetchCyclingWeather(lat: number, lon: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.weatherService.getCyclingWeather(lat, lon).subscribe({
      next: (response) => {
        this.data.set(response.weather);
        this.airQuality.set(response.airQuality);

        // Calculate cycling score (now also returns dynamicAdvice)
        const { score, issues, dynamicAdvice } = this.cyclingScoringService.calculateCyclingScore(
          response.weather.current,
          response.weather.hourly,
          response.weather.daily,
          response.airQuality
        );

        // Get additional forecast-based issues
        const forecastIssues = this.cyclingScoringService.calculateForecastIssues(
          response.weather.hourly,
          response.weather.daily
        );

        // Merge all issues and dynamic advice
        this.cyclingIssues.set([...issues, ...forecastIssues]);
        this.cyclingScore.set(score);
        this.dynamicAdvice.set(dynamicAdvice);

        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load weather data. Please try again later.');
        this.loading.set(false);
        console.error('Weather API Error:', err);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
