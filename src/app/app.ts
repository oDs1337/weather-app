import { Component, inject, signal } from '@angular/core';
import { CitySelectorComponent } from './features/city-selector/city-selector.component';
import { LanguageService } from './core/services/language.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [CitySelectorComponent],
  template: `
    @if (languageReady()) {
      <app-city-selector />
    } @else {
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    }
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 16px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class App {
  private languageService = inject(LanguageService);
  private translateService = inject(TranslateService);

  // Signal to track if translations are fully loaded
  // This is set by the APP_INITIALIZER in main.ts
  languageReady = signal(true); // Start as true since APP_INITIALIZER blocks bootstrap

  // Start listening for iOS Settings changes (only on native iOS)
  constructor() {
    this.startNativeLanguageListener();
  }

  private pollingInterval: any;

  private startNativeLanguageListener(): void {
    if (!this.languageService['isNativeIOS']) return;

    console.log('[App] Starting native language change listener');
    
    // Poll every 2 seconds to detect Settings.bundle changes
    this.pollingInterval = setInterval(async () => {
      try {
        const nativeLang = await this.languageService['settingsBridge'].getLanguage();
        if (nativeLang && nativeLang !== this.languageService.getLanguage()) {
          console.log(`[App] Detected native language change: ${this.languageService.getLanguage()} → ${nativeLang}`);
          await this.languageService.setLanguage(nativeLang as any, this.translateService);
        }
      } catch (e) {
        console.warn('[App] Error polling for language changes:', e);
      }
    }, 2000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('[App] Stopped native language change listener');
    }
  }
}
