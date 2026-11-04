import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Initialize Capacitor if running in a native environment
if (typeof window !== 'undefined' && (window as any).Capacitor) {
  const platform = (window as any).Capacitor.getPlatform();
  console.log('[App] Capacitor detected — running on', platform);
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
