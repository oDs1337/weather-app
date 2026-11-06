import { Injectable, signal, inject, NgZone } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { SettingsBridgeService } from './settings-bridge.service';

export type LanguageCode = 'en' | 'pl' | 'fr' | 'ru' | 'uk';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly STORAGE_KEY = 'app-language';
  private settingsBridge = inject(SettingsBridgeService);
  private ngZone = inject(NgZone);
  
  // Platform detection
  private isNativeIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
  private isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  private isWeb = !Capacitor.isNativePlatform();
  
  // BehaviorSubject as single source of truth for language state
  private _languageSubject = new BehaviorSubject<LanguageCode>('en');
  
  // Observable for subscribers (read-only)
  readonly languageChanged$: Observable<LanguageCode> = this._languageSubject.asObservable();
  
  // Signal for Angular template binding (keeps backward compatibility)
  currentLanguage = signal<LanguageCode>('en');
  
  availableLanguages: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  ];

  /**
   * Check if the given language code is supported
   */
  private isSupportedLanguageCode(lang: string): boolean {
    return this.availableLanguages.some(l => l.code === lang);
  }

  /**
   * Load translation file from assets using multiple URL patterns.
   * Works across web, iOS Capacitor, and Android Capacitor.
   */
  private async loadTranslationFile(lang: LanguageCode): Promise<Record<string, any>> {
    try {
      console.log(`[LanguageService] Loading translations for ${lang}...`);
      
      // Try multiple URL patterns to work across web and native (Capacitor)
      const urlPatterns = [
        `/assets/i18n/${lang}.json`,                                    // Relative path
        `${window.location.origin}/assets/i18n/${lang}.json`,            // Absolute with origin
        `file:///assets/i18n/${lang}.json`,                              // File protocol (Capacitor)
      ];
      
      for (const url of urlPatterns) {
        try {
          const response = await fetch(url);
          
          if (response.ok) {
            const translations = await response.json();
            console.log(`[LanguageService] ✓ Loaded ${lang} translations (${Object.keys(translations).length} keys)`);
            return translations;
          }
        } catch (e) {
          // Try next pattern
        }
      }
      
      console.error(`[LanguageService] ✗ All URL patterns failed for ${lang}`);
      return {};
    } catch (error) {
      console.error(`Error loading translation file for ${lang}:`, error);
      return {};
    }
  }

  /**
   * Save language preference to storage.
   * Only used on Web platform where there's no native settings integration.
   */
  private async saveLanguagePreference(lang: LanguageCode): Promise<void> {
    try {
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: lang,
      });
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  }

  /**
   * Detect system/browser language from platform APIs.
   */
  private getSystemLanguage(): string {
    if (typeof navigator !== 'undefined') {
      // Try navigator.languages first (most accurate), then navigator.language
      const lang = 
        (navigator as any).languages?.[0] ||
        (navigator as any).language ||
        '';
      
      return lang.toLowerCase().split('-')[0]; // e.g., 'pl-PL' -> 'pl'
    }
    return 'en';
  }

  /**
   * Detect native OS language on iOS using Bundle.main.preferredLocalizations.first.
   * This returns the app-specific language selected in iOS Settings → Apps → [App] → Language.
   */
  private async getNativeIOSLanguage(): Promise<string | null> {
    try {
      const lang = await this.settingsBridge.getLanguage();
      if (lang && this.isSupportedLanguageCode(lang)) {
        console.log(`[LanguageService] iOS native language detected: ${lang}`);
        return lang;
      }
    } catch (e) {
      console.warn('[LanguageService] Failed to get iOS native language:', e);
    }
    return null;
  }

  /**
   * Detect native OS language on Android.
   * Uses the native AndroidLanguageSettings plugin which reads from LocaleManager
   * on Android 13+ (per-app locale) or falls back to device-wide locale on older versions.
   */
  private async getNativeAndroidLanguage(): Promise<string | null> {
    try {
      const lang = await this.settingsBridge.getLanguage();
      if (lang && this.isSupportedLanguageCode(lang)) {
        console.log(`[LanguageService] Android native language detected: ${lang}`);
        return lang;
      }
    } catch (e) {
      console.warn('[LanguageService] Failed to get Android native language:', e);
    }
    // Fallback to navigator.language if plugin call fails
    const fallbackLang = this.getSystemLanguage();
    if (this.isSupportedLanguageCode(fallbackLang)) {
      return fallbackLang;
    }
    return null;
  }

  /**
   * Resolve the correct language based on platform and user preferences.
   * Returns a Promise that resolves to the detected language code.
   * 
   * Language precedence:
   * - Android 13+: Native per-app locale (LocaleManager) is authoritative
   * - iOS: Native app-specific language (Settings.bundle / preferredLocalizations) is authoritative
   * - Web: Saved preference → Browser language → English fallback
   */
  async resolveInitialLanguage(): Promise<LanguageCode> {
    // Platform-specific language detection
    if (this.isNativeIOS) {
      // iOS: Check native app-specific language first (Settings bundle / preferredLocalizations)
      const nativeLang = await this.getNativeIOSLanguage();
      if (nativeLang) {
        console.log(`[LanguageService] iOS detected native language: ${nativeLang}`);
        return nativeLang as LanguageCode;
      }
    } else if (this.isNativeAndroid) {
      // Android: Check native per-app locale first (LocaleManager on API 33+, Configuration fallback)
      const androidLang = await this.getNativeAndroidLanguage();
      if (androidLang) {
        console.log(`[LanguageService] Android detected native language: ${androidLang}`);
        return androidLang as LanguageCode;
      }
    } else {
      // Web: Check saved preference first, then browser language, then English
      const { value } = await Preferences.get({ key: this.STORAGE_KEY });
      if (value && this.isSupportedLanguageCode(value)) {
        console.log(`[LanguageService] Web detected saved language: ${value}`);
        return value as LanguageCode;
      }
      
      // Fall back to browser language
      const browserLang = this.getSystemLanguage();
      if (this.isSupportedLanguageCode(browserLang)) {
        console.log(`[LanguageService] Web detected browser language: ${browserLang}`);
        return browserLang as LanguageCode;
      }
    }

    // Ultimate fallback to English
    console.log('[LanguageService] Falling back to English');
    return 'en';
  }

  /**
   * Load and activate a language using ngx-translate.
   * This is the authoritative method for switching languages.
   */
  async loadAndActivateLanguage(lang: LanguageCode, translate: TranslateService): Promise<void> {
    console.log(`[LanguageService] Loading and activating ${lang}...`);
    
    // Load translation file
    const translations = await this.loadTranslationFile(lang);
    
    if (!translations || Object.keys(translations).length === 0) {
      console.error(`[LanguageService] Failed to load translations for ${lang}`);
      return;
    }
    
    // Set translations in ngx-translate (true = shouldMerge, false = don't merge, replace entirely)
    translate.setTranslation(lang, translations, false);
    
    // Activate the language - this triggers re-rendering of all TranslatePipe instances
    await firstValueFrom(translate.use(lang));
    
    // Update our state
    this._languageSubject.next(lang);
    this.currentLanguage.set(lang);
    
    console.log(`[LanguageService] ✓ Activated ${lang}`);
  }

  /**
   * Initialize the language service with TranslateService.
   * This is called by the app initializer to ensure translations are loaded before rendering.
   */
  async initialize(translate: TranslateService): Promise<void> {
    console.log('[LanguageService] Initializing...');
    
    // Resolve the correct initial language for this platform
    const initialLang = await this.resolveInitialLanguage();
    
    // Load and activate the translations
    await this.loadAndActivateLanguage(initialLang, translate);
    
    // Save to Preferences only on Web (so dropdown selection persists)
    // On native platforms, the native layer is authoritative — do NOT override it with Preferences
    if (this.isWeb) {
      await this.saveLanguagePreference(initialLang);
    }
    
    // Setup Android system language listener for runtime changes
    if (this.isNativeAndroid) {
      this.setupAndroidLanguageListener(translate);
    }
    
    console.log(`[LanguageService] ✓ Initialized with ${initialLang}`);
  }
  
  /**
   * Listen for Android system language changes.
   * When user changes language in Settings → Apps → weather-app → Language, 
   * the native layer dispatches a 'android:languageChanged' event which we catch here.
   */
  private setupAndroidLanguageListener(translate: TranslateService): void {
    this.ngZone.runOutsideAngular(() => {
      const handler = (event: any) => {
        console.log('[LanguageService] Android language change detected:', event.detail?.language);
        
        const newLang = event.detail?.language;
        if (newLang && this.isSupportedLanguageCode(newLang)) {
          // Run the language switch inside Angular zone to trigger UI updates
          this.ngZone.run(async () => {
            await this.loadAndActivateLanguage(newLang as LanguageCode, translate);
            console.log(`[LanguageService] ✓ Android system language changed to ${newLang}`);
          });
        }
      };
      
      window.addEventListener('android:languageChanged', handler);
      
      // Store for cleanup if needed
      (window as any).__androidLanguageHandler = handler;
    });
  }

  /**
   * Change the app language — public API for manual language switching.
   */
  async setLanguage(lang: LanguageCode, translate: TranslateService): Promise<void> {
    try {
      // Only switch if actually different
      if (this.currentLanguage() === lang) return;
      
      await this.loadAndActivateLanguage(lang, translate);
      
      // Save preference on Web platform only
      if (this.isWeb) {
        await this.saveLanguagePreference(lang);
      }
      
      // On iOS, also sync to native Settings.bundle so it shows in Settings app
      if (this.isNativeIOS) {
        try {
          await this.settingsBridge.setLanguage(lang);
          console.log(`[LanguageService] Synced language ${lang} to iOS Settings`);
        } catch (e) {
          console.warn('[LanguageService] Failed to sync to iOS Settings:', e);
        }
      }
      
      // On Android 13+, also set via native plugin for consistency
      if (this.isNativeAndroid) {
        try {
          await this.settingsBridge.setLanguage(lang);
          console.log(`[LanguageService] Synced language ${lang} to Android native settings`);
        } catch (e) {
          console.warn('[LanguageService] Failed to sync to Android native settings:', e);
        }
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }

  /**
   * Get the current language as a string value
   */
  getLanguage(): LanguageCode {
    return this.currentLanguage();
  }

  /**
   * Subscribe to language changes using RxJS Observable
   * @param callback - Function to call when language changes
   * @returns Unsubscribe function
   */
  subscribeToLanguageChanges(callback: (lang: LanguageCode) => void): () => void {
    const subscription = this.languageChanged$.subscribe(callback);
    return () => subscription.unsubscribe();
  }

  /**
   * Get display name for a language (e.g. "🇵🇱 Polski")
   */
  getLanguageDisplayName(code: LanguageCode): string {
    const lang = this.availableLanguages.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.nativeName}` : code.toUpperCase();
  }

  /**
   * Get all available languages for the selector
   */
  getLanguages(): LanguageOption[] {
    return this.availableLanguages;
  }
  
  /**
   * Check if in-app language selection should be shown.
   * On Android 13+ (API 33+), users manage language through system settings,
   * so the in-app selector is hidden. On iOS and Web, it remains visible.
   */
  showLanguageSelector(): boolean {
    // Hide on Android 13+ where per-app language is managed via system settings
    if (this.isNativeAndroid) {
      return false;
    }
    // Show on iOS (Settings.bundle integration)
    // Show on Web (Preferences-based persistence)
    return true;
  }
  
}
