import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'weatherIcon',
  standalone: true,
})
export class WeatherIconPipe implements PipeTransform {
  transform(code: number): string {
    const weatherIcons: Record<number, string> = {
      0: '☀️',
      1: '🌤️',
      2: '⛅',
      3: '☁️',
      45: '🌫️',
      48: '🌫️',
      51: '🌦️',
      53: '🌦️',
      55: '🌧️',
      61: '🌧️',
      63: '🌧️',
      65: '🌧️',
      71: '❄️',
      73: '❄️',
      75: '❄️',
      80: '🌦️',
      81: '🌧️',
      82: '⛈️',
      95: '⛈️',
      96: '⛈️',
      99: '⛈️',
    };

    return weatherIcons[code] || '🌡️';
  }
}
