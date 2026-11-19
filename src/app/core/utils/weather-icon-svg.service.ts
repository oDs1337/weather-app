import { Injectable } from '@angular/core';

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

export type IconVariant = 'day' | 'night';

export interface IconResolveOptions {
  isDay?: boolean;
  hourForTimeContext?: number;
  forceVariant?: IconVariant;
}

export interface IconResolution {
  group: WeatherIconGroup;
  filename: string;
  variant: IconVariant;
  variants: { day: string | null; night: string | null };
  hadFallback: boolean;
}

const ASSET_BASE = 'assets/icons/velora/';

const CODE_TO_GROUP: Readonly<Record<number, WeatherIconGroup>> = {
  0: 'clear',
  1: 'partly-cloudy',
  2: 'partly-cloudy',
  3: 'overcast',
  45: 'mist',
  48: 'fog',
  51: 'drizzle',
  53: 'rain-light',
  55: 'rain-moderate',
  61: 'rain-light',
  63: 'rain-moderate',
  65: 'rain-heavy',
  71: 'snow-light',
  73: 'snow',
  75: 'snow-heavy',
  80: 'rain-moderate',
  81: 'rain-heavy',
  82: 'thunderstorm',
  95: 'thunderstorm',
  96: 'hail',
  99: 'thunderstorm',
};

const WEATHER_LABELS: Readonly<Record<number, string>> = {
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

const GROUPS_WITH_DAY_NIGHT = new Set<WeatherIconGroup>(['clear', 'partly-cloudy']);

@Injectable({ providedIn: 'root' })
export class WeatherIconService {
  static isNight(hourOfTheDay?: number, isDay?: number | null): boolean {
    if (isDay === 0) return true;
    if (isDay === 1) return false;
    const h = hourOfTheDay ?? -1;
    return h < 6 || h >= 20;
  }

  getGroup(code: number): WeatherIconGroup {
    return CODE_TO_GROUP[code] ?? 'overcast';
  }

  getVariants(group: WeatherIconGroup): { day: string | null; night: string | null } {
    if (GROUPS_WITH_DAY_NIGHT.has(group)) {
      return {
        day: `weather-${group}-day`,
        night: `weather-${group}-night`,
      };
    }

    const shared = `weather-${group}`;
    return { day: shared, night: shared };
  }

  resolve(code: number, options?: IconResolveOptions): IconResolution {
    return this.resolveGroup(this.getGroup(code), options);
  }

  resolveGroup(group: WeatherIconGroup, options?: IconResolveOptions): IconResolution {
    const variants = this.getVariants(group);
    const isNight = this.deriveIsNight(options);
    const variant: IconVariant = isNight ? 'night' : 'day';

    const filename = options?.forceVariant
      ? variants[options.forceVariant]
      : (variants[variant] ?? variants.day ?? variants.night);

    return {
      group,
      filename: filename ?? 'weather-overcast',
      variant,
      variants,
      hadFallback: options?.forceVariant !== undefined && filename === null,
    };
  }

  getWeatherIconPath(code: number, options?: IconResolveOptions): string {
    const { filename } = this.resolve(code, options);
    return `${ASSET_BASE}${filename}.svg`;
  }

  getIconSrc(code: number): string {
    return this.getWeatherIconPath(code);
  }

  getLabel(code: number): string {
    return WEATHER_LABELS[code] ?? 'Unknown';
  }

  iconSrc(filename: string): string {
    return `${ASSET_BASE}${filename}`;
  }

  private deriveIsNight(options?: IconResolveOptions): boolean {
    if (options?.forceVariant) {
      return options.forceVariant === 'night';
    }
    if (typeof options?.isDay === 'boolean') {
      return !options.isDay;
    }
    const h = options?.hourForTimeContext;
    if (typeof h === 'number' && !Number.isNaN(h)) {
      return WeatherIconService.isNight(h);
    }
    return false;
  }
}
