import { Component, input } from '@angular/core';
import { WeatherIconPipe } from '../../../../shared/pipes/weather-icon.pipe';
import { HourlyWeather } from '../../../../core/models/weather.model';

@Component({
  selector: 'app-hourly-chart',
  imports: [WeatherIconPipe],
  templateUrl: './hourly-chart.html',
  styleUrl: './hourly-chart.scss',
})
export class HourlyChartComponent {
  hourly = input.required<HourlyWeather>();

  get displayHours(): { time: string; temp: number; icon: number; precip: number }[] {
    const hours = this.hourly();
    const result: typeof this.displayHours = [];
    
    // Show every 3rd hour for readability (8 time points)
    for (let i = 0; i < hours.time.length && result.length < 8; i += 3) {
      const date = new Date(hours.time[i]);
      const hour = date.getHours();
      const displayHour = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
      
      result.push({
        time: displayHour,
        temp: hours.temperature_2m[i],
        icon: hours.weather_code[i],
        precip: hours.precipitation_probability?.[i] ?? 0,
      });
    }
    
    return result;
  }
}
