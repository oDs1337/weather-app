export interface WeatherResponse {
  current: CurrentWeather;
  daily: DailyWeather[];
  hourly: HourlyWeather;
}

export interface CurrentWeather {
  temperature_2m: number;
  windspeed_10m: number;
  weather_code: number;
  time: string;
  is_day: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation: number;
}

export interface DailyWeather {
  time: string;
  weather_code: number;
  temperature_2m_max: number;
  temperature_2m_min: number;
  sunrise: string;
  sunset: string;
  precipitation_sum: number;
  windspeed_10m_max: number;
}

export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  precipitation_probability: number[];
}
