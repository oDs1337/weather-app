import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, inject, signal } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { TranslateService, TranslationObject } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

export type LanguageCode = 'en' | 'pl' | 'fr' | 'ru' | 'uk';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

interface AndroidLanguagePlugin {
  getLanguage(): Promise<{ language: string }>;
  setLanguage(options: { language: string }): Promise<{ language: string }>;
}

const AndroidLanguageSettings = registerPlugin<AndroidLanguagePlugin>('AndroidLanguageSettings');

const AVAILABLE_LANGUAGES: readonly LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
];

const STORAGE_KEY = 'app-language';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly http = inject(HttpClient);
  private readonly translate = inject(TranslateService);
  private readonly ngZone = inject(NgZone);

  private readonly isNative = Capacitor.isNativePlatform();
  private readonly platform = Capacitor.getPlatform();
  private listenersAttached = false;

  readonly currentLanguage = signal<LanguageCode>('en');
  readonly availableLanguages = AVAILABLE_LANGUAGES;

  async initialize(): Promise<void> {
    const initialLang = await this.resolveInitialLanguage();
    await this.loadAndActivateLanguage(initialLang);

    if (!this.isNative) {
      await this.saveWebPreference(initialLang);
    } else {
      this.attachNativeListeners();
    }
  }

  async setLanguage(lang: LanguageCode): Promise<void> {
    if (this.currentLanguage() === lang) return;

    await this.loadAndActivateLanguage(lang);

    if (!this.isNative) {
      await this.saveWebPreference(lang);
    } else if (this.platform === 'android') {
      try {
        await AndroidLanguageSettings.setLanguage({ language: lang });
      } catch {
        // Ignore if native plugin is unavailable
      }
    }
  }

  getLanguage(): LanguageCode {
    return this.currentLanguage();
  }

  getLanguageDisplayName(code: LanguageCode): string {
    const lang = AVAILABLE_LANGUAGES.find((l) => l.code === code);
    return lang ? `${lang.flag} ${lang.nativeName}` : code.toUpperCase();
  }

  getLanguages(): readonly LanguageOption[] {
    return AVAILABLE_LANGUAGES;
  }

  showLanguageSelector(): boolean {
    return !this.isNative;
  }

  private isSupported(code: string | null | undefined): code is LanguageCode {
    return !!code && AVAILABLE_LANGUAGES.some((l) => l.code === code);
  }

  private normalizeLocale(locale: string): string {
    return locale.split(/[-_]/)[0].toLowerCase();
  }

  private getBrowserLanguage(): LanguageCode | null {
    if (typeof navigator === 'undefined') return null;
    const raw = navigator.languages?.[0] || navigator.language || '';
    const normalized = this.normalizeLocale(raw);
    return this.isSupported(normalized) ? normalized : null;
  }

  private async resolveInitialLanguage(): Promise<LanguageCode> {
    if (this.isNative) {
      if (this.platform === 'android') {
        try {
          const { language } = await AndroidLanguageSettings.getLanguage();
          const normalized = this.normalizeLocale(language);
          if (this.isSupported(normalized)) {
            return normalized;
          }
        } catch {
          // Fall through to navigator.language
        }
      }

      return this.getBrowserLanguage() ?? 'en';
    }

    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (this.isSupported(value)) {
        return value;
      }
    } catch {
      // Fall through to browser language
    }

    return this.getBrowserLanguage() ?? 'en';
  }

  private async loadAndActivateLanguage(lang: LanguageCode): Promise<void> {
    try {
      const translations = await firstValueFrom(
        this.http.get<TranslationObject>(`assets/i18n/${lang}.json`)
      );
      this.translate.setTranslation(lang, translations, false);
      await firstValueFrom(this.translate.use(lang));
      this.currentLanguage.set(lang);
    } catch (error) {
      console.error(`Failed to load translations for "${lang}":`, error);
    }
  }

  private async saveWebPreference(lang: LanguageCode): Promise<void> {
    try {
      await Preferences.set({ key: STORAGE_KEY, value: lang });
    } catch {
      // Non-fatal on web
    }
  }

  private attachNativeListeners(): void {
    if (this.listenersAttached || typeof window === 'undefined') return;
    this.listenersAttached = true;

    this.ngZone.runOutsideAngular(() => {
      if (this.platform === 'android') {
        window.addEventListener('android:languageChanged', (event: Event) => {
          const newLang = (event as CustomEvent<{ language?: string }>).detail?.language;
          if (this.isSupported(newLang) && newLang !== this.currentLanguage()) {
            this.ngZone.run(() => void this.loadAndActivateLanguage(newLang));
          }
        });
      }

      if (this.platform === 'ios') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState !== 'visible') return;
          const systemLang = this.getBrowserLanguage();
          if (systemLang && systemLang !== this.currentLanguage()) {
            this.ngZone.run(() => void this.loadAndActivateLanguage(systemLang));
          }
        });
      }
    });
  }
}
