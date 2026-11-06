import { Injectable, signal, inject } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { BehaviorSubject, Observable, firstValueFrom, take, filter } from 'rxjs';
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
  private isNativeIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
  
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
   * Lazy getter for TranslateService to avoid circular dependency issues
   */
  private get _translate(): any {
    // This will be set by App component after initialization
    return (this as any).__translateService;
  }

  private set _translate(service: any) {
    (this as any).__translateService = service;
  }

  /**
   * Check if the given language code is supported
   */
  private isSupportedLanguageCode(lang: string): boolean {
    return this.availableLanguages.some(l => l.code === lang);
  }

  /**
   * Load translations for a language and activate it.
   * Uses RxJS to ensure proper sequencing of async operations.
   */
  private async switchToLanguage(lang: LanguageCode, isNativeChange = false): Promise<void> {
    console.log(`[LanguageService] Switching to ${lang} (native change: ${isNativeChange})`);
    
    // Step 1: Load translation file
    const translations = await this.loadTranslationFile(lang);
    
    if (!translations || Object.keys(translations).length === 0) {
      console.error(`[LanguageService] Failed to load translations for ${lang}`);
      return;
    }
    
    // Step 2: Set translations in translate service
    if (this._translate) {
      this._translate.setTranslation(lang, translations, { override: true });
      
      // Step 3: Activate the language - wait for it to complete
      await firstValueFrom(this._translate.use(lang));
    }
    
    // Step 4: Update BehaviorSubject AND signal atomically
    this._languageSubject.next(lang);
    this.currentLanguage.set(lang);
    
    console.log(`[LanguageService] Language switched to ${lang}`);
    
    // Step 5: Save preference after successful change
    await this.saveLanguagePreference(lang);
    
    // Step 6: On iOS, also sync to native Settings.bundle so it shows in Settings app
    if (this.isNativeIOS && !isNativeChange) {
      try {
        await this.settingsBridge.setLanguage(lang);
        console.log(`[LanguageService] Synced language ${lang} to iOS Settings`);
      } catch (e) {
        console.warn('[LanguageService] Failed to sync to iOS Settings:', e);
      }
    }
  }

  private _initPromise: Promise<void> | null = null;

  /**
   * Initialize the service with TranslateService instance
   */
  async initialize(translate: any): Promise<void> {
    this._translate = translate;
    
    // If already initializing, return existing promise to avoid race conditions
    if (this._initPromise) {
      return this._initPromise;
    }

    this._initPromise = new Promise(async (resolve, reject) => {
      try {
        console.log('[LanguageService] Starting initialization...');
        
        // Pre-load English translations as the default/fallback language
        const enTranslations = await this.loadTranslationFile('en');
        
        if (!enTranslations || Object.keys(enTranslations).length === 0) {
          console.error('[LanguageService] Failed to load English translations - empty or null');
          reject(new Error('Failed to load English translations'));
          return;
        }
        
        console.log(`[LanguageService] Loaded ${Object.keys(enTranslations).length} translation keys for English`);
        
        // Set translations BEFORE calling use()
        translate.setTranslation('en', enTranslations, { override: true });
        translate.setDefaultLang('en');
        
        console.log('[LanguageService] Translations set, activating English...');
        
        // Activate English — wait for it to complete
        await firstValueFrom(translate.use('en'));
        
        console.log('[LanguageService] English activated successfully');
        resolve();
      } catch (err) {
        console.error('[LanguageService] Initialization failed:', err);
        reject(err);
      }
    });

    return this._initPromise;
  }

  /**
   * Public method to load saved language preference — call from ngOnInit or app bootstrap
   */
  async loadSavedLanguage(): Promise<void> {
    try {
      // On iOS, check native Settings.bundle first (user may have set it in Settings app)
      if (this.isNativeIOS) {
        const nativeLang = await this.settingsBridge.getLanguage();
        if (nativeLang && this.isSupportedLanguageCode(nativeLang)) {
          console.log(`[LanguageService] Using language from iOS Settings: ${nativeLang}`);
          // Save to Preferences so we remember the choice
          await Preferences.set({ key: this.STORAGE_KEY, value: nativeLang });
          if (this.currentLanguage() !== nativeLang) {
            await this.switchToLanguage(nativeLang as LanguageCode, true);
          }
          return;
        }
      }

      // Check local storage preference FIRST — user's in-app choice takes priority
      const { value } = await Preferences.get({ key: this.STORAGE_KEY });
      if (value && this.isSupportedLanguageCode(value)) {
        console.log(`[LanguageService] Using saved language from Preferences: ${value}`);
        // Only switch if different from current language to avoid unnecessary reloads
        if (this.currentLanguage() !== value) {
          await this.switchToLanguage(value as LanguageCode, false);
        }
        return;
      }

      // No saved preference, detect system language first
      console.log('[LanguageService] No saved preference, detecting system language');
      await this.detectAndSetSystemLanguage();
    } catch (error) {
      console.warn('No saved language preference found', error);
      // Fallback to system language
      await this.detectAndSetSystemLanguage();
    }
  }

  /**
   * Detect system language and set it if no manual override exists
   */
  private async detectAndSetSystemLanguage(): Promise<void> {
    const systemLang = this.getSystemLanguage();
    
    if (this.availableLanguages.some(l => l.code === systemLang)) {
      await this.switchToLanguage(systemLang as LanguageCode, false);
    } else {
      // Fallback to English — ensure it's fully loaded before setting signal
      if (!this.currentLanguage() || this.currentLanguage() !== 'en') {
        const enTranslations = await this.loadTranslationFile('en');
        if (this._translate) {
          this._translate.setTranslation('en', enTranslations, { override: true });
          await firstValueFrom(this._translate.use('en'));
        }
        this.currentLanguage.set('en');
      }
    }
  }

  /**
   * Start listening for language changes from iOS Settings.
   * Uses RxJS timer to poll UserDefaults periodically.
   */
  private pollingInterval: any;

  async startListeningForNativeChanges(): Promise<void> {
    if (!this.isNativeIOS) return;

    console.log('[LanguageService] Starting native language change listener');
    
    // Poll every 2 seconds to detect Settings.bundle changes
    this.pollingInterval = setInterval(async () => {
      try {
        const nativeLang = await this.settingsBridge.getLanguage();
        if (nativeLang && nativeLang !== this.currentLanguage()) {
          console.log(`[LanguageService] Detected native language change: ${this.currentLanguage()} → ${nativeLang}`);
          await Preferences.set({ key: this.STORAGE_KEY, value: nativeLang });
          // Mark as native change to avoid syncing back
          await this.switchToLanguage(nativeLang as LanguageCode, true);
        }
      } catch (e) {
        console.warn('[LanguageService] Error polling for language changes:', e);
      }
    }, 2000);
  }

  /**
   * Stop the native language change listener.
   */
  stopListeningForNativeChanges(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('[LanguageService] Stopped native language change listener');
    }
  }

  /**
   * Change the app language — public API for manual language switching
   */
  async setLanguage(lang: LanguageCode): Promise<void> {
    try {
      // Only switch if actually different
      if (this.currentLanguage() === lang) return;
      
      await this.switchToLanguage(lang, false);
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
   * Load translation file from assets
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
      
      console.log(`[LanguageService] Current window.location: ${window.location.href}`);
      
      for (const url of urlPatterns) {
        try {
          console.log(`[LanguageService] Trying URL: ${url}`);
          const response = await fetch(url);
          console.log(`[LanguageService] Response status: ${response.status} ${response.statusText}`);
          
          if (response.ok) {
            const translations = await response.json();
            console.log(`[LanguageService] ✓ Successfully loaded ${lang} translations (${Object.keys(translations).length} keys)`);
            return translations;
          } else {
            console.warn(`[LanguageService] ✗ HTTP error from ${url}: ${response.status}`);
          }
        } catch (e) {
          console.warn(`[LanguageService] ✗ Fetch failed for ${url}:`, (e as Error).message);
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
   * Save language preference to storage
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
   * Detect system language from browser/device settings
   */
  private getSystemLanguage(): string {
    if (typeof navigator !== 'undefined') {
      const lang = 
        (navigator as any).language ||
        (navigator as any).userLanguage ||
        (navigator as any).browserLanguage ||
        '';
      
      return lang.toLowerCase().split('-')[0]; // e.g., 'pl-PL' -> 'pl'
    }
    return 'en';
  }
  
}
