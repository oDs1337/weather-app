// ============================================================
// VELORA — Weather Icon SVG Service (Phase 5)
// Returns inline SVG markup for every Open-Meteo weather code.
// stroke="currentColor" so icons inherit text colour and adapt to theme/score context.
// ============================================================

import { Injectable } from '@angular/core';

export interface WeatherIconPath {
  path: string; // SVG paths (inner content between <svg>…</svg>)
  width?: number;
}

@Injectable({ providedIn: 'root' })
export class WeatherIconService {
  // viewBox "0 0 24 24" with stroke-width: 1.8, stroke-linecap: round, stroke-linejoin: round
  private readonly paths: Record<number, string> = {
    // Clear sky
    0: `<circle cx="12" cy="12" r="3.5"/>
      <line x1="12" y1="2" x2="12" y2="4"/>
      <line x1="12" y1="20" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="4" y2="12"/>
      <line x1="20" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`,

    // Mostly sunny
    1: `<circle cx="12" cy="12" r="3.5"/>
      <line x1="12" y1="2" x2="12" y2="4"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      <line x1="2" y1="12" x2="4" y2="12"/>
      <path d="M16 17a3 3 0 0 0-.5-5.96A6.01 6.01 0 0 0 8 11.5C8.1 14 10 16.2 12 16.5"/>`,

    // Partly cloudy
    2: `<path d="M5 17a3 3 0 0 1-.3-5.98A5.01 5.01 0 0 1 7.2 8.5 4 4 0 0 1 14.3 6.7 3 3 0 0 1 17 10a3 3 0 0 1 .5 5.96A4.01 4.01 0 0 1 18 17H5Z"/>
      <line x1="18" y1="5" x2="18" y2="7"/>
      <line x1="20" y1="6" x2="21.4" y2="5"/>
      <circle cx="18" cy="6" r="2"/>`,

    // Overcast
    3: `<path d="M5 17a3 3 0 0 1-.3-5.98A5.01 5.01 0 0 1 7.2 8.5 4 4 0 0 1 16.3 6.7 3 3 0 0 1 19 10a3 3 0 0 1 .5 5.96A4.01 4.01 0 0 1 20 17H5Z"/>`,

    // Fog / Rime fog
    45: `<line x1="2" y1="9" x2="22" y2="9"/>
      <line x1="3" y1="13" x2="20" y2="13"/>`,

    // Drizzling fog
    48: `<line x1="2" y1="9" x2="22" y2="9"/>
      <line x1="3" y1="13" x2="20" y2="13"/>`,

    // Rain: slight
    51: `<path d="M6 14a3.5 3.5 0 0 0-1 6.9h14a3.5 3.5 0 0 0 .2-7A4 4 0 0 0 10.5 8 3.5 3.5 0 0 0 6 14Z"/>
      <line x1="9" y1="20" x2="9" y2="22"/>`,

    // Rain: moderate
    53: `<path d="M7 14a3.5 3.5 0 0 0-.8 6.9h13.5a3.5 3.5 0 0 0 .3-7A4 4 0 0 0 11.2 8 3.5 3.5 0 0 0 7 14Z"/>
      <line x1="9" y1="20" x2="9" y2="22"/>
      <line x1="13" y1="20" x2="13" y2="22"/>`,

    // Rain: heavy
    55: `<path d="M7.5 14a3.5 3.5 0 0 0-.6 6.9h13a3.5 3.5 0 0 0 .2-7A4 4 0 0 0 12.2 8 3.5 3.5 0 0 0 7.5 14Z"/>
      <line x1="9" y1="20" x2="9" y2="22"/>
      <line x1="12" y1="20" x2="12" y2="22"/>
      <line x1="15" y1="20" x2="15" y2="22"/>`,

    // Rain: slight
    61: `<path d="M6 14a3.5 3.5 0 0 0-1 6.9h14a3.5 3.5 0 0 0 .2-7A4 4 0 0 0 10.5 8 3.5 3.5 0 0 0 6 14Z"/>
      <line x1="9" y1="20" x2="9" y2="22"/>`,

    // Rain: moderate
    63: `<path d="M7 14a3.5 3.5 0 0 0-.8 6.9h13.5a3.5 3.5 0 0 0 .3-7A4 4 0 0 0 11.2 8 3.5 3.5 0 0 0 7 14Z"/>
      <line x1="9" y1="20" x2="9" y2="22"/>
      <line x1="13" y1="20" x2="13" y2="22"/>`,

    // Rain: heavy
    65: `<path d="M7.5 14a3.5 3.5 0 0 0-.6 6.9h13a3.5 3.5 0 0 0 .2-7A4 4 0 0 0 12.2 8 3.5 3.5 0 0 0 7.5 14Z"/>
      <line x1="9" y1="20" x2="9" y2="22"/>
      <line x1="12" y1="20" x2="12" y2="22"/>
      <line x1="15" y1="20" x2="15" y2="22"/>`,

    // Snow: slight
    71: `<path d="M6 14a3.5 3.5 0 0 0-1 6.9h14a3.5 3.5 0 0 0 .2-7A4 4 0 0 0 10.5 8 3.5 3.5 0 0 0 6 14Z"/>
      <circle cx="9" cy="22.5" r="1" fill="currentColor"/>`,

    // Snow: moderate
    73: `<path d="M7 14a3.5 3.5 0 0 0-.8 6.9h13.5a3.5 3.5 0 0 0 .3-7A4 4 0 0 0 11.2 8 3.5 3.5 0 0 0 7 14Z"/>
      <circle cx="9" cy="22.5" r="1" fill="currentColor"/>
      <circle cx="13" cy="22.5" r="1" fill="currentColor"/>`,

    // Snow: heavy
    75: `<path d="M7.5 14a3.5 3.5 0 0 0-.6 6.9h13a3.5 3.5 0 0 0 .2-7A4 4 0 0 0 12.2 8 3.5 3.5 0 0 0 7.5 14Z"/>
      <circle cx="9" cy="22.5" r="1" fill="currentColor"/>
      <circle cx="12" cy="22.5" r="1" fill="currentColor"/>
      <circle cx="15" cy="22.5" r="1" fill="currentColor"/>`,

    // Rain showers: slight
    80: `<path d="M6 14a3.5 3.5 0 0 0-1 6.9h14a3.5 3.5 0 0 0 .2-7A4 4 0 0 0 10.5 8 3.5 3.5 0 0 0 6 14Z"/>
      <line x1="9" y1="20" x2="9" y2="22"/>`,

    // Rain showers: moderate
    81: `<path d="M7 14a3.5 3.5 0 0 0-.8 6.9h13.5a3.5 3.5 0 0 0 .3-7A4 4 0 0 0 11.2 8 3.5 3.5 0 0 0 7 14Z"/>
      <line x1="9" y1="20" x2="9" y2="22"/>
      <line x1="13" y1="20" x2="13" y2="22"/>`,

    // Rain showers: heavy
    82: `<path d="M7.5 14a3.5 3.5 0 0 0-.6 6.9h13a3.5 3.5 0 0 0 .2-7A4 4 0 0 0 12.2 8 3.5 3.5 0 0 0 7.5 14Z"/>
      <line x1="9" y1="20" x2="9" y2="22"/>
      <line x1="12" y1="20" x2="12" y2="22"/>
      <line x1="15" y1="20" x2="15" y2="22"/>`,

    // Thunderstorm
    95: `<path d="M6.5 14a3.5 3.5 0 0 0-.8 6.9h14a3.5 3.5 0 0 0 .3-7A4 4 0 0 0 11.2 8 3.5 3.5 0 0 0 6.5 14Z"/>
      <polyline points="11,14 9.5,19.5 13,19.5 10.5,25"/>`,

    // Thunderstorm with slight hail
    96: `<path d="M6.5 14a3.5 3.5 0 0 0-.8 6.9h14a3.5 3.5 0 0 0 .3-7A4 4 0 0 0 11.2 8 3.5 3.5 0 0 0 6.5 14Z"/>
      <polyline points="11,14 9.5,19.5 13,19.5 10.5,25"/>`,

    // Thunderstorm with heavy hail
    99: `<path d="M6.5 14a3.5 3.5 0 0 0-.8 6.9h14a3.5 3.5 0 0 0 .3-7A4 4 0 0 0 11.2 8 3.5 3.5 0 0 0 6.5 14Z"/>
      <polyline points="11,14 9.5,19.5 13,19.5 10.5,25"/>`,
  };

  /**
   * Get SVG path markup for a given Open-Meteo weather code.
   * Falls back to cloud icon (code 3) for unknown codes.
   */
  getPath(code: number): string {
    return this.paths[code] ?? this.paths[3];
  }

  /**
   * Render a complete SVG element as an HTML-safe string.
   */
  renderIcon(code: number, size = 24): string {
    const pathContent = this.getPath(code);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${pathContent}</svg>`;
  }

  /**
   * Return a human-readable weather description for the given code.
   */
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
}
