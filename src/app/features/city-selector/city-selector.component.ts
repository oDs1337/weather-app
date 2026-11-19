import { UpperCasePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, catchError, debounceTime, distinctUntilChanged, merge, of, switchMap, tap } from 'rxjs';
import { LanguageSelectorComponent } from '../../core/components/language-selector/language-selector.component';
import { GeoLocation } from '../../core/models/weather.model';
import { LanguageService } from '../../core/services/language.service';
import { WeatherService } from '../../core/services/weather.service';

interface PopularCity {
  name: string;
  lat: number;
  lon: number;
}

const POPULAR_CITIES: readonly PopularCity[] = [
  { name: 'Warsaw', lat: 52.23, lon: 21.01 },
  { name: 'Krakow', lat: 50.06, lon: 19.94 },
  { name: 'Gdansk', lat: 54.35, lon: 18.65 },
  { name: 'Wroclaw', lat: 51.1, lon: 17.03 },
  { name: 'Berlin', lat: 52.52, lon: 13.41 },
  { name: 'London', lat: 51.51, lon: -0.13 },
  { name: 'Paris', lat: 48.86, lon: 2.34 },
  { name: 'Amsterdam', lat: 52.37, lon: 4.9 },
];

@Component({
  selector: 'app-city-selector',
  imports: [UpperCasePipe, ReactiveFormsModule, TranslatePipe, LanguageSelectorComponent],
  templateUrl: './city-selector.html',
  styleUrl: './city-selector.component.scss',
})
export class CitySelectorComponent {
  private readonly weatherService = inject(WeatherService);
  private readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly manualSubmit$ = new Subject<string>();

  protected readonly showLanguageSelector = this.languageService.showLanguageSelector();
  protected readonly popularCities = POPULAR_CITIES;
  protected readonly searchControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  protected readonly cities = signal<GeoLocation[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly hasSearched = signal(false);

  constructor() {
    const typing$ = this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    );

    merge(typing$, this.manualSubmit$)
      .pipe(
        switchMap((rawQuery) => {
          const query = rawQuery.trim();
          if (query.length < 2) {
            this.cities.set([]);
            this.error.set(null);
            this.loading.set(false);
            return of(null);
          }

          this.loading.set(true);
          this.error.set(null);

          return this.weatherService.searchCities(query).pipe(
            tap((locations) => {
              this.cities.set(locations);
              this.hasSearched.set(true);
              this.error.set(
                locations.length === 0 ? this.translate.instant('error.noCityFound') : null
              );
              this.loading.set(false);
            }),
            catchError(() => {
              this.cities.set([]);
              this.hasSearched.set(true);
              this.error.set(this.translate.instant('error.default'));
              this.loading.set(false);
              return of(null);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  protected onSubmit(): void {
    this.manualSubmit$.next(this.searchControl.value);
  }

  protected selectCity(city: GeoLocation): void {
    this.navigateToWeather(city.latitude, city.longitude, city.name);
  }

  protected selectPopularCity(city: PopularCity): void {
    this.navigateToWeather(city.lat, city.lon, city.name);
  }

  private navigateToWeather(lat: number, lon: number, name: string): void {
    this.router.navigate(['/weather'], {
      queryParams: { lat, lon, name },
    });
  }
}
