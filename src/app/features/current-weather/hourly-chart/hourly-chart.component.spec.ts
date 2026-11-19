import { describe, expect, it } from 'vitest';
import type { HourlyWeather } from '../../../core/models/weather.model';
import { WeatherIconService } from '../../../core/utils/weather-icon-svg.service';
import { buildHourlyDisplayPoints } from './hourly-chart.component';

function makeHour(overrides: Partial<HourlyWeather> = {}): HourlyWeather {
  return {
    time: '2026-11-15T08:00',
    temperature_2m: 14,
    weather_code: 0,
    precipitation_probability: 0,
    windspeed_10m: 10,
    precipitation: 0,
    uv_index: 3,
    ...overrides,
  };
}

describe('buildHourlyDisplayPoints()', () => {
  const iconService = new WeatherIconService();

  it('samples every 2nd hour up to 13 points', () => {
    const hours: HourlyWeather[] = Array.from({ length: 48 }, (_, h) => {
      const day = 15 + Math.floor(h / 24);
      const hour = String(h % 24).padStart(2, '0');
      return makeHour({ time: `2026-11-${day}T${hour}:00`, temperature_2m: h });
    });

    const points = buildHourlyDisplayPoints(hours, iconService);
    expect(points).toHaveLength(13);
    expect(points[0].hourForTimeContext).toBe(0);
    expect(points[6].hourForTimeContext).toBe(12);
    expect(points[12].hourForTimeContext).toBe(0);
    expect(new Set(points.map((p) => p.isoTime)).size).toBe(13);
  });

  it('resolves day and night icon paths per hour', () => {
    const hours: HourlyWeather[] = [
      makeHour({ time: '2026-11-15T04:00', weather_code: 0 }),
      makeHour({ time: '2026-11-15T05:00', weather_code: 0 }),
      makeHour({ time: '2026-11-15T14:00', weather_code: 0 }),
      makeHour({ time: '2026-11-15T15:00', weather_code: 0 }),
      makeHour({ time: '2026-11-15T22:00', weather_code: 1 }),
    ];

    const points = buildHourlyDisplayPoints(hours, iconService);
    expect(points).toHaveLength(3);
    expect(points[0].iconSrc).toBe('assets/icons/velora/weather-clear-night.svg');
    expect(points[1].iconSrc).toBe('assets/icons/velora/weather-clear-day.svg');
    expect(points[2].iconSrc).toBe('assets/icons/velora/weather-partly-cloudy-night.svg');
  });

  it('rounds wind speed and preserves precipitation probability', () => {
    const points = buildHourlyDisplayPoints(
      [makeHour({ windspeed_10m: 14.6, precipitation_probability: 45 })],
      iconService
    );

    expect(points[0].wind).toBe(15);
    expect(points[0].precip).toBe(45);
  });
});
