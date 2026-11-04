export interface WeatherResponse {
  current: CurrentWeather;
  daily: DailyWeather[];
  hourly: HourlyWeather;
}

export interface CurrentWeather {
  temperature: number;
  windspeed: number;
  weathercode: number;
  time: string;
  is_day: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation: number;
}

export interface DailyWeather {
  time: string;
  weathercode: number;
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
  weathercode: number[];
  precipitation_probability: number[];
}
