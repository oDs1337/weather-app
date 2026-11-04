import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WeatherResponse } from '../models/weather.model';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://api.open-meteo.com/v1/forecast';

  // Katowice, Poland coordinates
  private readonly katowiceLat = 50.2649;
  private readonly katowiceLon = 19.0238;

  getWeatherKatowice(): Observable<WeatherResponse> {
    const params = new URLSearchParams({
      latitude: this.katowiceLat.toString(),
      longitude: this.katowiceLon.toString(),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,windspeed_10m',
      hourly: 'temperature_2m,weather_code,precipitation_probability',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,windspeed_10m_max',
      timezone: 'Europe/Warsaw',
      forecast_days: '1',
    });

    return this.http.get<WeatherResponse>(`${this.baseUrl}?${params}`);
  }
}
