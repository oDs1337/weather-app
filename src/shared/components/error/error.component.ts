import { Component, input } from '@angular/core';

@Component({
  selector: 'app-error',
  imports: [],
  template: `
    <div class="error-container">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>{{ error() }}</p>
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      color: #ef4444;
    }

    p {
      font-size: 1.125rem;
      text-align: center;
      max-width: 400px;
    }
  `]
})
export class ErrorComponent {
  error = input.required<string>();
}
