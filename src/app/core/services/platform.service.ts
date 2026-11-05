import { Injectable } from '@angular/core';

/**
 * Detects if the app is running inside Capacitor (native) or in a browser/web environment.
 */
@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  private _isNative: boolean | null = null;
  private _platform: 'android' | 'ios' | 'web' | null = null;

  get isNative(): boolean {
    if (this._isNative === null) {
      this._isNative = this.detectNative();
    }
    return this._isNative;
  }

  get platform(): 'android' | 'ios' | 'web' {
    if (!this._platform) {
      const detected = this.detectPlatform();
      this._platform = detected;
    }
    return this._platform;
  }

  private detectNative(): boolean {
    // Check for Capacitor global
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      return true;
    }
    // Check for native bridge indicators
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    return /android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent);
  }

  private detectPlatform(): 'android' | 'ios' | 'web' {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const platform = (window as any).Capacitor.getPlatform();
      return platform === 'android' ? 'android' : platform === 'ios' ? 'ios' : 'web';
    }

    // Fallback to user agent detection for web
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/android/i.test(userAgent)) return 'android';
    if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios';
    return 'web';
  }

  /**
   * Returns the Capacitor instance if running in native, null otherwise.
   */
  get capacitor(): any {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      return (window as any).Capacitor;
    }
    return null;
  }
}
