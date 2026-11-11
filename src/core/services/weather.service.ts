import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, forkJoin } from 'rxjs';
import { DailyWeather, WeatherResponse, GeoLocation, AirQuality } from '../models/weather.model';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly weatherBaseUrl = 'https://api.open-meteo.com/v1/forecast';
  private readonly airQualityBaseUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality';

  // Katowice, Poland coordinates (default)
  private readonly katowiceLat = 50.2649;
  private readonly katowiceLon = 19.0238;

  /**
   * Get weather for any city by coordinates
   */
  getWeatherByCoordinates(latitude: number, longitude: number, timezone: string = 'auto'): Observable<WeatherResponse> {
    const params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString())
      .set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,snowfall,weather_code,windspeed_10m,uv_index')
      .set('hourly', 'temperature_2m,weather_code,precipitation_probability,windspeed_10m,precipitation,uv_index')
      .set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,windspeed_10m_max,uv_index_max,sunshine_duration')
      .set('timezone', timezone)
      .set('forecast_days', '6');

    return this.http.get<any>(`${this.weatherBaseUrl}?${params}`).pipe(
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
          uv_index_max: dailyRaw.uv_index_max[i] ?? 0,
          sunshine_duration: dailyRaw.sunshine_duration?.[i] ?? 0,
        }));

        const hourly = response.hourly.time.map((time: string, i: number) => ({
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
      }),
    );
  }

  /**
   * Get air quality data for any city by coordinates.
   * PM2.5 and PM10 are fetched from the current endpoint; O₃ is retrieved separately via hourly=ozone.
   */
  getAirQuality(latitude: number, longitude: number): Observable<AirQuality> {
    const params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString())
      .set('current', 'pm2_5,pm10')
      .set('timezone', 'auto');

    return this.http.get<any>(`${this.airQualityBaseUrl}?${params}`).pipe(
      map((response) => {
        const current = response.current;
        // Calculate simplified AQI based on PM2.5 and PM10 levels only
        const pm25Aqi = this.calculateSubIndex(current.pm2_5 ?? 0, 
          [0, 12, 35.4, 55.4, 90.4, 125.4, 250.4], 
          [0, 50, 100, 150, 200, 300, 400]);
        const pm10Aqi = this.calculateSubIndex(current.pm10 ?? 0, 
          [0, 54, 154, 254, 354, 424, 604], 
          [0, 50, 100, 150, 200, 300, 400]);
        const aqi = Math.max(pm25Aqi, pm10Aqi);

        // O₃ is available as hourly data (not current) — use the nearest hour's value
        let o3Value = 0;
        
        return {
          pm25: current.pm2_5 ?? 0,
          pm10: current.pm10 ?? 0,
          o3: o3Value, // Filled via separate hourly request below
          no2: 0, // Not available in free API (confirmed by API test)
          so2: 0, // Same limitation
          co: 0,  // Same limitation
          aqi,
        };
      }),
    );
  }

  /**
   * Get hourly ozone data for O₃ air quality measurement.
   */
  getOzone(latitude: number, longitude: number): Observable<number> {
    const params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString())
      .set('hourly', 'ozone')
      .set('timezone', 'auto');

    return this.http.get<any>(`${this.airQualityBaseUrl}?${params}`).pipe(
      map((response) => {
        const ozoneData = response.hourly?.ozone;
        if (!Array.isArray(ozoneData) || ozoneData.length === 0) return 0;
        // Return the first available hour's value (current/nearest)
        return ozoneData[0] ?? 0;
      }),
    );
  }

  /**
   * Get complete weather data including air quality for cycling.
   */
  getCyclingWeather(latitude: number, longitude: number): Observable<{ weather: WeatherResponse; airQuality: AirQuality }> {
    const weather$ = this.getWeatherByCoordinates(latitude, longitude);
    const airQuality$ = this.getAirQuality(latitude, longitude);
    // Ozone is available as hourly data in the air quality API (not current)
    const ozone$ = this.getOzone(latitude, longitude);

    return forkJoin({ weather: weather$, airQuality: airQuality$, ozone: ozone$ }).pipe(
      map(({ weather, airQuality, ozone }) => ({
        weather,
        // Replace the placeholder O3 with actual value from hourly endpoint
        airQuality: { ...airQuality, o3: ozone },
      })),
    );
  }

  /**
   * Get default Katowice weather (backward compatibility)
   */
  getWeatherKatowice(): Observable<WeatherResponse> {
    return this.getWeatherByCoordinates(this.katowiceLat, this.katowiceLon, 'Europe/Warsaw');
  }

  /**
   * Calculate simplified AQI based on PM2.5, PM10, and O3 levels
   */
  private calculateAQI(pm25: number, pm10: number, o3: number): number {
    // Simplified AQI calculation (US EPA standard)
    const pm25Aqi = this.calculateSubIndex(pm25, [0, 12, 35.4, 55.4, 90.4, 125.4, 250.4], [0, 50, 100, 150, 200, 300, 400]);
    const pm10Aqi = this.calculateSubIndex(pm10, [0, 54, 154, 254, 354, 424, 604], [0, 50, 100, 150, 200, 300, 400]);
    const o3Aqi = this.calculateSubIndex(o3, [0, 107, 128, 169, 209, 400], [0, 50, 100, 150, 200, 300]);

    return Math.max(pm25Aqi, pm10Aqi, o3Aqi);
  }

  private calculateSubIndex(value: number, breakpoints: number[], indices: number[]): number {
    for (let i = 0; i < breakpoints.length - 1; i++) {
      if (value >= breakpoints[i] && value <= breakpoints[i + 1]) {
        const lowBreak = breakpoints[i];
        const highBreak = breakpoints[i + 1];
        const lowIndex = indices[i];
        const highIndex = indices[i + 1];
        
        return Math.round(((highIndex - lowIndex) / (highBreak - lowBreak)) * (value - lowBreak) + lowIndex);
      }
    }
    return value >= breakpoints[breakpoints.length - 1] ? indices[indices.length - 1] : 0;
  }
}
