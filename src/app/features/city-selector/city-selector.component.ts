import { Component, inject, signal, computed } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Capacitor } from '@capacitor/core';
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe, LanguageSelectorComponent],
  templateUrl: './city-selector.html',
  styleUrls: ['./city-selector.component.scss']
})
export class CitySelectorComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Show language selector only on web (not on iOS/Android where users use system Settings)
  showLanguageSelector = computed(() => {
    return !Capacitor.isNativePlatform();
  });

  searchControl = new FormControl('', [Validators.required]);
  cities = signal<GeoLocation[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  hasSearched = signal(false);

  constructor() {
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
    this.router.navigate(['/weather'], {
      queryParams: {
        lat: city.latitude,
        lon: city.longitude,
        name: city.name
      }
    });
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
      this.router.navigate(['/weather'], {
        queryParams: {
          lat: city.lat,
          lon: city.lon,
          name: cityName
        }
      });
    }
  }


}
