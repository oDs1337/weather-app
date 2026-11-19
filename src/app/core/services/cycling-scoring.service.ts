import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  AirQuality,
  CurrentWeather,
  CyclingIssue,
  CyclingScore,
  CyclingScoreDetails,
  DailyWeather,
  HourlyWeather,
} from '../models/weather.model';

export interface CyclingAssessment {
  score: CyclingScore;
  issues: CyclingIssue[];
  dynamicAdvice: string;
}

@Injectable({
  providedIn: 'root',
})
export class CyclingScoringService {
  private readonly translate = inject(TranslateService);

  calculateCyclingScore(
    current: CurrentWeather,
    hourlyForecast: HourlyWeather[],
    dailyForecast: DailyWeather[],
    airQuality?: AirQuality | null
  ): CyclingAssessment {
    const next3Hours = hourlyForecast.slice(0, 3);

    const effectiveWind = Math.max(
      current.windspeed_10m,
      ...next3Hours.map((h) => h.windspeed_10m)
    );
    const effectiveUV = Math.max(
      current.uv_index ?? 0,
      ...next3Hours.map((h) => h.uv_index ?? 0)
    );
    const maxProb3h = next3Hours.reduce(
      (maxProb, h) => Math.max(maxProb, h.precipitation_probability),
      0
    );

    const temperature = this.scoreTemperature(current);
    const wind = this.scoreWind(effectiveWind);
    const precipitation = this.scorePrecipitation(current.precipitation, maxProb3h);
    const airQualityScore = this.scoreAirQuality(airQuality);
    const uvIndex = this.scoreUV(effectiveUV);
    const humidity = this.scoreHumidity(current.relative_humidity_2m);

    const baseScore = Math.round(
      precipitation * 0.30 +
      airQualityScore * 0.20 +
      wind * 0.20 +
      temperature * 0.20 +
      humidity * 0.05 +
      uvIndex * 0.05
    );

    const aqi = airQuality?.aqi;
    const hardCap = this.computeSafetyCap(
      current,
      effectiveWind,
      maxProb3h,
      aqi
    );
    const overall = Math.min(baseScore, hardCap);

    const details: CyclingScoreDetails = {
      temperatureComfort: this.labelFor('temperature', temperature, ['ideal', 'good', 'fair', 'poor']),
      windCondition: this.labelFor('wind', wind, ['calm', 'lightBreeze', 'moderate', 'strongHeadwind']),
      precipitationRisk: this.labelFor('precipitation', precipitation, ['none', 'low', 'medium', 'high']),
      airQualityStatus: this.labelFor('airQuality', airQualityScore, ['excellent', 'good', 'moderate', 'unhealthy']),
      uvRiskLevel: this.labelFor('uvIndex', uvIndex, ['low', 'moderate', 'high', 'veryHigh']),
      humidityComfort: this.labelFor('humidity', humidity, ['comfortable', 'ok', 'humid', 'veryHumid']),
    };

    const score: CyclingScore = {
      overall,
      temperature,
      wind,
      precipitation,
      airQuality: airQualityScore,
      uvIndex,
      humidity,
      details,
    };

    const apparentTemp = current.apparent_temperature ?? current.temperature_2m;
    const dynamicAdvice = this.buildAdvice(
      overall,
      current.temperature_2m,
      apparentTemp,
      effectiveWind,
      current.precipitation,
      maxProb3h,
      aqi
    );
    const issues = this.collectForecastIssues(
      current,
      hourlyForecast,
      dailyForecast,
      effectiveWind,
      aqi
    );

    return { score, issues, dynamicAdvice };
  }

  private computeSafetyCap(
    current: CurrentWeather,
    effectiveWind: number,
    maxProb3h: number,
    aqi: number | undefined
  ): number {
    let cap = 100;

    if (aqi !== undefined) {
      if (aqi > 200) cap = Math.min(cap, 20);
      else if (aqi > 150) cap = Math.min(cap, 40);
      else if (aqi > 100) cap = Math.min(cap, 64);
    }

    if (current.precipitation >= 1.0) cap = Math.min(cap, 25);
    else if (current.precipitation > 0.1) cap = Math.min(cap, 45);
    else if (maxProb3h >= 75) cap = Math.min(cap, 55);

    if (effectiveWind >= 40) cap = Math.min(cap, 30);
    else if (effectiveWind >= 30) cap = Math.min(cap, 58);

    const temp = current.temperature_2m;
    if (temp < 0 && (current.precipitation > 0 || maxProb3h >= 40 || current.relative_humidity_2m > 85)) {
      cap = Math.min(cap, 15);
    } else if (temp < -5 || temp > 36) {
      cap = Math.min(cap, 35);
    } else if (temp < 0) {
      cap = Math.min(cap, 48);
    }

    return cap;
  }

  private collectForecastIssues(
    current: CurrentWeather,
    hourlyForecast: HourlyWeather[],
    dailyForecast: DailyWeather[],
    effectiveWind: number,
    aqi: number | undefined
  ): CyclingIssue[] {
    const issues: CyclingIssue[] = [];

    const rainHours = hourlyForecast.slice(0, 6).filter((h) => h.precipitation_probability > 50);
    if (rainHours.length > 0) {
      issues.push({
        type: 'warning',
        icon: '🌧️',
        title: this.translate.instant('alerts.rainExpected'),
        description: this.translate.instant('alerts.rainExpectedDescription', { count: rainHours.length }),
      });
    }

    if (hourlyForecast.slice(0, 12).some((h) => h.weather_code >= 80)) {
      issues.push({
        type: 'danger',
        icon: '⛈️',
        title: this.translate.instant('alerts.thunderstormRisk'),
        description: this.translate.instant('alerts.thunderstormRiskDescription'),
      });
    }

    if (dailyForecast.some((d) => d.precipitation_sum > 10)) {
      issues.push({
        type: 'warning',
        icon: '🌊',
        title: this.translate.instant('alerts.heavyRainExpected'),
        description: this.translate.instant('alerts.heavyRainDescription'),
      });
    }

    if (dailyForecast.some((d) => d.temperature_2m_max > 35)) {
      issues.push({
        type: 'warning',
        icon: '🔥',
        title: this.translate.instant('alerts.extremeHeatWarning'),
        description: this.translate.instant('alerts.extremeHeatDescription'),
      });
    }

    if (dailyForecast.some((d) => d.temperature_2m_min < 0)) {
      issues.push({
        type: 'danger',
        icon: '❄️',
        title: this.translate.instant('alerts.freezingTemperatures'),
        description: this.translate.instant('alerts.freezingTemperaturesDescription'),
      });
    }

    if (aqi !== undefined && aqi > 100) {
      issues.push({
        type: 'warning',
        icon: '😷',
        title: this.translate.instant('alerts.airQualityWarning'),
        description: this.translate.instant('alerts.airQualityWarningDescription'),
      });
    }

    if (effectiveWind >= 30) {
      issues.push({
        type: 'warning',
        icon: '💨',
        title: this.translate.instant('alerts.strongWind'),
        description: this.translate.instant('alerts.strongWindDescription'),
      });
    }

    if (current.temperature_2m <= 1 && (current.relative_humidity_2m > 85 || current.precipitation > 0)) {
      issues.push({
        type: 'danger',
        icon: '🧊',
        title: this.translate.instant('alerts.iceRisk'),
        description: this.translate.instant('alerts.iceRiskDescription'),
      });
    }

    return issues;
  }

  private scoreTemperature(current: CurrentWeather): number {
    const temp = current.apparent_temperature ?? current.temperature_2m;

    if (temp >= 16 && temp <= 24) return 100;
    if (temp >= 12 && temp < 16) return 90;
    if (temp > 24 && temp <= 28) return 85;
    if (temp >= 8 && temp < 12) return 75;
    if (temp > 28 && temp <= 32) return 60;
    if (temp >= 4 && temp < 8) return 55;
    if (temp >= 0 && temp < 4) return 35;
    if (temp > 32 && temp <= 36) return 30;
    return 10;
  }

  private scoreWind(effectiveSpeed: number): number {
    if (effectiveSpeed < 10) return 100;
    if (effectiveSpeed < 25) return 85;
    if (effectiveSpeed < 36) return 70;
    if (effectiveSpeed < 50) return 40;
    return 15;
  }

  private scorePrecipitation(currentPrecip: number, maxProb3h: number): number {
    if (currentPrecip >= 1.0) return 5;
    if (currentPrecip > 0.1) return 20;
    if (currentPrecip > 0 || maxProb3h >= 75) return 15;
    if (maxProb3h >= 50) return 45;
    if (maxProb3h >= 30) return 70;
    if (maxProb3h >= 10) return 90;
    return 100;
  }

  private scoreAirQuality(airQuality?: AirQuality | null): number {
    if (!airQuality || airQuality.aqi === undefined) return 80;
    const { aqi } = airQuality;

    if (aqi <= 40) return 100;
    if (aqi <= 75) return 85;
    if (aqi <= 100) return 65;
    if (aqi <= 150) return 35;
    if (aqi <= 200) return 15;
    return 0;
  }

  private scoreUV(effectiveUV: number): number {
    if (effectiveUV < 3) return 100;
    if (effectiveUV < 6) return 85;
    if (effectiveUV < 8) return 65;
    if (effectiveUV < 11) return 45;
    return 25;
  }

  private scoreHumidity(humidity: number): number {
    if (humidity >= 35 && humidity <= 65) return 100;
    if (humidity < 35 || humidity <= 75) return 80;
    if (humidity <= 85) return 55;
    return 30;
  }

  private labelFor(
    category: string,
    score: number,
    tiers: readonly [string, string, string, string]
  ): string {
    const key = score >= 90 ? tiers[0] : score >= 70 ? tiers[1] : score >= 50 ? tiers[2] : tiers[3];
    return this.translate.instant(`scoreLabels.${category}.${key}`);
  }

  private buildAdvice(
    overall: number,
    realTemp: number,
    apparentTemp: number,
    effectiveWind: number,
    currentPrecip: number,
    maxProb3h: number,
    aqi: number | undefined
  ): string {
    if (realTemp < 0 && (currentPrecip > 0 || maxProb3h >= 40)) {
      return this.translate.instant('advice.icyRoad');
    }
    if (aqi !== undefined && aqi > 150) {
      return this.translate.instant('advice.toxicAir');
    }
    if (aqi !== undefined && aqi > 100) {
      return this.translate.instant('advice.moderateAir');
    }
    if (currentPrecip >= 1.0) {
      return this.translate.instant('advice.heavyRainNow');
    }
    if (maxProb3h >= 75) {
      return this.translate.instant('advice.highRainRisk');
    }
    if (apparentTemp > 35 || realTemp > 35) {
      return this.translate.instant('advice.extremeHeat');
    }
    if (effectiveWind >= 40) {
      return this.translate.instant('advice.extremeWind');
    }
    if (effectiveWind >= 30) {
      return this.translate.instant('advice.strongWindAdvice');
    }
    if (realTemp < 5 || apparentTemp < 5) {
      return this.translate.instant('advice.cold');
    }

    if (overall >= 90) {
      return this.translate.instant('advice.perfectConditions');
    }
    if (overall >= 70) {
      return this.translate.instant(
        apparentTemp > 28 ? 'advice.warmHydrate' : 'advice.greatWeather'
      );
    }

    return this.translate.instant('advice.mixedConditions');
  }
}
