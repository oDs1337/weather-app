import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CyclingScore, CyclingScoreDetails, CurrentWeather, DailyWeather, HourlyWeather, AirQuality, CyclingIssue } from '../../../core/models/weather.model';

@Injectable({
  providedIn: 'root'
})
export class CyclingScoringService {
  private translate = inject(TranslateService);
  
  /**
   * Calculate overall cycling suitability score based on multiple weather factors
   */
  calculateCyclingScore(
    current: CurrentWeather,
    hourlyForecast: HourlyWeather[],
    dailyForecast: DailyWeather[],
    airQuality?: any
  ): { score: CyclingScore; issues: CyclingIssue[] } {
    
    const issues: CyclingIssue[] = [];
    
    // Calculate individual scores
    const temperatureScore = this.calculateTemperatureScore(current);
    const windScore = this.calculateWindScore(current, dailyForecast);
    const precipitationScore = this.calculatePrecipitationScore(current, hourlyForecast);
    const airQualityScore = this.calculateAirQualityScore(airQuality);
    const uvScore = this.calculateUVScore(current, dailyForecast);
    const humidityScore = this.calculateHumidityScore(current);
    
    // Calculate weighted overall score
    const overall = Math.round(
      temperatureScore * 0.25 +
      windScore * 0.20 +
      precipitationScore * 0.25 +
      airQualityScore * 0.15 +
      uvScore * 0.05 +
      humidityScore * 0.10
    );
    
    // Generate score details
    const details: CyclingScoreDetails = {
      temperatureComfort: this.getTemperatureLabel(temperatureScore),
      windCondition: this.getWindLabel(windScore),
      precipitationRisk: this.getPrecipitationLabel(precipitationScore),
      airQualityStatus: this.getAirQualityLabel(airQualityScore),
      uvRiskLevel: this.getUVLabel(uvScore),
      humidityComfort: this.getHumidityLabel(humidityScore)
    };
    
    // Generate issues/warnings
    const score = { overall, temperature: temperatureScore, wind: windScore, 
                   precipitation: precipitationScore, airQuality: airQualityScore,
                   uvIndex: uvScore, humidity: humidityScore, details };
    
    return { score, issues };
  }

  /**
   * Calculate additional forecast-based issues (storm warnings, rain in next hours)
   */
  calculateForecastIssues(hourlyForecast: HourlyWeather[], dailyForecast: DailyWeather[]): CyclingIssue[] {
    const issues: CyclingIssue[] = [];
    
    // Check for rain in the next few hours
    const nextFewHours = hourlyForecast.slice(0, 6); // Next 6 hours
    const rainInNextHours = nextFewHours.filter(h => h.precipitation_probability > 50);
    
    if (rainInNextHours.length > 0) {
      issues.push({
        type: 'warning',
        icon: '🌧️',
        title: this.translate.instant('alerts.rainExpected'),
        description: this.translate.instant('alerts.rainExpectedDescription', { count: rainInNextHours.length })
      });
    }
    
    // Check for thunderstorm risk (weather codes 71-77, 80-99 indicate precipitation/thunderstorm)
    const stormHours = hourlyForecast.slice(0, 12).filter(h => 
      h.weather_code >= 80 // Thunderstorm codes
    );
    
    if (stormHours.length > 0) {
      issues.push({
        type: 'danger',
        icon: '⛈️',
        title: this.translate.instant('alerts.thunderstormRisk'),
        description: this.translate.instant('alerts.thunderstormRiskDescription')
      });
    }
    
    // Check daily for heavy precipitation
    const heavyRainDays = dailyForecast.filter(d => d.precipitation_sum > 10);
    if (heavyRainDays.length > 0) {
      issues.push({
        type: 'warning',
        icon: '🌊',
        title: this.translate.instant('alerts.heavyRainExpected'),
        description: this.translate.instant('alerts.heavyRainDescription')
      });
    }
    
    // Check for extreme temperatures in the next days
    const hotDays = dailyForecast.filter(d => d.temperature_2m_max > 35);
    if (hotDays.length > 0) {
      issues.push({
        type: 'warning',
        icon: '🔥',
        title: this.translate.instant('alerts.extremeHeatWarning'),
        description: this.translate.instant('alerts.extremeHeatDescription')
      });
    }
    
    const coldDays = dailyForecast.filter(d => d.temperature_2m_min < 0);
    if (coldDays.length > 0) {
      issues.push({
        type: 'danger',
        icon: '❄️',
        title: this.translate.instant('alerts.freezingTemperatures'),
        description: this.translate.instant('alerts.freezingTemperaturesDescription')
      });
    }
    
    return issues;
  }

  // Individual score calculations
  
  private calculateTemperatureScore(current: CurrentWeather): number {
    const temp = current.temperature_2m;
    const apparentTemp = current.apparent_temperature;
    
    // Ideal cycling temperature: 15-25°C
    if (temp >= 15 && temp <= 25) return 100;
    // Good range: 10-30°C
    if (temp >= 10 && temp < 15) return 80;
    if (temp > 25 && temp <= 30) return 75;
    // Fair range: 0-40°C
    if (temp >= 0 && temp < 10) return 50;
    if (temp > 30 && temp <= 35) return 55;
    if (temp >= -5 && temp < 0) return 30;
    if (temp > 35 && temp <= 40) return 35;
    // Poor: below -5 or above 40
    return 10;
  }

  private calculateWindScore(current: CurrentWeather, dailyForecast: DailyWeather[]): number {
    const currentSpeed = current.windspeed_10m;
    
    // Get max wind from forecast
    const maxForecastWind = Math.max(...dailyForecast.map(d => d.windspeed_10m_max || 0));
    const effectiveWind = Math.max(currentSpeed, maxForecastWind);
    
    if (effectiveWind < 10) return 100; // Calm
    if (effectiveWind < 20) return 85;  // Light breeze
    if (effectiveWind < 30) return 65;  // Moderate - some headwind risk
    if (effectiveWind < 40) return 40;  // Strong winds
    return 15; // Very strong - dangerous for cycling
  }

  private calculatePrecipitationScore(current: CurrentWeather, hourlyForecast: HourlyWeather[]): number {
    const currentPrecip = current.precipitation;
    
    // Check next few hours for precipitation probability
    const nextHours = hourlyForecast.slice(0, 3);
    const avgProb = nextHours.reduce((sum, h) => sum + h.precipitation_probability, 0) / nextHours.length;
    
    if (currentPrecip > 0) return 20; // Currently raining
    if (avgProb < 10) return 100; // Very low chance
    if (avgProb < 30) return 80;  // Low chance
    if (avgProb < 50) return 50;  // Medium chance
    if (avgProb < 70) return 25;  // High chance
    return 10; // Very high chance
  }

  private calculateAirQualityScore(airQuality: any): number {
    if (!airQuality || airQuality.aqi === undefined) return 70; // Default if no data
    
    const aqi = airQuality.aqi;
    
    if (aqi <= 50) return 100; // Excellent
    if (aqi <= 100) return 80; // Good
    if (aqi <= 150) return 60; // Moderate - sensitive groups
    if (aqi <= 200) return 40; // Unhealthy for sensitive groups
    if (aqi <= 300) return 20; // Unhealthy
    return 5; // Hazardous
  }

  private calculateUVScore(current: CurrentWeather, dailyForecast: DailyWeather[]): number {
    const currentUV = current.uv_index || 0;
    const maxDailyUV = Math.max(...dailyForecast.map(d => d.uv_index_max || 0));
    const effectiveUV = Math.max(currentUV, maxDailyUV);
    
    if (effectiveUV < 3) return 100; // Low - no protection needed
    if (effectiveUV < 6) return 85;  // Moderate
    if (effectiveUV < 8) return 65;  // High - protection needed
    if (effectiveUV < 11) return 45; // Very high
    return 25; // Extreme
  }

  private calculateHumidityScore(current: CurrentWeather): number {
    const humidity = current.relative_humidity_2m;
    
    // Ideal cycling humidity: 30-60%
    if (humidity >= 30 && humidity <= 60) return 100;
    if (humidity < 30) return 70; // Dry but manageable
    if (humidity < 75) return 80; // Slightly humid
    if (humidity < 85) return 50; // Quite humid
    return 25; // Very humid - uncomfortable
  }

  // Helper methods for labels
  
  private getTemperatureLabel(score: number): string {
    const key = score >= 90 ? 'ideal' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor';
    return this.translate.instant(`scoreLabels.temperature.${key}`);
  }

  private getWindLabel(score: number): string {
    const key = score >= 90 ? 'calm' : score >= 70 ? 'lightBreeze' : score >= 50 ? 'moderate' : 'strongHeadwind';
    return this.translate.instant(`scoreLabels.wind.${key}`);
  }

  private getPrecipitationLabel(score: number): string {
    const key = score >= 90 ? 'none' : score >= 70 ? 'low' : score >= 50 ? 'medium' : 'high';
    return this.translate.instant(`scoreLabels.precipitation.${key}`);
  }

  private getAirQualityLabel(score: number): string {
    const key = score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'moderate' : 'unhealthy';
    return this.translate.instant(`scoreLabels.airQuality.${key}`);
  }

  private getUVLabel(score: number): string {
    const key = score >= 90 ? 'low' : score >= 70 ? 'moderate' : score >= 50 ? 'high' : 'veryHigh';
    return this.translate.instant(`scoreLabels.uvIndex.${key}`);
  }

  private getHumidityLabel(score: number): string {
    const key = score >= 90 ? 'comfortable' : score >= 70 ? 'ok' : score >= 50 ? 'humid' : 'veryHumid';
    return this.translate.instant(`scoreLabels.humidity.${key}`);
  }
}
