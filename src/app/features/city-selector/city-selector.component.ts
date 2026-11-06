import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Capacitor } from '@capacitor/core';
import { WeatherService } from '../../../core/services/weather.service';
import { CyclingScoringService } from '../../core/services/cycling-scoring.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorComponent } from '../../../shared/components/error/error.component';
import { CurrentWeatherCardComponent } from '../current-weather/current-weather-card/current-weather-card.component';
import { DailyForecastComponent } from '../current-weather/daily-forecast/daily-forecast.component';
import { HourlyChartComponent } from '../current-weather/hourly-chart/hourly-chart.component';
import { CyclingScoreCardComponent } from '../cycling-score-card/cycling-score-card.component';
import { CyclingAlertsComponent } from '../cycling-alerts/cycling-alerts.component';
import { WeatherResponse, CyclingScore, CyclingIssue } from '../../../core/models/weather.model';
import { LanguageSelectorComponent } from '../../core/components/language-selector/language-selector.component';

interface GeoLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

@Component({
  selector: 'app-city-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe, LanguageSelectorComponent, LoadingComponent, ErrorComponent, CurrentWeatherCardComponent, DailyForecastComponent, HourlyChartComponent, CyclingScoreCardComponent, CyclingAlertsComponent],
  templateUrl: './city-selector.html',
  styleUrls: ['./city-selector.component.scss']
})
export class CitySelectorComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly weatherService = inject(WeatherService);
  private readonly cyclingScoringService = inject(CyclingScoringService);

  // Show language selector only on web (not on iOS/Android where users use system Settings)
  showLanguageSelector = computed(() => {
    return !Capacitor.isNativePlatform();
  });

  searchControl = new FormControl('', [Validators.required]);
  cities = signal<GeoLocation[]>([]);
  selectedCity = signal<GeoLocation | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  hasSearched = signal(false);

  // Weather data signals for inline display
  weatherData = signal<WeatherResponse | null>(null);
  airQuality = signal<any>(null);
  cyclingScore = signal<CyclingScore | null>(null);
  cyclingIssues = signal<CyclingIssue[]>([]);
  selectedCityName = signal<string>('Your City');

  protected readonly todayDate = computed(() => 
    new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  );

  ngOnInit() {
    this.searchControl.valueChanges.subscribe(() => {
      this.debouncedSearch();
    });
  }

  private searchTimeout: any;
  private debouncedSearch() {
    clearTimeout(this.searchTimeout);
    const query = this.searchControl.value?.trim();
    
    if (!query || query.length < 2) {
      this.cities.set([]);
      this.hasSearched.set(false);
      return;
    }

    this.searchTimeout = setTimeout(() => {
      this.performSearch(query);
    }, 300);
  }

  private async performSearch(query: string) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const response = await this.http.get<any>(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
      ).toPromise();

      if (response?.results) {
        const locations: GeoLocation[] = response.results.map((r: any) => ({
          id: r.id,
          name: r.name,
          latitude: r.latitude,
          longitude: r.longitude,
          country: r.country || '',
          admin1: r.admin1 || ''
        }));
        this.cities.set(locations);
        this.hasSearched.set(true);
      } else {
        this.cities.set([]);
        this.hasSearched.set(true);
        this.error.set('No cities found. Try a different search term.');
      }
    } catch (err) {
      this.error.set('Failed to search cities. Please try again.');
      console.error('Geo coding error:', err);
    } finally {
      this.loading.set(false);
    }
  }

  selectCity(city: GeoLocation) {
    this.selectedCity.set(city);
    this.fetchWeatherData(city.latitude, city.longitude, city.name);
  }

  popularCitiesList = signal<string[]>([
    'Warsaw', 'Krakow', 'Gdansk', 'Wroclaw', 
    'Berlin', 'London', 'Paris', 'Amsterdam'
  ]);

  selectPopularCity(cityName: string) {
    const cityMap: Record<string, { lat: number; lon: number }> = {
      'Warsaw': { lat: 52.23, lon: 21.01 },
      'Krakow': { lat: 50.06, lon: 19.94 },
      'Gdansk': { lat: 54.35, lon: 18.65 },
      'Wroclaw': { lat: 51.1, lon: 17.03 },
      'Berlin': { lat: 52.52, lon: 13.41 },
      'London': { lat: 51.51, lon: -0.13 },
      'Paris': { lat: 48.86, lon: 2.34 },
      'Amsterdam': { lat: 52.37, lon: 4.90 }
    };

    const city = cityMap[cityName];
    if (city) {
      this.fetchWeatherData(city.lat, city.lon, cityName);
    }
  }

  popularCities() {
    const cities = [
      { name: 'Warsaw', lat: 52.23, lon: 21.01 },
      { name: 'Krakow', lat: 50.06, lon: 19.94 },
      { name: 'Gdansk', lat: 54.35, lon: 18.65 },
      { name: 'Wroclaw', lat: 51.1, lon: 17.03 },
      { name: 'Poznan', lat: 52.41, lon: 16.93 },
      { name: 'Berlin', lat: 52.52, lon: 13.41 },
      { name: 'London', lat: 51.51, lon: -0.13 },
      { name: 'Paris', lat: 48.86, lon: 2.34 },
    ];
    
    const city = cities[Math.floor(Math.random() * cities.length)];
    this.fetchWeatherData(city.lat, city.lon, city.name);
  }

  private fetchWeatherData(lat: number, lon: number, cityName: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedCityName.set(cityName);
    
    this.weatherService.getCyclingWeather(lat, lon).subscribe({
      next: (response) => {
        this.weatherData.set(response.weather);
        this.airQuality.set(response.airQuality);
        
        const { score, issues } = this.cyclingScoringService.calculateCyclingScore(
          response.weather.current,
          response.weather.hourly,
          response.weather.daily,
          response.airQuality
        );
        
        const forecastIssues = this.cyclingScoringService.calculateForecastIssues(
          response.weather.hourly,
          response.weather.daily
        );
        
        this.cyclingIssues.set([...issues, ...forecastIssues]);
        this.cyclingScore.set(score);
        
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load weather data. Please try again later.');
        this.loading.set(false);
        console.error('Weather API Error:', err);
      }
    });
  }

  goBack() {
    this.weatherData.set(null);
    this.airQuality.set(null);
    this.cyclingScore.set(null);
    this.cyclingIssues.set([]);
    this.selectedCity.set(null);
    this.searchControl.reset();
    this.cities.set([]);
    this.hasSearched.set(false);
  }
}
