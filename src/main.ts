import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Initialize Capacitor if running in a native environment
if (typeof window !== 'undefined' && (window as any).Capacitor) {
  const { Capacitor } = (window as any);
  // Import and initialize plugins dynamically
  import('@capacitor/core').then(({ Capacitor: Cap }) => {
    Cap.init();
    console.log('[App] Capacitor initialized — running on', Cap.getPlatform());
  });
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
