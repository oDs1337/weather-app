import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DailyWeather, WeatherResponse } from '../models/weather.model';

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
      forecast_days: '6',
    });

    return this.http.get<any>(`${this.baseUrl}?${params}`).pipe(
      map((response) => {
        const dailyRaw = response.daily;
        const daily: DailyWeather[] = dailyRaw.time.map((_: string, i: number) => ({
          time: dailyRaw.time[i],
          weather_code: dailyRaw.weather_code[i],
          temperature_2m_max: dailyRaw.temperature_2m_max[i],
          temperature_2m_min: dailyRaw.temperature_2m_min[i],
          sunrise: dailyRaw.sunrise[i],
          sunset: dailyRaw.sunset[i],
          precipitation_sum: dailyRaw.precipitation_sum[i],
          windspeed_10m_max: dailyRaw.windspeed_10m_max[i],
        }));

        return {
          ...response,
          daily,
        };
      }),
    );
  }
}
