import { Component } from '@angular/core';
import { CitySelectorComponent } from './features/city-selector/city-selector.component';

@Component({
  imports: [CitySelectorComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
