// ============================================================
// VELORA — Weather Icon SVG Service (Premium Asset Integration)
// Central icon resolution system. Maps Open-Meteo weather codes to
// premium asset-based SVG icons with full day/night variant support.
// PHASE 2: Introduced resolve() as the single source of truth for
// all icon selection logic across forecast components.
// ============================================================

import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

/** Open-Meteo WMO weather code group to icon filename prefix */
export type WeatherIconGroup =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'overcast'
  | 'drizzle'
  | 'rain-light'
  | 'rain-moderate'
  | 'rain-heavy'
  | 'thunderstorm'
  | 'snow-light'
  | 'snow'
  | 'snow-heavy'
  | 'sleet'
  | 'hail'
  | 'fog'
  | 'mist'
  | 'freezing-rain'
  | 'wind';

/** Variant type for day / night icon selection */
export type IconVariant = 'day' | 'night';

/** Options passed to resolve() and resolveGroup(). */
export interface IconResolveOptions {
  /** Explicit is_day flag from the API (0=night, 1=day). Takes highest priority. */
  isDay?: boolean;
  /** Hour-of-day used for time-based day/night inference when isDay is absent. */
  hourForTimeContext?: number;
  /** Force a specific variant regardless of time context. Overrides isDay and hourForTimeContext. */
  forceVariant?: IconVariant;
}

/** Result of the central icon resolution process. */
export interface IconResolution {
  /** The resolved icon group (never undefined). */
  group: WeatherIconGroup;
  /** The selected SVG filename without extension (e.g. "weather-clear-day"). */
  filename: string;
  /** Variant type that was selected ('day' or 'night'). */
  variant: IconVariant;
  /** All available variants for this group, regardless of selection. */
  variants: { day: string | null; night: string | null };
  /** Whether the caller asked for a forced variant but none exists in assets. */
  hadFallback: boolean;
}

@Injectable({ providedIn: 'root' })
export class WeatherIconService {
  private readonly prefix = 'assets/icons/velora/weather-';

  // Open-Meteo WMO weather code → icon group mapping
  // Covers all codes from the API and maps them to local icon groups.
  // Code 96 (slight hail) now correctly maps to 'hail' instead of 'thunderstorm'.
  private readonly codeMap: Record<number, WeatherIconGroup> = {
    // Clear sky / sunny
    0: 'clear',

    // Mainly clear (maps to partly-cloudy for better visual coverage)
    1: 'partly-cloudy',

    // Partly cloudy
    2: 'partly-cloudy',

    // Overcast
    3: 'overcast',

    // Fog / Depositing rime fog → mist
    45: 'mist',
    48: 'fog',

    // Drizzle (slight, moderate, dense)
    51: 'drizzle',
    53: 'rain-light',
    55: 'rain-moderate',

    // Rain (slight, moderate, heavy)
    61: 'rain-light',
    63: 'rain-moderate',
    65: 'rain-heavy',

    // Snow (slight, moderate, heavy)
    71: 'snow-light',
    73: 'snow',
    75: 'snow-heavy',

    // Rain showers (slight, moderate → rain categories; violent → thunderstorm for visual accuracy)
    80: 'rain-moderate',
    81: 'rain-heavy',
    82: 'thunderstorm',

    // Thunderstorm / hail — code 96 is "slight hail", maps to the hail group
    95: 'thunderstorm',
    96: 'hail',
    99: 'thunderstorm',
  };

  /** Return the icon group for a given Open-Meteo weather code. Falls back to 'overcast' (code 3). */
  getGroup(code: number): WeatherIconGroup {
    return this.codeMap[code] ?? ('overcast' as WeatherIconGroup);
  }

  // ---------------------------------------------------------------------------
  // Day/night helpers
  // ---------------------------------------------------------------------------

  /** Determine if it is nighttime based on hour-of-day and an optional is_day flag. */
  static isNight(hourOfTheDay?: number, isDay?: number | null): boolean {
    // If the caller provides explicit is_day (from API), honour that first
    if (isDay === 0) return true;
    if (isDay === 1) return false;
    // Otherwise derive from hour: night = hours before sunrise / after sunset → 21-5
    const h = hourOfTheDay ?? -1;
    return h < 6 || h >= 20;
  }

  /** Derive day/night boolean for use in resolve() and resolveGroup(). */
  private deriveIsNight(options?: IconResolveOptions): boolean {
    if (options?.forceVariant) {
      // Force takes precedence — return the inverse of what's forced
      return options.forceVariant === 'night';
    }

    if (typeof options?.isDay === 'boolean') {
      return !options.isDay;
    }

    const h = options?.hourForTimeContext;
    if (typeof h === 'number' && !isNaN(h)) {
      return WeatherIconService.isNight(h);
    }

    // Default: daytime
    return false;
  }

  // ---------------------------------------------------------------------------
  // Day / night variant maps
  // ---------------------------------------------------------------------------

  /** Get the icon group name for day vs night (some icons have variants, others are shared). */
  getVariants(group: WeatherIconGroup): { day: string | null; night: string | null } {
    const dayMap: Record<WeatherIconGroup, string> = {
      clear: 'weather-clear-day',
      'partly-cloudy': 'weather-partly-cloudy-day',
      cloudy: 'weather-cloudy',
      overcast: 'weather-overcast',
      drizzle: 'weather-drizzle',
      'rain-light': 'weather-rain-light',
      'rain-moderate': 'weather-rain-moderate',
      'rain-heavy': 'weather-rain-heavy',
      thunderstorm: 'weather-thunderstorm',
      'snow-light': 'weather-snow-light',
      snow: 'weather-snow',
      'snow-heavy': 'weather-snow-heavy',
      sleet: 'weather-sleet',
      hail: 'weather-hail',
      fog: 'weather-fog',
      mist: 'weather-mist',
      'freezing-rain': 'weather-freezing-rain',
      wind: 'weather-wind',
    };

    const nightMap: Record<WeatherIconGroup, string> = {
      clear: 'weather-clear-night',
      'partly-cloudy': 'weather-partly-cloudy-night',
      cloudy: 'weather-cloudy', // no separate night variant
      overcast: 'weather-overcast', // no separate night variant
      drizzle: 'weather-drizzle',
      'rain-light': 'weather-rain-light',
      'rain-moderate': 'weather-rain-moderate',
      'rain-heavy': 'weather-rain-heavy',
      thunderstorm: 'weather-thunderstorm', // no separate night variant (same visual)
      'snow-light': 'weather-snow-light',
      snow: 'weather-snow',
      'snow-heavy': 'weather-snow-heavy',
      sleet: 'weather-sleet',
      hail: 'weather-hail',
      fog: 'weather-fog',
      mist: 'weather-mist',
      'freezing-rain': 'weather-freezing-rain',
      wind: 'weather-wind',
    };

    return { day: dayMap[group] ?? null, night: nightMap[group] ?? null };
  }

  // ---------------------------------------------------------------------------
  // Central resolution methods (PHASE 2 additions)
  // ---------------------------------------------------------------------------

  /**
   * Resolve the correct icon for a given weather code with full time context.
   * This is the single source of truth used by all forecast components.
   */
  resolve(code: number, options?: IconResolveOptions): IconResolution {
    const group = this.codeMap[code] ?? ('overcast' as WeatherIconGroup);
    const variants = this.getVariants(group);
    const isNight = this.deriveIsNight(options);

    let filename: string | null;

    if (options?.forceVariant) {
      // User forced a specific variant — use it even if it doesn't exist
      const forcedKey = options.forceVariant === 'night' ? 'night' : 'day';
      filename = variants[forcedKey];
    } else if (isNight && variants.night) {
      filename = variants.night;
    } else if (!isNight && variants.day) {
      filename = variants.day;
    } else {
      // Fallback: use whatever variant exists, or null for truly missing groups
      filename = variants.day ?? variants.night;
    }

    const hadFallback =
      options?.forceVariant !== undefined &&
      filename === null;

    return { group, filename: filename!, variant: isNight ? 'night' : 'day', variants, hadFallback };
  }

  /**
   * Resolve a specific icon group name directly (not from a weather code).
   * Useful for non-weather icons like metric-feels-like or time-sunrise.
   */
  resolveGroup(group: WeatherIconGroup, options?: IconResolveOptions): IconResolution {
    const variants = this.getVariants(group);
    const isNight = this.deriveIsNight(options);

    let filename: string | null;

    if (options?.forceVariant) {
      const forcedKey = options.forceVariant === 'night' ? 'night' : 'day';
      filename = variants[forcedKey];
    } else if (isNight && variants.night) {
      filename = variants.night;
    } else if (!isNight && variants.day) {
      filename = variants.day;
    } else {
      filename = variants.day ?? variants.night;
    }

    const hadFallback =
      options?.forceVariant !== undefined &&
      filename === null;

    return { group, filename: filename!, variant: isNight ? 'night' : 'day', variants, hadFallback };
  }

  // ---------------------------------------------------------------------------
  // Backward-compatible public API (unchanged signatures)
  // ---------------------------------------------------------------------------

  /** Build a SafeUrl pointing to the correct SVG asset for this weather code + time of day. */
  getIconSrc(code: number, size = 64): SafeUrl | string {
    const group = this.getGroup(code);
    const variants = this.getVariants(group);
    const filename = variants.day ?? variants.night; // default to daytime variant as fallback

    return `assets/icons/velora/${filename}.svg`;
  }

  /** Return a human-readable weather description for the given code. */
  getLabel(code: number): string {
    const labels: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snowfall',
      73: 'Moderate snowfall',
      75: 'Heavy snowfall',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail',
    };
    return labels[code] ?? 'Unknown';
  }

  /** Build a SafeUrl for any asset in the velora icon pack by filename. */
  iconSrc(filename: string): string {
    return `assets/icons/velora/${filename}`;
  }
}
