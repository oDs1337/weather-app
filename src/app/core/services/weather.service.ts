import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import {
  AirQuality,
  DailyWeather,
  GeoLocation,
  HourlyWeather,
  WeatherResponse,
} from '../models/weather.model';

interface OpenMeteoForecastResponse {
  current: {
    time: string;
    temperature_2m: number;
    windspeed_10m: number;
    weather_code: number;
    is_day: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    rain?: number;
    snowfall?: number;
    uv_index?: number;
    sunshine_duration?: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: (number | null)[];
    windspeed_10m: (number | null)[];
    precipitation: (number | null)[];
    uv_index?: (number | null)[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_sum: number[];
    windspeed_10m_max: number[];
    uv_index_max: (number | null)[];
    sunshine_duration?: (number | null)[];
  };
}

interface OpenMeteoAirQualityResponse {
  current?: {
    time?: string;
    pm2_5?: number | null;
    pm10?: number | null;
  };
  hourly?: {
    time?: string[];
    ozone?: (number | null)[];
  };
}

interface OpenMeteoGeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }>;
}

const PM25_BREAKPOINTS = [0, 12, 35.4, 55.4, 90.4, 125.4, 250.4];
const PM10_BREAKPOINTS = [0, 54, 154, 254, 354, 424, 604];
const AQI_INDICES = [0, 50, 100, 150, 200, 300, 400];

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly weatherBaseUrl = 'https://api.open-meteo.com/v1/forecast';
  private readonly airQualityBaseUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality';
  private readonly geocodingBaseUrl = 'https://geocoding-api.open-meteo.com/v1/search';

  searchCities(query: string): Observable<GeoLocation[]> {
    const params = new HttpParams()
      .set('name', query)
      .set('count', '10')
      .set('language', 'en')
      .set('format', 'json');

    return this.http.get<OpenMeteoGeocodingResponse>(this.geocodingBaseUrl, { params }).pipe(
      map((response) =>
        (response.results ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          latitude: r.latitude,
          longitude: r.longitude,
          country: r.country ?? '',
          admin1: r.admin1 ?? '',
        }))
      )
    );
  }

  getWeatherByCoordinates(
    latitude: number,
    longitude: number,
    timezone = 'auto'
  ): Observable<WeatherResponse> {
    const params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString())
      .set(
        'current',
        'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,snowfall,weather_code,windspeed_10m,uv_index'
      )
      .set(
        'hourly',
        'temperature_2m,weather_code,precipitation_probability,windspeed_10m,precipitation,uv_index'
      )
      .set(
        'daily',
        'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,windspeed_10m_max,uv_index_max,sunshine_duration'
      )
      .set('timezone', timezone)
      .set('forecast_days', '6');

    return this.http.get<OpenMeteoForecastResponse>(this.weatherBaseUrl, { params }).pipe(
      map((response) => {
        const daily: DailyWeather[] = response.daily.time.map((time, i) => ({
          time,
          weather_code: response.daily.weather_code[i],
          temperature_2m_max: response.daily.temperature_2m_max[i],
          temperature_2m_min: response.daily.temperature_2m_min[i],
          sunrise: response.daily.sunrise[i],
          sunset: response.daily.sunset[i],
          precipitation_sum: response.daily.precipitation_sum[i],
          windspeed_10m_max: response.daily.windspeed_10m_max[i],
          uv_index_max: response.daily.uv_index_max[i] ?? 0,
          sunshine_duration: response.daily.sunshine_duration?.[i] ?? 0,
        }));

        const hourly: HourlyWeather[] = response.hourly.time.map((time, i) => ({
          time,
          temperature_2m: response.hourly.temperature_2m[i],
          weather_code: response.hourly.weather_code[i],
          precipitation_probability: response.hourly.precipitation_probability[i] ?? 0,
          windspeed_10m: response.hourly.windspeed_10m[i] ?? 0,
          precipitation: response.hourly.precipitation[i] ?? 0,
          uv_index: response.hourly.uv_index?.[i] ?? 0,
        }));

        return {
          current: {
            time: response.current.time,
            temperature_2m: response.current.temperature_2m,
            windspeed_10m: response.current.windspeed_10m,
            weather_code: response.current.weather_code,
            is_day: response.current.is_day,
            relative_humidity_2m: response.current.relative_humidity_2m,
            apparent_temperature: response.current.apparent_temperature,
            precipitation: response.current.precipitation,
            rain: response.current.rain ?? 0,
            snowfall: response.current.snowfall ?? 0,
            uv_index: response.current.uv_index ?? 0,
            sunshine_duration: response.current.sunshine_duration ?? 0,
          },
          hourly,
          daily,
        };
      })
    );
  }

  getAirQuality(latitude: number, longitude: number): Observable<AirQuality> {
    const params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString())
      .set('current', 'pm2_5,pm10')
      .set('hourly', 'ozone')
      .set('timezone', 'auto');

    return this.http.get<OpenMeteoAirQualityResponse>(this.airQualityBaseUrl, { params }).pipe(
      map((response) => {
        const pm25 = response.current?.pm2_5 ?? 0;
        const pm10 = response.current?.pm10 ?? 0;
        const o3 = this.extractCurrentOzone(response);

        const pm25Aqi = this.calculateSubIndex(pm25, PM25_BREAKPOINTS, AQI_INDICES);
        const pm10Aqi = this.calculateSubIndex(pm10, PM10_BREAKPOINTS, AQI_INDICES);

        return {
          pm25,
          pm10,
          o3,
          no2: 0,
          so2: 0,
          co: 0,
          aqi: Math.max(pm25Aqi, pm10Aqi),
        };
      })
    );
  }

  getCyclingWeather(
    latitude: number,
    longitude: number
  ): Observable<{ weather: WeatherResponse; airQuality: AirQuality }> {
    return forkJoin({
      weather: this.getWeatherByCoordinates(latitude, longitude),
      airQuality: this.getAirQuality(latitude, longitude),
    });
  }

  private extractCurrentOzone(response: OpenMeteoAirQualityResponse): number {
    const times = response.hourly?.time;
    const values = response.hourly?.ozone;
    if (!Array.isArray(values) || values.length === 0) return 0;

    const currentHourPrefix = response.current?.time?.slice(0, 13);
    if (currentHourPrefix && Array.isArray(times)) {
      const idx = times.findIndex((t) => t.startsWith(currentHourPrefix));
      if (idx >= 0 && values[idx] != null) {
        return values[idx];
      }
    }

    return values[0] ?? 0;
  }

  private calculateSubIndex(value: number, breakpoints: number[], indices: number[]): number {
    for (let i = 0; i < breakpoints.length - 1; i++) {
      if (value >= breakpoints[i] && value <= breakpoints[i + 1]) {
        const lowBreak = breakpoints[i];
        const highBreak = breakpoints[i + 1];
        const lowIndex = indices[i];
        const highIndex = indices[i + 1];
        return Math.round(
          ((highIndex - lowIndex) / (highBreak - lowBreak)) * (value - lowBreak) + lowIndex
        );
      }
    }
    return value >= breakpoints[breakpoints.length - 1] ? indices[indices.length - 1] : 0;
  }
}
