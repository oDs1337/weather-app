import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CyclingScore, CyclingScoreDetails, CurrentWeather, DailyWeather, HourlyWeather, AirQuality, CyclingIssue } from '../../../core/models/weather.model';

@Injectable({
  providedIn: 'root'
})
export class CyclingScoringService {
  private translate = inject(TranslateService);

  /**
   * Calculate overall cycling suitability score based on multiple weather factors.
   *
   * Uses a weighted average for base scoring, then applies a "Veto System" (hard caps)
   * that enforces maximum possible scores when conditions are unsafe or very uncomfortable.
   * The final `overall` is always Math.min(baseScore, tightestHardCap).
   */
  calculateCyclingScore(
    current: CurrentWeather,
    hourlyForecast: HourlyWeather[],
    dailyForecast: DailyWeather[],
    airQuality?: any
  ): { score: CyclingScore; issues: CyclingIssue[]; dynamicAdvice?: string } {

    const issues: CyclingIssue[] = [];

    // --- Gather data for the 3-hour window (first 3 hours of hourly forecast) ---
    const hourlySlice = hourlyForecast.slice(0, 3); // Safe with empty / short arrays via .reduce() fallback

    // --- Determine effective values using a 3-hour window instead of daily max ---
    
    // Effective wind: max of current + next 3 hours. If hourly is empty/short, spread produces -Infinity and current wins as fallback.
    const effectiveWind = Math.max(
      current.windspeed_10m,
      ...hourlyForecast.slice(0, 3).map(h => h.windspeed_10m)
    );

    // Effective UV: same pattern — if hourly is empty/short, current wins as fallback.
    const effectiveUV = Math.max(
      current.uv_index ?? 0,
      ...hourlyForecast.slice(0, 3).map(h => h.uv_index ?? 0)
    );

    // --- Calculate individual scores ---

    const temperatureScore = this.calculateTemperatureScore(current);
    const windScore = this.calculateWindScore(effectiveWind);
    const precipitationScore = this.calculatePrecipitationScore(current, hourlySlice);
    const airQualityScore = this.calculateAirQualityScore(airQuality);
    const uvScore = this.calculateUVScore(current, effectiveUV);
    const humidityScore = this.calculateHumidityScore(current);

    // --- Weighted base score (new weights) ---
    // New weight distribution:
    //   precipitation 0.30 — highest priority; rain is the #1 reason to not cycle
    //   airQuality     0.20 — health impact during exercise is significant
    //   wind           0.20 — safety and comfort factor
    //   temperature    0.20 — comfort factor (revised thresholds)
    //   humidity        0.05 — secondary comfort factor
    //   uvIndex         0.05 — minor factor for cycling specifically
    const baseScore = Math.round(
      precipitationScore * 0.30 +
      airQualityScore * 0.20 +
      windScore     * 0.20 +
      temperatureScore * 0.20 +
      humidityScore   * 0.05 +
      uvScore         * 0.05
    );

    // ========================================================================
    // SYSTEM VETO — Hard Caps (Limity Maksymalne)
    // ========================================================================
    // After computing the weighted base score, we apply hard caps that limit
    // the final overall result if any factor makes cycling unsafe or very
    // uncomfortable. Each cap is evaluated independently; the tightest one
    // wins via Math.min(). This ensures e.g. AQI > 200 never yields a score
    // above 20 even when temperature, wind and humidity are all perfect (100).
    let hardCap = 100; // Default: no cap — conditions allow full score

    const currentPrecip = current.precipitation;
    const maxProb3h = hourlySlice.reduce((maxProb, h) => {
      return Math.max(maxProb, h.precipitation_probability);
    }, 0);
    const aqi = airQuality?.aqi ?? undefined;

    // --- AQI / Smog veto ---------------------------------------------------
    // Bad air quality is dangerous during aerobic exercise — must cap hard.
    if (aqi !== undefined) {
      if (aqi > 200) {
        hardCap = Math.min(hardCap, 20); // Hazardous: max 20 points regardless of other factors
      } else if (aqi > 150) {
        hardCap = Math.min(hardCap, 40); // Unhealthy for sensitive groups: max 40
      } else if (aqi > 100) {
        hardCap = Math.min(hardCap, 64); // Moderate: capped at 64 ("Poor")
      }
    }

    // --- Precipitation veto -------------------------------------------------
    // Rain during cycling is a deal-breaker — caps are very strict.
    if (currentPrecip >= 1.0) {
      hardCap = Math.min(hardCap, 25); // Heavy rain: max 25 ("Poor")
    } else if (currentPrecip > 0.1) {
      hardCap = Math.min(hardCap, 45); // Light rain: max 45 ("Poor")
    } else if (maxProb3h >= 75) {
      hardCap = Math.min(hardCap, 55); // Very high rain probability: max 55 ("Fair")
    }

    // --- Wind veto ----------------------------------------------------------
    // High winds are dangerous for cyclists. Based on the 3-hour effectiveWind.
    if (effectiveWind >= 40) {
      hardCap = Math.min(hardCap, 30); // Extreme wind: max 30 ("Poor")
    } else if (effectiveWind >= 30) {
      hardCap = Math.min(hardCap, 58); // Strong wind: max 58 ("Fair")
    }

    // --- Temperature / Ice veto ---------------------------------------------
    const temp = current.temperature_2m;
    
    // Icy road risk: below freezing AND (rain/snow OR high rain prob OR very humid)
    // This is the most dangerous combination for cyclists — strictest cap.
    if (temp < 0 && (currentPrecip > 0 || maxProb3h >= 40 || current.relative_humidity_2m > 85)) {
      hardCap = Math.min(hardCap, 15); // Icy road risk: max 15 ("Danger")
    } else if (temp < -5 || temp > 36) {
      hardCap = Math.min(hardCap, 35); // Extreme cold/heat: max 35 ("Poor")
    } else if (temp < 0) {
      hardCap = Math.min(hardCap, 48); // Below freezing but no ice risk yet: max 48 ("Poor")
    }

    // --- Apply the tightest cap to produce the final overall score ----------
    const overall = Math.min(baseScore, hardCap);

    // --- Generate score details with labels ---
    const details: CyclingScoreDetails = {
      temperatureComfort: this.getTemperatureLabel(temperatureScore),
      windCondition: this.getWindLabel(windScore),
      precipitationRisk: this.getPrecipitationLabel(precipitationScore),
      airQualityStatus: this.getAirQualityLabel(airQualityScore),
      uvRiskLevel: this.getUVLabel(uvScore),
      humidityComfort: this.getHumidityLabel(humidityScore)
    };

    const score = { 
      overall, 
      temperature: temperatureScore, 
      wind: windScore, 
      precipitation: precipitationScore, 
      airQuality: airQualityScore,
      uvIndex: uvScore, 
      humidity: humidityScore, 
      details 
    };

    // Generate dynamic advice for this score context
    const apparentTemp = current.apparent_temperature ?? temp;
    const dynamicAdviceMessage = this.getDynamicAdvice(
      overall, temp, apparentTemp, effectiveWind,
      currentPrecip, maxProb3h, aqi
    );

    // Generate forecast-based issues/warnings
    const forecastIssues = this.calculateForecastIssues(
      current, hourlyForecast, dailyForecast, effectiveWind, aqi
    );

    return { score, issues: forecastIssues, dynamicAdvice: dynamicAdviceMessage };
  }

  /**
   * Calculate additional forecast-based issues (storm warnings, rain in next hours,
   * air quality alerts, wind warnings, ice risk).
   */
  calculateForecastIssues(
    current: CurrentWeather,
    hourlyForecast: HourlyWeather[],
    dailyForecast: DailyWeather[],
    effectiveWind: number,
    aqi: number | undefined
  ): CyclingIssue[] {
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

    // --- New alerts ---------------------------------------------------------

    // 😷 Air quality / smog alert
    if (aqi !== undefined && aqi > 100) {
      issues.push({
        type: 'warning',
        icon: '😷',
        title: this.translate.instant('alerts.airQualityWarning'),
        description: this.translate.instant('alerts.airQualityWarningDescription')
      });
    }

    // 💨 Strong wind alert (based on the 3-hour effectiveWind)
    if (effectiveWind >= 30) {
      issues.push({
        type: 'warning',
        icon: '💨',
        title: this.translate.instant('alerts.strongWind'),
        description: this.translate.instant('alerts.strongWindDescription')
      });
    }

    // 🧊 Ice risk alert: temperature near/below freezing with high humidity or precipitation
    const tempNearFreezing = current.temperature_2m <= 1 && 
      (current.relative_humidity_2m > 85 || current.precipitation > 0);
    if (tempNearFreezing) {
      issues.push({
        type: 'danger',
        icon: '🧊',
        title: this.translate.instant('alerts.iceRisk'),
        description: this.translate.instant('alerts.iceRiskDescription')
      });
    }

    return issues;
  }

  // ========================================================================
  // Individual score calculation methods (revised per requirements)
  // ========================================================================

  /**
   * Temperature score using apparent_temperature when available, with revised thresholds.
   * Cyclists warm up during exercise and can dress in layers, but extreme heat (>32°C)
   * or frost are dangerous regardless.
   */
  private calculateTemperatureScore(current: CurrentWeather): number {
    // Use apparent_temperature (feels-like) when available — accounts for wind chill & humidity.
    const temp = current.apparent_temperature ?? current.temperature_2m;

    if (temp >= 16 && temp <= 24) return 100;      // Ideal: 16-24°C
    if (temp >= 12 && temp < 16)  return 90;       // Good light chill — great for cycling
    if (temp > 24 && temp <= 28)  return 85;       // Good — warm but comfortable
    if (temp >= 8  && temp < 12)  return 75;       // Good — requires warmer gear
    if (temp > 28 && temp <= 32)  return 60;       // Fair — hot
    if (temp >= 4  && temp < 8)   return 55;       // Fair — cold but rideable with thermal gear
    if (temp >= 0  && temp < 4)   return 35;       // Poor — very cold
    if (temp > 32 && temp <= 36)  return 30;       // Poor — dangerous heat
    return 10;                                       // Poor: below 0°C or above 36°C — extreme conditions
  }

  /**
   * Wind score based on the effective wind speed from the 3-hour window.
   */
  private calculateWindScore(effectiveSpeed: number): number {
    if (effectiveSpeed < 10) return 100; // Calm
    if (effectiveSpeed < 25) return 85;  // Light breeze
    if (effectiveSpeed < 36) return 70;  // Moderate — some headwind risk
    if (effectiveSpeed < 50) return 40;  // Strong winds
    return 15;                           // Very strong — dangerous for cycling
  }

  /**
   * Precipitation score using current precipitation amount AND max probability
   * from the first 3 hours of forecast. Evaluated in priority order (most severe first).
   */
  private calculatePrecipitationScore(current: CurrentWeather, hourlySlice: HourlyWeather[]): number {
    const currentPrecip = current.precipitation;
    const maxProb3h = hourlySlice.reduce((max, h) => Math.max(max, h.precipitation_probability), 0);

    // Priority-ordered cascade (most severe conditions first):

    if (currentPrecip >= 1.0) return 5;           // Heavy rain — score drops to 5
    if (currentPrecip > 0.1) return 20;           // Light rain — score 20
    
    // Trace precipitation OR very high probability → both trigger the same cap
    if (currentPrecip > 0 || maxProb3h >= 75) {
      return 15;                                  // Traces or ≥75% chance
    }

    if (maxProb3h >= 50)  return 45;              // Medium probability
    if (maxProb3h >= 30)  return 70;              // Low-Medium probability
    if (maxProb3h >= 10)  return 90;              // Low probability
    
    return 100;                                  // None — <10% chance, no current rain
  }

  /**
   * Air quality score based on AQI. Cycling increases oxygen intake significantly,
   * making polluted air especially harmful during exercise.
   */
  private calculateAirQualityScore(airQuality: any): number {
    if (!airQuality || airQuality.aqi === undefined) return 80; // Default when no data

    const aqi = airQuality.aqi;

    if (aqi <= 40)   return 100;  // Excellent
    if (aqi <= 75)   return 85;   // Good
    if (aqi <= 100)  return 65;   // Moderate
    if (aqi <= 150)  return 35;   // Unhealthy for sensitive groups
    if (aqi <= 200)  return 15;   // Very unhealthy
    return 0;                      // Hazardous
  }

  /**
   * UV score based on effective UV from the 3-hour window.
   */
  private calculateUVScore(current: CurrentWeather, effectiveUV: number): number {
    if (effectiveUV < 3)  return 100;  // Low — no protection needed
    if (effectiveUV < 6)  return 85;   // Moderate
    if (effectiveUV < 8)  return 65;   // High — protection needed
    if (effectiveUV < 11) return 45;   // Very high
    return 25;                         // Extreme
  }

  /**
   * Humidity score with corrected non-overlapping ranges.
   */
  private calculateHumidityScore(current: CurrentWeather): number {
    const humidity = current.relative_humidity_2m;

    if (humidity >= 35 && humidity <= 65) return 100; // Comfortable — ideal range
    if (humidity < 35)                  return 80;   // OK — dry but manageable
    if (humidity <= 75)                 return 80;   // OK — slightly humid
    if (humidity <= 85)                 return 55;   // Humid
    return 30;                                          // Very humid — uncomfortable
  }

  // ========================================================================
  // Label helpers for CyclingScoreDetails
  // ========================================================================

  private getTemperatureLabel(score: number): string {
    const key = score >= 90 ? 'ideal' : score >= 70 ? 'good' 
              : score >= 50  ? 'fair' : 'poor';
    return this.translate.instant(`scoreLabels.temperature.${key}`);
  }

  private getWindLabel(score: number): string {
    const key = score >= 90 ? 'calm' : score >= 70 ? 'lightBreeze' 
              : score >= 50  ? 'moderate' : 'strongHeadwind';
    return this.translate.instant(`scoreLabels.wind.${key}`);
  }

  private getPrecipitationLabel(score: number): string {
    const key = score >= 90 ? 'none' : score >= 70 ? 'low' 
              : score >= 50  ? 'medium' : 'high';
    return this.translate.instant(`scoreLabels.precipitation.${key}`);
  }

  private getAirQualityLabel(score: number): string {
    const key = score >= 90 ? 'excellent' : score >= 70 ? 'good' 
              : score >= 50  ? 'moderate' : 'unhealthy';
    return this.translate.instant(`scoreLabels.airQuality.${key}`);
  }

  private getUVLabel(score: number): string {
    const key = score >= 90 ? 'low' : score >= 70 ? 'moderate' 
              : score >= 50  ? 'high' : 'veryHigh';
    return this.translate.instant(`scoreLabels.uvIndex.${key}`);
  }

  private getHumidityLabel(score: number): string {
    const key = score >= 90 ? 'comfortable' : score >= 70 ? 'ok' 
              : score >= 50  ? 'humid' : 'veryHumid';
    return this.translate.instant(`scoreLabels.humidity.${key}`);
  }

  // ========================================================================
  // Dynamic Advice — user-facing explanation of why the score is what it is
  // ========================================================================

  /**
   * Generate a contextual advisory message explaining the score.
   * Uses a priority hierarchy (danger → health → weather → comfort) so that
   * the most critical issue always takes the spotlight in the UI.
   */
  private getDynamicAdvice(
    overall: number,
    realTemp: number,
    apparentTemp: number,
    effectiveWind: number,
    currentPrecip: number,
    maxProb3h: number,
    aqi: number | undefined
  ): string {

    // ==========================================================================
    // NEGATIVE HIERARCHY — most dangerous → least severe. First match wins.
    // ==========================================================================

    // 1️⃣ Ice risk: sub-zero + (rain OR high precip prob)
    if (realTemp < 0 && (currentPrecip > 0 || maxProb3h >= 40)) {
      return this.translate.instant('advice.icyRoad');
    }

    // 2️⃣ Toxic air: AQI > 150 — hazardous for anyone
    if (aqi !== undefined && aqi > 150) {
      return this.translate.instant('advice.toxicAir');
    }

    // 3️⃣ Unhealthy air: AQI 100–150 — caution during intense exercise
    if (aqi !== undefined && aqi <= 150 && aqi > 100) {
      return this.translate.instant('advice.moderateAir');
    }

    // 4️⃣ Heavy rain now: ≥1mm = wet asphalt right now
    if (currentPrecip >= 1.0) {
      return this.translate.instant('advice.heavyRainNow');
    }

    // 5️⃣ Very high rain probability coming: ≥75% in next 3h
    if (maxProb3h >= 75) {
      return this.translate.instant('advice.highRainRisk');
    }

    // 6️⃣ Extreme heat: feels-like > 35°C — dehydration risk
    if (apparentTemp > 35 || realTemp > 35) {
      return this.translate.instant('advice.extremeHeat');
    }

    // 7️⃣ Extreme wind: ≥40 km/h — survival mode for cyclists
    if (effectiveWind >= 40) {
      return this.translate.instant('advice.extremeWind');
    }

    // 8️⃣ Strong wind: 30–39.9 km/h — hold the handlebars tight
    if (effectiveWind >= 30) {
      return this.translate.instant('advice.strongWindAdvice');
    }

    // 9️⃣ Cold (no ice risk): <5°C — dress in layers
    if (realTemp < 5 || apparentTemp < 5) {
      return this.translate.instant('advice.cold');
    }

    // ==========================================================================
    // POSITIVE MESSAGES — when overall >= 70 and no major issues detected
    // ==========================================================================

    if (overall >= 90) {
      return this.translate.instant('advice.perfectConditions');
    }

    // 70–89: good conditions, sub-conditions apply
    if (overall >= 70) {
      if (apparentTemp > 28) {
        return this.translate.instant('advice.warmHydrate');
      }
      return this.translate.instant('advice.greatWeather');
    }

    // Fallback: score ~40–69, not covered by specific negative rules.
    return this.translate.instant('advice.mixedConditions');
  }
}
