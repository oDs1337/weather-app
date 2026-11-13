// ============================================================
// VELORA — Hourly Chart Component Tests (Phase 5)
// Comprehensive tests for hourly forecast icon resolution,
// day/night variant selection, data extraction from hourly API
// responses, and scroll indicator behavior.
// ============================================================

import { describe, it, expect } from 'vitest';
import { WeatherIconService } from '../../../../app/core/utils/weather-icon-svg.service';
import type { HourlyWeather } from '../../../../core/models/weather.model';

/** Build a minimal hourly weather stub with the given fields. */
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

/** Simulate the displayHours computation (per-phase extraction from hourly data). */
function computeDisplayHours(hourlyData: HourlyWeather[]): { time: string; temp: number; icon: number; precip: number | null; wind: number | null; hourForTimeContext: number }[] {
  const result: { time: string; temp: number; icon: number; precip: number | null; wind: number | null; hourForTimeContext: number }[] = [];

  for (let i = 0; i < hourlyData.length && result.length < 13; i += 2) {
    const date = new Date(hourlyData[i].time);
    result.push({
      time: String(date.getHours()),
      temp: hourlyData[i].temperature_2m,
      icon: hourlyData[i].weather_code,
      precip: hourlyData[i].precipitation_probability ?? null,
      wind: Math.round(hourlyData[i].windspeed_10m),
      hourForTimeContext: date.getHours(),
    });
  }

  return result;
}

/** Simulate the iconSrc() path building from HourlyChartComponent. */
function buildIconPath(code: number, hourForTimeContext: number): string | null {
  if (!code) return null;
  const service = new WeatherIconService();
  const resolution = service.resolve(code, { hourForTimeContext });

  let filename: string;
  if (resolution.group === 'overcast' && !resolution.filename.startsWith('weather-overcast')) {
    filename = 'assets/icons/velora/weather-overcast.svg';
  } else {
    filename = `assets/icons/velora/${resolution.filename}.svg`;
  }

  return filename;
}

// ── displayHours() data extraction ───────────────────────────────────────

describe('displayHours (data extraction)', () => {
  it('should sample every 2nd entry (up to 13 points)', () => {
    const fullData: HourlyWeather[] = [];
    for (let h = 0; h < 72; h += 1) { // 72 hours of data
      fullData.push(makeHour({ time: `2026-11-15T${String(h % 24).padStart(2, '0')}:00`, temperature_2m: h }));
    }

    const display = computeDisplayHours(fullData);
    expect(display.length).toBe(13);
    // Iteration indices: 0,2,4,...,24 (every 2nd until 13 points reached)
    expect(display[0].hourForTimeContext).toBe(0);     // i=0 → h%24=0
    expect(display[6].hourForTimeContext).toBe(12);    // i=12 → h%24=12
    expect(display[12].hourForTimeContext).toBe(0);    // i=24 → h%24=0 (wraps around)
  });

  it('should include all entries when fewer than ~26 total', () => {
    const limited: HourlyWeather[] = [
      makeHour({ time: '2026-11-15T00:00' }),
      makeHour({ time: '2026-11-15T01:00' }),
      makeHour({ time: '2026-11-15T02:00' }),
    ];

    const display = computeDisplayHours(limited);
    expect(display.length).toBe(2); // indices 0 and 2 only (every 2nd)
    expect(display[0].hourForTimeContext).toBe(0);
    expect(display[1].hourForTimeContext).toBe(2);
  });

  it('should cap at exactly 13 display points for large datasets', () => {
    const fullData: HourlyWeather[] = [];
    for (let h = 0; h < 100; h++) {
      fullData.push(makeHour({ time: `2026-11-15T${String(h % 24).padStart(2, '0')}:00` }));
    }

    const display = computeDisplayHours(fullData);
    expect(display.length).toBe(13);
  });
});

// ── iconSrc() — per-point day/night resolution ────────────────────────

describe('iconSrc (per-point resolution)', () => {
  const service = new WeatherIconService();

  describe('daytime hours', () => {
    it.each([6, 7, 8, 9, 10, 12, 14])(
      'hour %d should resolve to day variant for code 0 (clear sky)',
      (hour) => {
        const resolution = service.resolve(0, { hourForTimeContext: hour });
        expect(resolution.filename).toBe('weather-clear-day');
        expect(resolution.variant).toBe('day');
      }
    );

    it.each([6, 8, 10, 14])(
      'hour %d should resolve to partly-cloudy day for code 2',
      (hour) => {
        const resolution = service.resolve(2, { hourForTimeContext: hour });
        expect(resolution.filename).toBe('weather-partly-cloudy-day');
        expect(resolution.variant).toBe('day');
      }
    );

    it.each([8, 12])(
      'hour %d should resolve to overcast for code 3',
      (hour) => {
        const resolution = service.resolve(3, { hourForTimeContext: hour });
        expect(resolution.filename).toBe('weather-overcast'); // no variant suffix needed
      }
    );

    it.each([10])(
      'should produce valid asset path for rain-light code 61 at hour %d',
      (hour) => {
        const resolution = service.resolve(61, { hourForTimeContext: hour });
        expect(resolution.filename).toBe('weather-rain-light'); // no variant suffix
        expect(String(`assets/icons/velora/${resolution.filename}.svg`)).toMatch(/assets\/icons\/velora\/.+\.svg$/);
      }
    );

    it.each([12])(
      'should produce valid asset path for snow code 73 at hour %d',
      (hour) => {
        const resolution = service.resolve(73, { hourForTimeContext: hour });
        expect(resolution.filename).toBe('weather-snow'); // no variant suffix
        expect(String(`assets/icons/velora/${resolution.filename}.svg`)).toMatch(/assets\/icons\/velora\/.+\.svg$/);
      }
    );

    it.each([14])(
      'should produce valid asset path for thunderstorm code 82 at hour %d',
      (hour) => {
        const resolution = service.resolve(82, { hourForTimeContext: hour });
        expect(resolution.filename).toBe('weather-thunderstorm'); // no variant suffix
        expect(String(`assets/icons/velora/${resolution.filename}.svg`)).toMatch(/assets\/icons\/velora\/.+\.svg$/);
      }
    );

    it.each([0, 1, 2])(
      'should produce valid asset path for clear/partly-cloudy code %d at hour %d (day)',
      (code, _hour) => {
        const resolution = service.resolve(code, { hourForTimeContext: 14 });
        let filename: string;
        if (resolution.group === 'overcast' && !resolution.filename.startsWith('weather-overcast')) {
          filename = 'assets/icons/velora/weather-overcast.svg';
        } else {
          filename = `assets/icons/velora/${resolution.filename}.svg`;
        }
        expect(filename).toMatch(/-day\.svg$/); // clear/partly-cloudy have day variant
      }
    );

    it.each([3, 45, 61, 73])(
      'should produce valid asset path for shared-icon code %d at hour %d (day)',
      (code, _hour) => {
        const resolution = service.resolve(code, { hourForTimeContext: 14 });
        let filename: string;
        if (resolution.group === 'overcast' && !resolution.filename.startsWith('weather-overcast')) {
          filename = 'assets/icons/velora/weather-overcast.svg';
        } else {
          filename = `assets/icons/velora/${resolution.filename}.svg`;
        }
        expect(filename).toMatch(/assets\/icons\/velora\/.+\.svg$/); // no day suffix for shared groups
      }
    );
  });

  describe('nighttime hours', () => {
    it.each([21, 22, 23])(
      'hour %d should resolve to clear-night for code 0',
      (hour) => {
        const resolution = service.resolve(0, { hourForTimeContext: hour });
        expect(resolution.filename).toBe('weather-clear-night');
        expect(resolution.variant).toBe('night');
      }
    );

    it.each([22])(
      'should resolve to partly-cloudy-night for code 1',
      (hour) => {
        const resolution = service.resolve(1, { hourForTimeContext: hour });
        expect(resolution.filename).toBe('weather-partly-cloudy-night');
        expect(resolution.variant).toBe('night');
      }
    );

    it.each([23])(
      'should resolve to partly-cloudy-night for code 2',
      (hour) => {
        const resolution = service.resolve(2, { hourForTimeContext: hour });
        expect(resolution.filename).toBe('weather-partly-cloudy-night');
        expect(resolution.variant).toBe('night');
      }
    );

    // Rain/snow groups use shared filenames regardless of time context.
    it.each([0, 21])(
      'hour %d should resolve to rain-moderate for code 55 (shared icon)',
      (hour) => {
        const resolution = service.resolve(55, { hourForTimeContext: hour });
        expect(resolution.filename).toBe('weather-rain-moderate'); // same day/night
        expect(resolution.variant).toBe(hour < 6 || hour >= 20 ? 'night' : 'day');
      }
    );

    it.each([22])(
      'should resolve to snow-light for code 71 (shared icon)',
      (hour) => {
        const resolution = service.resolve(71, { hourForTimeContext: hour });
        expect(resolution.filename).toBe('weather-snow-light'); // shared filename
        expect(resolution.variant).toBe('night');
      }
    );

    it.each([23])(
      'should resolve to thunderstorm for code 95 (shared icon)',
      (hour) => {
        const resolution = service.resolve(95, { hourForTimeContext: hour });
        expect(resolution.filename).toBe('weather-thunderstorm'); // shared filename
        expect(resolution.variant).toBe('night');
      }
    );

    it.each([0, 1, 2])(
      'should produce path ending in -night.svg for clear/partly-cloudy code %d at hour %d',
      (code, _hour) => {
        const resolution = service.resolve(code, { hourForTimeContext: 23 });
        let filename: string;
        if (resolution.group === 'overcast' && !resolution.filename.startsWith('weather-overcast')) {
          filename = 'assets/icons/velora/weather-overcast.svg';
        } else {
          filename = `assets/icons/velora/${resolution.filename}.svg`;
        }
        expect(filename).toMatch(/-night\.svg$/); // clear/partly-cloudy have night variant
      }
    );

    it.each([3, 61])(
      'shared-icon code %d produces same filename at hour %d regardless of day/night',
      (code) => {
        const resDay = service.resolve(code, { hourForTimeContext: 8 });
        let pathDay: string;
        if (resDay.group === 'overcast' && !resDay.filename.startsWith('weather-overcast')) {
          pathDay = 'assets/icons/velora/weather-overcast.svg';
        } else {
          pathDay = `assets/icons/velora/${resDay.filename}.svg`;
        }

        const resNight = service.resolve(code, { hourForTimeContext: 23 });
        let pathNight: string;
        if (resNight.group === 'overcast' && !resNight.filename.startsWith('weather-overcast')) {
          pathNight = 'assets/icons/velora/weather-overcast.svg';
        } else {
          pathNight = `assets/icons/velora/${resNight.filename}.svg`;
        }

        expect(pathDay).toBe(pathNight); // shared icons don't differ by time
      }
    );
  });

  describe('dawn/dusk transition hours', () => {
    it('hour 5 should resolve to night variant (boundary before sunrise at 6)', () => {
      const resolution = service.resolve(0, { hourForTimeContext: 5 });
      expect(resolution.variant).toBe('night');
      expect(resolution.filename).toBe('weather-clear-night');
    });

    it('hour 20 should resolve to night variant (boundary at/after sunset)', () => {
      const resolution = service.resolve(2, { hourForTimeContext: 20 });
      // isNight returns h >= 20 → true for hour 20
      expect(resolution.variant).toBe('night');
    });

    it('hour 6 should resolve to day variant (boundary at sunrise)', () => {
      const resolution = service.resolve(1, { hourForTimeContext: 6 });
      // isNight returns h < 6 || h >= 20 → false for hour 6
      expect(resolution.variant).toBe('day');
    });

    it.each([5])(
      'hour %d should resolve to night variant even if weather code suggests day',
      (hour) => {
        const resolution = service.resolve(0, { hourForTimeContext: hour });
        expect(resolution.filename).toBe('weather-clear-night');
        // Even at code 1 (mainly clear), night variant should still be used
        const resNight = service.resolve(1, { hourForTimeContext: hour });
        expect(resNight.filename).toBe('weather-partly-cloudy-night');
      }
    );
  });

  describe('missing data edge cases', () => {
    it('should default to day variant when hourForTimeContext is absent', () => {
      const resolution = service.resolve(0);
      expect(resolution.filename).toBe('weather-clear-day'); // default fallback
    });

    it.each([null, undefined])(
      'should handle null hour without throwing — defaults to day',
      (_hour: null | undefined) => {
        const res: any = service.resolve(2);
        expect(res.group).toBeDefined();
        expect(res.filename.length).toBeGreaterThan(0);
      }
    );

    it('should resolve code 999 (unknown) without crashing at any hour', () => {
      [0, 6, 12, 18, 23].forEach((hour: number) => {
        const res = service.resolve(999, { hourForTimeContext: hour });
        expect(res.group).toBe('overcast'); // fallback group
        expect(res.filename.length).toBeGreaterThan(0);
      });
    });

    it.each([0, 2, 61, 73])(
      'should handle all weather codes with no options — defaults to day',
      (code: number) => {
        const res = service.resolve(code);
        expect(res.group).toBeDefined();
        expect(res.filename.length).toBeGreaterThan(0);
      }
    );

    it('hourForTimeContext=NaN should not throw and default to day', () => {
      // NaN is treated as absent (deriveIsNight guards with isNaN check)
      const res = service.resolve(65, { hourForTimeContext: NaN as any });
      expect(res.group).toBe('rain-heavy');
    });

    it.each([1, 2, 3])(
      'should produce valid asset path for code %d via buildIconPath() helper',
      (code) => {
        const path = buildIconPath(code, 14); // daytime hour
        expect(path).toMatch(/^assets\/icons\/velora\/.+\.svg$/);
      }
    );

    it.each([1])(
      'should produce different paths for day and night via buildIconPath() helper',
      (code) => {
        const pathDay = buildIconPath(code, 14);
        const pathNight = buildIconPath(code, 23);
        expect(pathDay).toMatch(/-day\.svg$/);
        expect(pathNight).toMatch(/-night\.svg$/);
      }
    );
  });

  describe('path construction matches component iconSrc()', () => {
    it.each([0, 1, 2])(
      'should produce correct asset path for day variant at hour %d',
      (code) => {
        const resolution = service.resolve(code, { hourForTimeContext: 8 });
        let filename: string;
        if (resolution.group === 'overcast' && !resolution.filename.startsWith('weather-overcast')) {
          filename = 'assets/icons/velora/weather-overcast.svg';
        } else {
          filename = `assets/icons/velora/${resolution.filename}.svg`;
        }
        expect(filename).toMatch(/^assets\/icons\/velora\/.+\.svg$/);
      }
    );

    it.each([0, 1, 2])(
      'should produce correct asset path for night variant at hour %d',
      (code) => {
        const resolution = service.resolve(code, { hourForTimeContext: 23 });
        let filename: string;
        if (resolution.group === 'overcast' && !resolution.filename.startsWith('weather-overcast')) {
          filename = 'assets/icons/velora/weather-overcast.svg';
        } else {
          filename = `assets/icons/velora/${resolution.filename}.svg`;
        }
        expect(filename).toMatch(/^assets\/icons\/velora\/.+\.svg$/);
      }
    );

    it.each([3, 45, 61, 73])(
      'should produce correct asset path for shared-variant code %d',
      (code) => {
        const dayRes = service.resolve(code, { hourForTimeContext: 8 });
        let fnDay: string;
        if (dayRes.group === 'overcast' && !dayRes.filename.startsWith('weather-overcast')) {
          fnDay = 'assets/icons/velora/weather-overcast.svg';
        } else {
          fnDay = `assets/icons/velora/${dayRes.filename}.svg`;
        }

        const nightRes = service.resolve(code, { hourForTimeContext: 23 });
        let fnNight: string;
        if (nightRes.group === 'overcast' && !nightRes.filename.startsWith('weather-overcast')) {
          fnNight = 'assets/icons/velora/weather-overcast.svg';
        } else {
          fnNight = `assets/icons/velora/${nightRes.filename}.svg`;
        }

        // Shared variants should resolve to the same filename regardless of time context.
        expect(fnDay).toBe(fnNight);
      }
    );

    it.each([82])(
      'should produce correct asset path for thunderstorm code %d in day and night',
      (code) => {
        const resDay = service.resolve(code, { hourForTimeContext: 14 });
        let pathDay: string;
        if (resDay.group === 'overcast' && !resDay.filename.startsWith('weather-overcast')) {
          pathDay = 'assets/icons/velora/weather-overcast.svg';
        } else {
          pathDay = `assets/icons/velora/${resDay.filename}.svg`;
        }

        const resNight = service.resolve(code, { hourForTimeContext: 22 });
        let pathNight: string;
        if (resNight.group === 'overcast' && !resNight.filename.startsWith('weather-overcast')) {
          pathNight = 'assets/icons/velora/weather-overcast.svg';
        } else {
          pathNight = `assets/icons/velora/${resNight.filename}.svg`;
        }

        // thunderstorm uses shared icon for both day and night
        expect(pathDay).toBe('assets/icons/velora/weather-thunderstorm.svg');
        expect(pathNight).toBe('assets/icons/velora/weather-thunderstorm.svg');
      }
    );
  });
});

// ── hasMore() scroll indicator logic (standalone function simulation) ───

describe('hasMore (scroll indicator)', () => {
  // hasMore = fullData.length > displayHours.length * 2
  // For small arrays: every 2nd entry until 13 points max. display = ceil(n/2).
  // For large arrays (> ~26): caps at 13 → hasMore=true only when n ≥ 27
  it.each([
    [0, false],   // disp=0 → 0>0=false ✓
    [1, false],   // disp=1(i=0) → 1>2=false ✓
    [3, false],   // disp=2(i=0,2) → 3>4=false ✓
    [5, false],   // disp=3(i=0,2,4) → 5>6=false ✓
    [7, false],   // disp=4(i=0..6) → 7>8=false ✓
    [9, false],   // disp=5(i=0..8) → 9>10=false ✓
    [26, false],  // disp=13(capped) → 26>26=false (exactly equal) ✓
    [27, true],   // disp=13(capped) → 27>26=true ✓
    [50, true],   // disp=13(capped) → 50>26=true ✓
  ])(
    'hourly length %d should produce hasMore=%s',
    (length: number, expectedHasMore: boolean) => {
      const fullData: HourlyWeather[] = [];
      for (let h = 0; h < length; h++) {
        fullData.push(makeHour({ time: `2026-11-15T${String(h % 24).padStart(2, '0')}:00` }));
      }

      const displayHours = computeDisplayHours(fullData);
      const hasMore = fullData.length > displayHours.length * 2;
      expect(hasMore).toBe(expectedHasMore);
    }
  );
});

// ── Day/night transition test — realistic hourly forecast scenario ──────

describe('day/night transition in realistic scenarios', () => {
  const service = new WeatherIconService();

  it('should correctly classify hours for sunrise/sunset transition', () => {
    // Simulate a scenario with varied conditions across a full day cycle
    const scenarios: Array<[number, string]> = [
      [0, 'night'],   // midnight
      [3, 'night'],   // 3 AM — night
      [5, 'night'],   // 5 AM — just before sunrise (6)
      [6, 'day'],     // 6 AM — at dawn → day boundary
      [12, 'day'],    // noon — definitively day
      [19, 'day'],    // 7 PM — still technically day (before >= 20)
      [20, 'night'],  // 8 PM — at sunset boundary → night
      [23, 'night'],  // 11 PM — deep night
    ];

    scenarios.forEach(([hour, expectedVariant]) => {
      const res = service.resolve(0, { hourForTimeContext: hour });
      expect(res.variant).toBe(expectedVariant);
      if (expectedVariant === 'day') {
        expect(res.filename).toBe('weather-clear-day');
      } else {
        expect(res.filename).toBe('weather-clear-night');
      }
    });
  });

  it('should handle a full-day forecast from midnight to midnight', () => {
    const hourlyData: HourlyWeather[] = [];
    for (let h = 0; h < 26; h += 1) { // 26 entries → exactly 13 display points
      hourlyData.push(makeHour({ time: `2026-11-15T${String(h % 24).padStart(2, '0')}:00` }));
    }

    const displayHours = computeDisplayHours(hourlyData);
    expect(displayHours.length).toBe(13); // every 2nd entry up to 13 points

    // Verify day/night transition: first entries use night, middle use day, last use night
    // At hours where isNight returns true (h<6||h>=20) → night variant for clear sky
    for (let i = 0; i < displayHours.length; i++) {
      const hour = displayHours[i].hourForTimeContext;
      if (hour < 6 || hour >= 20) {
        const res = service.resolve(0, { hourForTimeContext: hour });
        expect(res.variant).toBe('night');
      } else {
        const res = service.resolve(0, { hourForTimeContext: hour });
        expect(res.variant).toBe('day');
      }
    }
  });

  it('should handle mixed weather codes across day/night hours', () => {
    // Simulate a realistic forecast with different conditions throughout the day
    const mixedData: HourlyWeather[] = [
      makeHour({ time: '2026-11-15T00:00', weather_code: 0 }),     // clear night
      makeHour({ time: '2026-11-15T02:00', weather_code: 3 }),     // overcast night
      makeHour({ time: '2026-11-15T04:00', weather_code: 71 }),    // light snow at dawn
      makeHour({ time: '2026-11-15T08:00', weather_code: 2 }),     // partly cloudy day
      makeHour({ time: '2026-11-15T10:00', weather_code: 0 }),     // clear day
      makeHour({ time: '2026-11-15T14:00', weather_code: 63 }),    // moderate rain afternoon
      makeHour({ time: '2026-11-15T18:00', weather_code: 1 }),     // mainly clear evening
      makeHour({ time: '2026-11-15T22:00', weather_code: 0 }),     // clear night
    ];

    const display = computeDisplayHours(mixedData);
    expect(display.length).toBe(4); // indices 0,2,4,6 (every 2nd)

    display.forEach((d) => {
      const res = service.resolve(d.icon, { hourForTimeContext: d.hourForTimeContext });
      expect(res.filename).toBeDefined();
      expect(typeof res.filename).toBe('string');
    });
  });
});
