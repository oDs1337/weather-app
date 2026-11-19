export interface WeatherResponse {
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  airQuality?: AirQuality;
}

export interface CurrentWeather {
  time: string;
  temperature_2m: number;
  windspeed_10m: number;
  weather_code: number;
  is_day: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation: number;
  rain: number;
  snowfall: number;
  uv_index: number;
  sunshine_duration: number;
}

export interface HourlyWeather {
  time: string;
  temperature_2m: number;
  weather_code: number;
  precipitation_probability: number;
  windspeed_10m: number;
  precipitation: number;
  uv_index: number;
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
  uv_index_max: number;
  sunshine_duration: number;
}

export interface AirQuality {
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  aqi: number;
}

export interface CyclingScore {
  overall: number;
  temperature: number;
  wind: number;
  precipitation: number;
  airQuality: number;
  uvIndex: number;
  humidity: number;
  details: CyclingScoreDetails;
}

export interface CyclingScoreDetails {
  temperatureComfort: string;
  windCondition: string;
  precipitationRisk: string;
  airQualityStatus: string;
  uvRiskLevel: string;
  humidityComfort: string;
}

export interface CyclingIssue {
  type: 'warning' | 'danger' | 'info';
  icon: string;
  title: string;
  description: string;
}

export interface GeoLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}
