import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
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
  styles: [`
    .city-selector-container {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 0;

      .selector-card {
        background: white;
        border-radius: 0;
        box-shadow: none;
        max-width: 800px;
        width: 100%;
        min-height: 100vh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;

        .card-header {
          padding: calc(env(safe-area-inset-top, 16px) + 2rem) 2rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;

          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.5rem;

            h1 {
              margin: 0;
              font-size: 2rem;
              font-weight: 700;
              flex: 1;
            }
          }

          h1 {
            margin: 0 0 0.5rem 0;
            font-size: 2rem;
            font-weight: 700;
          }

          .subtitle {
            margin: 0;
            opacity: 0.9;
            font-size: 1rem;
          }
        }

        .card-content {
          padding: 2rem;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);

          .search-form {
            margin-bottom: 1.5rem;

            .input-group {
              display: flex;
              gap: 0.75rem;

              .city-input {
                flex: 1;
                padding: 1rem 1.25rem;
                font-size: 1rem;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                outline: none;
                transition: all 0.3s ease;

                &:focus {
                  border-color: #667eea;
                  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }

                &::placeholder {
                  color: #a0aec0;
                }
              }

              .search-btn {
                padding: 1rem 1.5rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;

                &:hover:not(:disabled) {
                  transform: translateY(-2px);
                  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
                }

                &:disabled {
                  opacity: 0.6;
                  cursor: not-allowed;
                }
              }
            }
          }

          .error-message {
            background: #fed7d7;
            color: #c53030;
            padding: 1rem;
            border-radius: 10px;
            margin-bottom: 1.5rem;
            font-weight: 500;
          }

          .results-list {
            max-height: 400px;
            overflow-y: auto;
            margin-bottom: 2rem;

            .city-item {
              width: 100%;
              padding: 1.25rem;
              background: #f7fafc;
              border: 2px solid transparent;
              border-radius: 12px;
              cursor: pointer;
              transition: all 0.3s ease;
              text-align: left;
              display: flex;
              justify-content: space-between;
              align-items: center;

              &:hover {
                background: #edf2f7;
                border-color: #667eea;
                transform: translateX(5px);
              }

              .city-name {
                font-size: 1.1rem;
                font-weight: 600;
                color: #2d3748;
              }

              .city-location {
                font-size: 0.9rem;
                color: #718096;
              }
            }
          }

          .popular-section {
            margin-bottom: 2rem;

            h3 {
              font-size: 1.25rem;
              color: #4a5568;
              margin: 0 0 1rem 0;
            }

            .popular-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
              gap: 0.75rem;

              .popular-city-btn {
                padding: 0.875rem;
                background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
                border: 2px solid #667eea;
                border-radius: 10px;
                color: #667eea;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;

                &:hover {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  transform: translateY(-2px);
                  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
                }
              }
            }
          }

          .features-info {
            background: #f0fff4;
            padding: 1.5rem;
            border-radius: 12px;
            border-left: 4px solid #48bb78;

            h3 {
              font-size: 1.1rem;
              color: #2d3748;
              margin: 0 0 1rem 0;
            }

            ul {
              list-style: none;
              padding: 0;
              margin: 0;

              li {
                padding: 0.5rem 0;
                color: #4a5568;
                font-size: 0.95rem;

                &:not(:last-child) {
                  border-bottom: 1px solid #e2e8f0;
                }
              }
            }
          }
        }

        .weather-section {
          padding: 1.5rem;
          animation: fadeInUp 0.5s ease-out;

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .back-btn {
            width: 100%;
            padding: 0.875rem 1rem;
            background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
            border: 2px solid #667eea;
            border-radius: 12px;
            color: #667eea;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 1.5rem;
            min-height: 48px;
            font-size: 0.9375rem;

            &:hover {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
          }

          .weather-content {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
          }
        }
      }
    }

    @media (max-width: 768px) {
      .city-selector-container {
        padding: 0;

        .selector-card {
          border-radius: 0;
          min-height: 100vh;

          .card-header {
            padding: calc(env(safe-area-inset-top, 16px) + 1.5rem) 1.25rem 1.25rem;

            .header-top {
              h1 {
                font-size: 1.5rem;
              }
            }

            h1 {
              font-size: 1.5rem;
            }

            .subtitle {
              font-size: 0.9rem;
            }
          }

          .card-content,
          .weather-section {
            padding: 1.25rem;
          }

          .popular-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;

            .popular-city-btn {
              padding: 1rem;
              font-size: 0.95rem;
              min-height: 48px; /* Touch target */
            }
          }

          .features-info {
            padding: 1.25rem;

            h3 {
              font-size: 1rem;
            }

            li {
              font-size: 0.9rem;
            }
          }
        }
      }
    }

    @media (max-width: 480px) {
      .city-selector-container {
        padding: 0;

        .selector-card {
          border-radius: 0;

          .card-header {
            h1 {
              font-size: 1.35rem;
            }

            .subtitle {
              font-size: 0.85rem;
            }
          }

          .card-content,
          .weather-section {
            padding: 1rem;
          }

          .input-group {
            flex-direction: column;

            .city-input {
              min-height: 48px;
              font-size: 16px; /* Prevent iOS zoom */
            }

            .search-btn {
              width: 100%;
              min-height: 48px;
              font-size: 1rem;
            }
          }

          .results-list {
            .city-item {
              padding: 1rem;
              min-height: 56px; /* Comfortable touch target */

              .city-name {
                font-size: 1rem;
              }

              .city-location {
                font-size: 0.85rem;
              }
            }
          }

          .popular-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.625rem;

            .popular-city-btn {
              padding: 0.875rem;
              font-size: 0.9rem;
              min-height: 48px;
            }
          }

          .features-info {
            padding: 1rem;

            h3 {
              font-size: 0.95rem;
            }

            li {
              font-size: 0.875rem;
              padding: 0.4rem 0;
            }
          }
        }
      }
    }
  `]
})
export class CitySelectorComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly weatherService = inject(WeatherService);
  private readonly cyclingScoringService = inject(CyclingScoringService);

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
