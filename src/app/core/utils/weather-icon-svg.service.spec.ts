// ============================================================
// VELORA — Weather Icon Service: Unit Tests (Phase 2)
// Tests cover: all supported categories, day/night logic,
// unknown codes, missing data, fallbacks, and the new
// central resolve() API.
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  WeatherIconService,
  WeatherIconGroup,
  IconResolveOptions,
} from './weather-icon-svg.service';

describe('WeatherIconService', () => {
  const service = new WeatherIconService();

  // ---------------------------------------------------------------------------
  // getGroup() — code → group mapping (all known codes)
  // ---------------------------------------------------------------------------

  describe('getGroup()', () => {
    const testCases: [number, WeatherIconGroup][] = [
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
      [96, 'hail'], // PHASE 2 FIX: was thunderstorm, now hail
      [99, 'thunderstorm'],
    ];

    testCases.forEach(([code, expectedGroup]) => {
      it(`should map code ${code} to '${expectedGroup}'`, () => {
        expect(service.getGroup(code)).toBe(expectedGroup);
      });
    });

    it('should fallback to overcast for an unknown code', () => {
      expect(service.getGroup(12345)).toBe('overcast');
      expect(service.getGroup(-1)).toBe('overcast');
    });
  });

  // ---------------------------------------------------------------------------
  // getVariants() — day/night variants per group
  // ---------------------------------------------------------------------------

  describe('getVariants()', () => {
    const variantTests: [WeatherIconGroup, string | null, string | null][] = [
      ['clear', 'weather-clear-day', 'weather-clear-night'],
      ['partly-cloudy', 'weather-partly-cloudy-day', 'weather-partly-cloudy-night'],
      ['cloudy', 'weather-cloudy', 'weather-cloudy'],
      ['overcast', 'weather-overcast', 'weather-overcast'],
      ['drizzle', 'weather-drizzle', 'weather-drizzle'],
      ['rain-light', 'weather-rain-light', 'weather-rain-light'],
      ['rain-moderate', 'weather-rain-moderate', 'weather-rain-moderate'],
      ['rain-heavy', 'weather-rain-heavy', 'weather-rain-heavy'],
      ['thunderstorm', 'weather-thunderstorm', 'weather-thunderstorm'],
      ['snow-light', 'weather-snow-light', 'weather-snow-light'],
      ['snow', 'weather-snow', 'weather-snow'],
      ['snow-heavy', 'weather-snow-heavy', 'weather-snow-heavy'],
      ['sleet', 'weather-sleet', 'weather-sleet'],
      ['hail', 'weather-hail', 'weather-hail'],
      ['fog', 'weather-fog', 'weather-fog'],
      ['mist', 'weather-mist', 'weather-mist'],
      ['freezing-rain', 'weather-freezing-rain', 'weather-freezing-rain'],
      ['wind', 'weather-wind', 'weather-wind'],
    ];

    variantTests.forEach(([group, expectedDay, expectedNight]) => {
      it(`should return variants for '${group}'`, () => {
        const result = service.getVariants(group);
        expect(result.day).toBe(expectedDay);
        expect(result.night).toBe(expectedNight);
      });
    });

    // Edge: an unknown group would produce null, null — but WeatherIconGroup is a closed union.
  });

  // ---------------------------------------------------------------------------
  // Static isNight() helper
  // ---------------------------------------------------------------------------

  describe('isNight()', () => {
    it('should return true when isDay === 0', () => {
      expect(WeatherIconService.isNight(undefined, 0)).toBe(true);
    });

    it('should return false when isDay === 1', () => {
      expect(WeatherIconService.isNight(undefined, 1)).toBe(false);
    });

    it('should use hour-based logic when isDay is absent', () => {
      // Night hours: <6 and >=20
      expect(WeatherIconService.isNight(5)).toBe(true);   // 5am — night
      expect(WeatherIconService.isNight(-1)).toBe(true);  // sentinel — night
      expect(WeatherIconService.isNight(undefined)).toBe(true); // undefined → -1 → night

      expect(WeatherIconService.isNight(6)).toBe(false);  // 6am — day
      expect(WeatherIconService.isNight(12)).toBe(false); // noon — day
      expect(WeatherIconService.isNight(19)).toBe(false); // 7pm — day
      expect(WeatherIconService.isNight(20)).toBe(true);  // 8pm — night
    });
  });

  // ---------------------------------------------------------------------------
  // resolve() — central resolution method (PHASE 2)
  // ---------------------------------------------------------------------------

  describe('resolve()', () => {
    it('should return the correct filename for a clear-day code with isDay=1', () => {
      const res = service.resolve(0, { isDay: true });
      expect(res.group).toBe('clear');
      expect(res.filename).toBe('weather-clear-day');
      expect(res.variant).toBe('day');
    });

    it('should return the clear-night filename for code 0 with isDay=0', () => {
      const res = service.resolve(0, { isDay: false });
      expect(res.group).toBe('clear');
      expect(res.filename).toBe('weather-clear-night');
      expect(res.variant).toBe('night');
    });

    it('should return the partly-cloudy-day filename for code 1 with no time context', () => {
      const res = service.resolve(1, {});
      expect(res.group).toBe('partly-cloudy');
      expect(res.filename).toBe('weather-partly-cloudy-day');
      expect(res.variant).toBe('day'); // default: day when no time context
    });

    it('should select night variant using hour-based time context', () => {
      const res = service.resolve(1, { hourForTimeContext: 22 });
      expect(res.filename).toBe('weather-partly-cloudy-night');
      expect(res.variant).toBe('night');
    });

    it('should select day variant using hour-based time context at noon', () => {
      const res = service.resolve(1, { hourForTimeContext: 14 });
      expect(res.filename).toBe('weather-partly-cloudy-day');
      expect(res.variant).toBe('day');
    });

    it('should use the shared filename for groups without day/night variants', () => {
      const res = service.resolve(3, { isDay: true }); // overcast
      expect(res.filename).toBe('weather-overcast');
      expect(res.variant).toBe('day');

      const res2 = service.resolve(3, { isDay: false });
      expect(res2.filename).toBe('weather-overcast');
      expect(res2.variant).toBe('night'); // variant label says night but filename stays the same
    });

    it('should map code 82 to thunderstorm', () => {
      const res = service.resolve(82);
      expect(res.group).toBe('thunderstorm');
      expect(res.filename).toBe('weather-thunderstorm');
    });

    it('should map code 96 to hail (PHASE 2 fix)', () => {
      const res = service.resolve(96);
      expect(res.group).toBe('hail');
      expect(res.filename).toBe('weather-hail');
    });

    // ---------------------------------------------------------------------------
    // Unknown codes & fallbacks
    // ---------------------------------------------------------------------------

    it('should fall back to overcast for an unknown code', () => {
      const res = service.resolve(999);
      expect(res.group).toBe('overcast');
      expect(res.filename).toBe('weather-overcast');
    });

    it('should resolve with forceVariant even when no variant exists', () => {
      // overcast has day === night (same filename), so forcing is acceptable
      const res = service.resolve(3, { forceVariant: 'night' });
      expect(res.filename).toBe('weather-overcast');
    });

    it('should return hadFallback=false when resolution succeeds', () => {
      const res = service.resolve(0);
      expect(res.hadFallback).toBe(false);
    });

    // ---------------------------------------------------------------------------
    // forceVariant
    // ---------------------------------------------------------------------------

    it('should force day variant regardless of isDay flag', () => {
      const res = service.resolve(1, { isDay: false, forceVariant: 'day' });
      expect(res.filename).toBe('weather-partly-cloudy-day');
    });

    it('should force night variant regardless of isDay flag', () => {
      const res = service.resolve(1, { isDay: true, forceVariant: 'night' });
      expect(res.filename).toBe('weather-partly-cloudy-night');
    });

    // ---------------------------------------------------------------------------
    // resolveGroup() — direct group resolution (PHASE 2)
    // ---------------------------------------------------------------------------

    it('should resolve a weather group directly to its filename', () => {
      const res = service.resolveGroup('clear', { isDay: true });
      expect(res.group).toBe('clear');
      expect(res.filename).toBe('weather-clear-day');
    });

    it('should return the shared filename for non-variant groups', () => {
      const res = service.resolveGroup('rain-heavy', { isDay: false });
      expect(res.group).toBe('rain-heavy');
      expect(res.filename).toBe('weather-rain-heavy');
      expect(res.variant).toBe('night');
    });

    it('should handle all WeatherIconGroup values via resolveGroup()', () => {
      const groups: WeatherIconGroup[] = [
        'clear', 'partly-cloudy', 'cloudy', 'overcast',
        'drizzle', 'rain-light', 'rain-moderate', 'rain-heavy',
        'thunderstorm', 'snow-light', 'snow', 'snow-heavy',
        'sleet', 'hail', 'fog', 'mist', 'freezing-rain', 'wind',
      ];

      groups.forEach((group) => {
        const res = service.resolveGroup(group);
        expect(res.group).toBe(group);
        // Each group should have a non-null day variant filename
        expect(res.variants.day).not.toBeNull();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getIconSrc() — backward-compatible API (unchanged)
  // ---------------------------------------------------------------------------

  describe('getIconSrc()', () => {
    it('should return a path string for code 0', () => {
      const url = service.getIconSrc(0);
      expect(typeof url).toBe('string');
      expect(url).toContain('weather-clear-day.svg');
    });

    it('should return a path containing "assets/icons/velora/"', () => {
      const url = service.getIconSrc(65); // rain-heavy
      expect(url).toBe('assets/icons/velora/weather-rain-heavy.svg');
    });
  });

  // ---------------------------------------------------------------------------
  // getLabel() — human-readable descriptions
  // ---------------------------------------------------------------------------

  describe('getLabel()', () => {
    it('should return "Clear sky" for code 0', () => {
      expect(service.getLabel(0)).toBe('Clear sky');
    });

    it('should return a known label for each mapped code', () => {
      const labels: [number, string][] = [
        [1, 'Mainly clear'],
        [2, 'Partly cloudy'],
        [3, 'Overcast'],
        [45, 'Foggy'],
        [65, 'Heavy rain'],
        [95, 'Thunderstorm'],
        [96, 'Thunderstorm with slight hail'],
      ];

      labels.forEach(([code, expectedLabel]) => {
        expect(service.getLabel(code)).toBe(expectedLabel);
      });
    });

    it('should return "Unknown" for unmapped codes', () => {
      expect(service.getLabel(999)).toBe('Unknown');
    });
  });

  // ---------------------------------------------------------------------------
  // iconSrc() — generic asset path helper
  // ---------------------------------------------------------------------------

  describe('iconSrc()', () => {
    it('should build a correct path for any velora icon filename', () => {
      expect(service.iconSrc('time-sunrise.svg')).toBe(
        'assets/icons/velora/time-sunrise.svg'
      );
    });

    it('should not prepend "weather-" prefix (generic helper)', () => {
      expect(service.iconSrc('metric-feels-like.svg')).toBe(
        'assets/icons/velora/metric-feels-like.svg'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Resolution coverage — every code produces a valid IconResolution
  // ---------------------------------------------------------------------------

  describe('resolve() full-code coverage', () => {
    // Hardcoded list mirrors service codeMap keys — avoids accessing private field
    const allMappedCodes = [0,1,2,3,45,48,51,53,55,61,63,65,71,73,75,80,81,82,95,96,99];

    it.each(allMappedCodes)(
      'should resolve code %d without errors and return non-null filename',
      (code: number) => {
        const res = service.resolve(code);
        expect(res.group).toBeDefined();
        expect(res.filename).not.toBeNull();
        expect(res.filename.length).toBeGreaterThan(0);
        expect(res.variants.day).not.toBeNull(); // day should always have a variant
      }
    );

    it.each(allMappedCodes)(
      'should resolve code %d with isDay=false (night)',
      (code: number) => {
        const res = service.resolve(code, { isDay: false });
        expect(res.group).toBeDefined();
        expect(res.filename.length).toBeGreaterThan(0);
      }
    );

    it.each(allMappedCodes)(
      'should resolve code %d with hourForTimeContext=22 (night)',
      (code: number) => {
        const res = service.resolve(code, { hourForTimeContext: 22 });
        expect(res.group).toBeDefined();
        expect(res.filename.length).toBeGreaterThan(0);
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Day/Night completeness — every variant has both day and night entries
  // ---------------------------------------------------------------------------

  describe('variant symmetry', () => {
    const allGroups: WeatherIconGroup[] = [
      'clear', 'partly-cloudy', 'cloudy', 'overcast',
      'drizzle', 'rain-light', 'rain-moderate', 'rain-heavy',
      'thunderstorm', 'snow-light', 'snow', 'snow-heavy',
      'sleet', 'hail', 'fog', 'mist', 'freezing-rain', 'wind',
    ];

    it.each(allGroups)(
      "group '%s' should have at least a day variant in getVariants()",
      (group) => {
        const v = service.getVariants(group);
        expect(v.day).not.toBeNull();
        expect(typeof v.day).toBe('string');
      }
    );

    it.each(allGroups)(
      "group '%s' should have a matching night variant in getVariants()",
      (group) => {
        const v = service.getVariants(group);
        // Every group has at least one filename (day === night for non-variant groups).
        expect(v.night).not.toBeNull();
      }
    );

    it.each(allGroups)(
      "resolve() should work with forceVariant='night' for group '%s'",
      (group) => {
        const res = service.resolveGroup(group, { forceVariant: 'night' });
        expect(res.group).toBe(group);
        // May fall back to the day variant if no night file exists, but must never throw.
        expect(res.filename.length).toBeGreaterThan(0);
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Edge cases: missing data and null handling
  // ---------------------------------------------------------------------------

  describe('missing data edge cases', () => {
    it('should not throw when isDay is null (treated as undefined)', () => {
      const res = service.resolve(0, { isDay: undefined });
      expect(res.filename).not.toBeNull();
    });

    it('should not throw with hourForTimeContext=NaN', () => {
      // NaN should be treated as absent (deriveIsNight guards with isNaN check)
      const res = service.resolve(65, { hourForTimeContext: NaN });
      expect(res.group).toBe('rain-heavy');
    });

    it('should not throw when options object is empty', () => {
      const res = service.resolve(3);
      expect(res.filename).toBe('weather-overcast');
    });

    it('should not throw with no options at all', () => {
      const res = service.resolve(0);
      expect(res.filename).not.toBeNull();
    });
  });
});
