import { Injectable } from '@angular/core';
import { registerPlugin } from '@capacitor/core';

export interface GetLanguageResult {
  language: string;
}

export interface SetLanguageParams {
  language: string;
}

export interface LanguageChangedEvent {
  language: string;
}

/**
 * Register the native AppSettingsPlugin with Capacitor v8 API.
 * Using 'any' type because Capacitor v8's Plugin interface is strict about addListener return types.
 * This must be called before using the plugin.
 */
const AppSettings = registerPlugin('AppSettingsPlugin', {
  iOS: true,
  web: () => ({
    getLanguage: async () => ({ language: 'en' }),
    setLanguage: async (params: SetLanguageParams) => ({ language: params.language }),
    observeLanguageChanges: async () => {},
    addListener: async () => ({ remove: async () => {} }),
  }),
}) as any;

@Injectable({
  providedIn: 'root',
})
export class SettingsBridgeService {
  private static readonly SETTINGS_KEY = 'app_language';

  /**
   * Read the current language setting from iOS Settings.bundle (NSUserDefaults)
   */
  async getLanguage(): Promise<string> {
    try {
      const result = await AppSettings.getLanguage() as GetLanguageResult;
      return result.language || 'en';
    } catch (error) {
      console.warn('Failed to read language from Settings.bundle:', error);
      return 'en'; // fallback
    }
  }

  /**
   * Set the language preference in iOS Settings.bundle (NSUserDefaults)
   */
  async setLanguage(language: string): Promise<void> {
    try {
      await AppSettings.setLanguage({ language }) as any;
    } catch (error) {
      console.warn('Failed to write language to Settings.bundle:', error);
    }
  }

  /**
   * Listen for changes to the app_language setting.
   * Returns an Observable that emits when user changes language in iOS Settings.
   */
  async onLanguageChange(): Promise<void> {
    try {
      await AppSettings.observeLanguageChanges();
    } catch (error) {
      console.warn('Failed to observe language changes:', error);
    }
  }

  /**
   * Subscribe to native language change events from iOS Settings.
   * Returns an Observable<string> that emits when user changes language in Settings app.
   */
  onLanguageChangeObservable(): Promise<LanguageChangedEvent> {
    return new Promise((resolve) => {
      const subscription = AppSettings.addListener('languageChanged', (event: LanguageChangedEvent) => {
        resolve(event);
      });
    });
  }
}
