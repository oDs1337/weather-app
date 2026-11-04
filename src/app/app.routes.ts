import { Routes } from '@angular/router';
import { CitySelectorComponent } from './features/city-selector/city-selector.component';
import { CurrentWeatherComponent } from './features/current-weather/current-weather.component';

export const routes: Routes = [
  { path: '', component: CitySelectorComponent },
  { path: 'weather', component: CurrentWeatherComponent },
  { path: '**', redirectTo: '' },
];
