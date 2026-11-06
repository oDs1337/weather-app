import { bootstrapApplication } from '@angular/platform-browser';
import { APP_INITIALIZER, Provider, inject } from '@angular/core';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { LanguageService } from './app/core/services/language.service';
import { TranslateService } from '@ngx-translate/core';

// Initialize Capacitor if running in a native environment
if (typeof window !== 'undefined' && (window as any).Capacitor) {
  const platform = (window as any).Capacitor.getPlatform();
  console.log('[App] Capacitor detected — running on', platform);
}

/**
 * App initializer factory that ensures translations are loaded BEFORE Angular bootstraps.
 * This is the KEY fix - it prevents components from rendering before translations exist.
 */
export function appInitializerFactory(): () => Promise<void> {
  return async () => {
    console.log('[App] Running app initializer...');
    
    const languageService = inject(LanguageService);
    const translateService = inject(TranslateService);
    
    // Initialize the language service - this loads and activates translations
    await languageService.initialize(translateService);
    
    console.log('[App] ✓ Translations loaded, continuing bootstrap...');
  };
}

// Add the app initializer to the providers
const appInitializerProvider: Provider = {
  provide: APP_INITIALIZER,
  useFactory: appInitializerFactory,
  deps: [],
  multi: true,
};

// Merge with existing config
const mergedConfig = {
  ...appConfig,
  providers: [...appConfig.providers, appInitializerProvider],
};

bootstrapApplication(App, mergedConfig)
  .catch((err) => console.error('[App] Bootstrap failed:', err));
