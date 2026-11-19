import { describe, expect, it } from 'vitest';
import { WeatherIconGroup, WeatherIconService } from './weather-icon-svg.service';

describe('WeatherIconService', () => {
  const service = new WeatherIconService();

  describe('getGroup()', () => {
    const cases: [number, WeatherIconGroup][] = [
      [0, 'clear'],
      [1, 'partly-cloudy'],
      [2, 'partly-cloudy'],
      [3, 'overcast'],
      [45, 'mist'],
      [48, 'fog'],
      [51, 'drizzle'],
      [53, 'rain-light'],
      [55, 'rain-moderate'],
      [61, 'rain-light'],
      [63, 'rain-moderate'],
      [65, 'rain-heavy'],
      [71, 'snow-light'],
      [73, 'snow'],
      [75, 'snow-heavy'],
      [80, 'rain-moderate'],
      [81, 'rain-heavy'],
      [82, 'thunderstorm'],
      [95, 'thunderstorm'],
      [96, 'hail'],
      [99, 'thunderstorm'],
    ];

    it.each(cases)('maps weather code %d to "%s"', (code, expectedGroup) => {
      expect(service.getGroup(code)).toBe(expectedGroup);
    });

    it('falls back to overcast for unknown codes', () => {
      expect(service.getGroup(12345)).toBe('overcast');
      expect(service.getGroup(-1)).toBe('overcast');
    });
  });

  describe('isNight()', () => {
    it('respects explicit isDay flag', () => {
      expect(WeatherIconService.isNight(12, 0)).toBe(true);
      expect(WeatherIconService.isNight(23, 1)).toBe(false);
    });

    it('uses hour boundaries when isDay is absent', () => {
      expect(WeatherIconService.isNight(5)).toBe(true);
      expect(WeatherIconService.isNight(6)).toBe(false);
      expect(WeatherIconService.isNight(19)).toBe(false);
      expect(WeatherIconService.isNight(20)).toBe(true);
      expect(WeatherIconService.isNight(undefined)).toBe(true);
    });
  });

  describe('resolve() and resolveGroup()', () => {
    it('selects day and night variants for clear and partly-cloudy codes', () => {
      expect(service.resolve(0, { isDay: true }).filename).toBe('weather-clear-day');
      expect(service.resolve(0, { isDay: false }).filename).toBe('weather-clear-night');
      expect(service.resolve(1, { hourForTimeContext: 22 }).filename).toBe('weather-partly-cloudy-night');
      expect(service.resolve(2, { hourForTimeContext: 14 }).filename).toBe('weather-partly-cloudy-day');
    });

    it('honors forceVariant over isDay', () => {
      expect(service.resolve(1, { isDay: false, forceVariant: 'day' }).filename).toBe('weather-partly-cloudy-day');
      expect(service.resolve(1, { isDay: true, forceVariant: 'night' }).filename).toBe('weather-partly-cloudy-night');
    });

    it('returns shared filename for groups without day/night variants', () => {
      expect(service.resolve(3, { isDay: true }).filename).toBe('weather-overcast');
      expect(service.resolve(3, { isDay: false }).filename).toBe('weather-overcast');
      expect(service.resolveGroup('rain-heavy', { isDay: false }).filename).toBe('weather-rain-heavy');
    });

    it('handles unknown codes and NaN hour safely', () => {
      expect(service.resolve(999).filename).toBe('weather-overcast');
      expect(service.resolve(65, { hourForTimeContext: Number.NaN }).group).toBe('rain-heavy');
    });
  });

  describe('path and label helpers', () => {
    it('builds valid SVG asset paths', () => {
      expect(service.getWeatherIconPath(0, { isDay: true })).toBe('assets/icons/velora/weather-clear-day.svg');
      expect(service.getWeatherIconPath(0, { isDay: false })).toBe('assets/icons/velora/weather-clear-night.svg');
      expect(service.getIconSrc(65)).toBe('assets/icons/velora/weather-rain-heavy.svg');
      expect(service.iconSrc('metric-feels-like.svg')).toBe('assets/icons/velora/metric-feels-like.svg');
    });

    it('returns human-readable labels and Unknown fallback', () => {
      expect(service.getLabel(0)).toBe('Clear sky');
      expect(service.getLabel(96)).toBe('Thunderstorm with slight hail');
      expect(service.getLabel(999)).toBe('Unknown');
    });
  });
});
