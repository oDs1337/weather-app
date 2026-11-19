import { describe, expect, it } from 'vitest';
import type { DailyWeather } from '../../../core/models/weather.model';
import { WeatherIconService } from '../../../core/utils/weather-icon-svg.service';
import { determineDailyVariant, parseIsoHour } from './daily-forecast.component';

function makeDay(overrides: Partial<DailyWeather> = {}): DailyWeather {
  return {
    time: '2026-11-15',
    weather_code: 0,
    temperature_2m_max: 18,
    temperature_2m_min: 8,
    sunrise: '2026-11-15T06:30',
    sunset: '2026-11-15T17:45',
    precipitation_sum: 0,
    windspeed_10m_max: 12,
    uv_index_max: 4,
    sunshine_duration: 0,
    ...overrides,
  };
}

describe('DailyForecast helpers', () => {
  describe('parseIsoHour()', () => {
    it('extracts hours from ISO timestamps', () => {
      expect(parseIsoHour('2026-06-21T04:30')).toBe(4);
      expect(parseIsoHour('2026-06-21T21:45')).toBe(21);
    });

    it('returns null for invalid or empty inputs', () => {
      expect(parseIsoHour('')).toBeNull();
      expect(parseIsoHour('not-a-date')).toBeNull();
    });
  });

  describe('determineDailyVariant()', () => {
    it('returns "day" when daylight is at least 12 hours', () => {
      expect(determineDailyVariant(makeDay({ sunrise: '2026-06-21T04:30', sunset: '2026-06-21T21:45' }))).toBe('day');
      expect(determineDailyVariant(makeDay({ sunrise: '2026-03-21T06:00', sunset: '2026-03-21T18:00' }))).toBe('day');
    });

    it('returns "night" when night is longer than daylight', () => {
      expect(determineDailyVariant(makeDay({ sunrise: '2026-01-15T09:00', sunset: '2026-01-15T13:00' }))).toBe('night');
      expect(determineDailyVariant(makeDay())).toBe('night');
    });

    it('defaults to "day" when timestamps are missing or malformed', () => {
      expect(determineDailyVariant(makeDay({ sunrise: '', sunset: '2026-11-15T17:45' }))).toBe('day');
      expect(determineDailyVariant(makeDay({ sunrise: '2026-11-15T06:30', sunset: '' }))).toBe('day');
      expect(determineDailyVariant(makeDay({ sunrise: 'bad', sunset: 'bad' }))).toBe('day');
    });
  });

  describe('daily icon path resolution', () => {
    const iconService = new WeatherIconService();

    it('produces day and night SVG paths for clear/partly-cloudy codes', () => {
      expect(iconService.getWeatherIconPath(0, { forceVariant: 'day' })).toBe(
        'assets/icons/velora/weather-clear-day.svg'
      );
      expect(iconService.getWeatherIconPath(0, { forceVariant: 'night' })).toBe(
        'assets/icons/velora/weather-clear-night.svg'
      );
    });

    it('uses shared icons for weather codes without separate night assets', () => {
      const dayPath = iconService.getWeatherIconPath(61, { forceVariant: 'day' });
      const nightPath = iconService.getWeatherIconPath(61, { forceVariant: 'night' });
      expect(dayPath).toBe('assets/icons/velora/weather-rain-light.svg');
      expect(nightPath).toBe(dayPath);
    });
  });
});
