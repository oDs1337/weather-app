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

  data = signal<WeatherResponse | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

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
        this.data.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load weather data. Please try again later.');
        this.loading.set(false);
        console.error('Weather API Error:', err);
      },
    });
  }
}
