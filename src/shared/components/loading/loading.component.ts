import { Component } from '@angular/core';

@Component({
  selector: 'app-loading',
  imports: [],
  template: `
    <div class="loading-container">
      <div class="spinner"></div>
      <p>{{ loadingText }}</p>
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
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-border-medium);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    p {
      color: var(--color-text-secondary);
      font-size: 0.9375rem;
    }
  `]
})
export class LoadingComponent {
  loadingText = 'Loading weather data...';
}
