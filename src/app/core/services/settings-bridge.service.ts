import { Injectable } from '@angular/core';
import { registerPlugin, Capacitor } from '@capacitor/core';

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

/**
 * Register the native iOSLanguagePlugin with Capacitor v8 API.
 * This plugin uses Bundle.main.preferredLocalizations.first to get the app-specific language.
 */
const iOSLanguage = registerPlugin('iOSLanguage', {
  iOS: true,
  web: () => ({
    getLanguage: async () => ({ languageTag: 'en' }),
  }),
}) as any;

@Injectable({
  providedIn: 'root',
})
export class SettingsBridgeService {
  private static readonly SETTINGS_KEY = 'app_language';

  /**
   * Read the current application language from native iOS APIs.
   * Uses Bundle.main.preferredLocalizations.first which returns the app-specific language
   * selected in iOS Settings → Apps → [App Name] → Language.
   */
  async getLanguage(): Promise<string> {
    try {
      // On iOS, use the new iOSLanguagePlugin which uses Bundle.main.preferredLocalizations.first
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
        const result = await iOSLanguage.getLanguage() as GetLanguageResult;
        const languageTag = result.language || 'en';
        
        // Normalize the language tag to a simple code (e.g., 'pl-PL' -> 'pl', 'en-US' -> 'en')
        const normalizedLang = this.normalizeLanguageCode(languageTag);
        
        console.log(`[SettingsBridge] Native iOS language: ${languageTag} → normalized: ${normalizedLang}`);
        return normalizedLang;
      }
      
      // Fallback for other platforms or if plugin fails
      const result = await AppSettings.getLanguage() as GetLanguageResult;
      return result.language || 'en';
    } catch (error) {
      console.warn('Failed to read language from native APIs:', error);
      return 'en'; // fallback
    }
  }

  /**
   * Set the language preference in iOS Settings.bundle (NSUserDefaults).
   */
  async setLanguage(language: string): Promise<void> {
    try {
      await AppSettings.setLanguage({ language }) as any;
    } catch (error) {
      console.warn('Failed to write language to Settings.bundle:', error);
    }
  }

  /**
   * Normalize a locale identifier to a simple language code.
   * Examples: 'pl-PL' -> 'pl', 'en-US' -> 'en', 'de_DE' -> 'de'
   */
  private normalizeLanguageCode(locale: string): string {
    if (!locale) return 'en';
    
    // Extract just the language part (before '-' or '_')
    const lang = locale.split(/[-_]/)[0].toLowerCase();
    
    // Validate it's a reasonable language code (at least 2 characters)
    if (lang.length >= 2 && /^[a-z]+$/.test(lang)) {
      return lang;
    }
    
    return 'en';
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
