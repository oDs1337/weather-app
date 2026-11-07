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
  hourly = input.required<HourlyWeather[]>();

  get displayHours(): { time: string; temp: number; icon: number; precip: number }[] {
    const hours = this.hourly();
    const result: { time: string; temp: number; icon: number; precip: number }[] = [];
    
    // Show every 3rd hour for readability (8 time points)
    for (let i = 0; i < hours.length && result.length < 8; i += 3) {
      const date = new Date(hours[i].time);
      const hour = String(date.getHours()).padStart(2, '0');
      
      result.push({
        time: hour,
        temp: hours[i].temperature_2m,
        icon: hours[i].weather_code,
        precip: hours[i].precipitation_probability ?? 0,
      });
    }
    
    return result;
  }
}
