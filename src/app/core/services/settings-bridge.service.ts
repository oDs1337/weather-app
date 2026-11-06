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
 * This is used on iOS for Settings.bundle integration.
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

/**
 * Register the native AndroidLanguageSettings plugin with Capacitor v8 API.
 * This plugin uses LocaleManager on Android 13+ for per-app locale settings,
 * and falls back to SharedPreferences + Configuration update on older versions.
 */
const AndroidLanguage = registerPlugin('AndroidLanguageSettings', {
  android: true,
  web: () => ({
    getLanguage: async () => ({ language: 'en' }),
    setLanguage: async (params: SetLanguageParams) => ({ language: params.language }),
    openSettings: async () => {},
  }),
}) as any;

@Injectable({
  providedIn: 'root',
})
export class SettingsBridgeService {
  private static readonly SETTINGS_KEY = 'app_language';

  /**
   * Read the current application language from native platform APIs.
   * 
   * On iOS: Uses Bundle.main.preferredLocalizations.first (Settings.bundle)
   * On Android: Uses LocaleManager.getApplicationLocales() on API 33+,
   *             falls back to device-wide locale on older versions
   */
  async getLanguage(): Promise<string> {
    try {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
        // iOS: Use the new iOSLanguagePlugin which uses Bundle.main.preferredLocalizations.first
        const result = await iOSLanguage.getLanguage() as GetLanguageResult;
        const languageTag = result.language || 'en';
        
        // Normalize the language tag to a simple code (e.g., 'pl-PL' -> 'pl', 'en-US' -> 'en')
        const normalizedLang = this.normalizeLanguageCode(languageTag);
        
        console.log(`[SettingsBridge] Native iOS language: ${languageTag} → normalized: ${normalizedLang}`);
        return normalizedLang;
      } else if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        // Android: Use the native AndroidLanguageSettings plugin
        const result = await AndroidLanguage.getLanguage() as GetLanguageResult;
        const language = result.language || 'en';
        
        console.log(`[SettingsBridge] Native Android language: ${language}`);
        return this.normalizeLanguageCode(language);
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
   * Set the language preference in native platform settings.
   * 
   * On iOS: Writes to NSUserDefaults (Settings.bundle)
   * On Android 13+: Uses LocaleManager.setApplicationLocales() for per-app locale
   * On Android < 13: Falls back to SharedPreferences + Configuration update
   */
  async setLanguage(language: string): Promise<void> {
    try {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
        await AppSettings.setLanguage({ language }) as any;
      } else if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        await AndroidLanguage.setLanguage({ language }) as any;
      }
    } catch (error) {
      console.warn('Failed to write language to native settings:', error);
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
