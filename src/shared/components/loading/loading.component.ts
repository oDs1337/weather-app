import { Component } from '@angular/core';

@Component({
  selector: 'app-loading',
  imports: [],
  template: `
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Loading weather data...</p>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-left-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    p {
      color: #64748b;
      font-size: 1rem;
    }
  `]
})
export class LoadingComponent {}
