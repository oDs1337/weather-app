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
  uv_index: number; // Current UV index for cyclists
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
  windspeed_10m_meadian?: number; // Median wind speed for better planning
  uv_index_max: number; // Max UV index during the day
  sunshine_duration: number; // Total sunshine duration in seconds
}

export interface AirQuality {
  pm25: number;      // Fine particulate matter (μg/m³)
  pm10: number;      // Coarse particulate matter (μg/m³)
  o3: number;        // Ozone (μg/m³)
  no2: number;       // Nitrogen dioxide (μg/m³)
  so2: number;       // Sulfur dioxide (μg/m³)
  co: number;        // Carbon monoxide (μg/m³)
  aqi: number;       // Calculated Air Quality Index (0-500 scale, lower is better)
}

// Cycling scoring system
export interface CyclingScore {
  overall: number;           // Overall score 0-100
  temperature: number;       // Temperature comfort 0-100
  wind: number;              // Wind conditions 0-100
  precipitation: number;     // Precipitation risk 0-100
  airQuality: number;        // Air quality for exercise 0-100
  uvIndex: number;           // UV safety 0-100
  humidity: number;          // Humidity comfort 0-100
  details: CyclingScoreDetails;
}

export interface CyclingScoreDetails {
  temperatureComfort: string;    // "Ideal", "Good", "Fair", "Poor"
  windCondition: string;         // "Calm", "Light breeze", "Moderate", "Strong headwind risk"
  precipitationRisk: string;     // "None", "Low", "Medium", "High"
  airQualityStatus: string;      // "Excellent", "Good", "Moderate", "Unhealthy"
  uvRiskLevel: string;           // "Low", "Moderate", "High", "Very high"
  humidityComfort: string;       // "Comfortable", "OK", "Humid", "Very humid"
}

// Cycling issues and warnings
export interface CyclingIssue {
  type: 'warning' | 'danger' | 'info';
  icon: string;
  title: string;
  description: string;
}

// City data for search
export interface GeoLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}
