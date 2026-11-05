import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type LanguageCode = 'en' | 'pl' | 'fr';

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
  
  currentLanguage = signal<LanguageCode>('en');
  availableLanguages: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
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

    this._initPromise = new Promise((resolve, reject) => {
      // Pre-load English translations as the default/fallback language
      this.loadTranslationFile('en').then((enTranslations) => {
        translate.setTranslation('en', enTranslations);
        translate.setDefaultLang('en');
        translate.use('en').subscribe({
          next: () => resolve(),
          error: (err: unknown) => reject(err),
        });
      }).catch(reject);
    });

    return this._initPromise;
  }

  /**
   * Public method to load saved language preference — call from ngOnInit or app bootstrap
   */
  async loadSavedLanguage(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEY });
      if (value && this.isSupportedLanguage(value)) {
        await this.setLanguage(value as LanguageCode);
      } else {
        // No saved preference, detect system language first
        await this.detectAndSetSystemLanguage();
      }
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
      await this.setLanguage(systemLang as LanguageCode);
    } else {
      // Fallback to English
      if (this._translate) {
        this._translate.use('en').subscribe();
      }
      this.currentLanguage.set('en');
    }
  }

  /**
   * Get the current language as a string value
   */
  getLanguage(): LanguageCode {
    return this.currentLanguage();
  }

  /**
   * Change the app language
   */
  async setLanguage(lang: LanguageCode): Promise<void> {
    try {
      // Load translation file if not already loaded
      const translations = await this.loadTranslationFile(lang);
      if (this._translate) {
        this._translate.setTranslation(lang, translations);
        this._translate.use(lang).subscribe();
      }
      this.currentLanguage.set(lang);
      // Save preference after successful language change
      await this.saveLanguagePreference(lang);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }

  /**
   * Load translation file from assets
   */
  private async loadTranslationFile(lang: LanguageCode): Promise<Record<string, any>> {
    try {
      // Use absolute path based on current origin to avoid relative URL issues across routes
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/assets/i18n/${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load ${lang} translations`);
      return await response.json();
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
   * Check if a language code is supported
   */
  private isSupportedLanguage(lang: string): boolean {
    return this.availableLanguages.some(l => l.code === lang);
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
   
 

