import { Component, OnInit, inject, signal } from '@angular/core';
import { WeatherService } from '../../../core/services/weather.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorComponent } from '../../../shared/components/error/error.component';
import { CurrentWeatherCardComponent } from './current-weather-card/current-weather-card.component';
import { DailyForecastComponent } from './daily-forecast/daily-forecast.component';
import { HourlyChartComponent } from './hourly-chart/hourly-chart.component';
import { WeatherResponse } from '../../../core/models/weather.model';

@Component({
  selector: 'app-current-weather',
  imports: [LoadingComponent, ErrorComponent, CurrentWeatherCardComponent, DailyForecastComponent, HourlyChartComponent],
  templateUrl: './current-weather.html',
  styleUrl: './current-weather.scss',
})
export class CurrentWeatherComponent implements OnInit {
  private readonly weatherService = inject(WeatherService);

  data: WeatherResponse | null = null;
  loading = true;
  error: string | null = null;

  protected readonly todayDate = signal<string>(new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));

  ngOnInit(): void {
    this.fetchWeather();
  }

  private fetchWeather(): void {
    this.weatherService.getWeatherKatowice().subscribe({
      next: (response) => {
        this.data = response;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load weather data. Please try again later.';
        this.loading = false;
        console.error('Weather API Error:', err);
      },
    });
  }
}
