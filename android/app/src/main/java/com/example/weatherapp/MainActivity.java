package com.example.weatherapp;

import android.app.LocaleManager;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.os.LocaleList;
import android.util.Log;

import androidx.annotation.NonNull;

import com.getcapacitor.BridgeActivity;

import java.util.Locale;
import java.util.Objects;

/**
 * MainActivity for the Weather App.
 * 
 * Handles Android per-app language selection:
 * - On Android 13+ (API 33+): Uses LocaleManager to read app-specific locale from system settings.
 *   The app appears in Settings → Apps → weather-app → Language.
 * - On Android 12 and below (API < 33): Falls back to device-wide locale via Configuration.
 * 
 * When the user changes language in Android system settings, the activity is recreated
 * with the new locale. This class detects the change and notifies the Angular app.
 */
public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";
    
    // Supported languages matching the Angular app's translation files
    private static final String[] SUPPORTED_LANGUAGES = {"en", "pl", "fr", "ru", "uk"};
    
    private String lastDetectedLanguage = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.d(TAG, "onCreate - initializing language detection");
        
        // Capacitor automatically loads plugins via PluginManager in BridgeActivity
        // Detect and store initial language after bridge is ready
        String initialLanguage = getEffectiveAppLocale();
        lastDetectedLanguage = initialLanguage;
        
        Log.d(TAG, "Initial app locale detected: " + initialLanguage);
    }

    /**
     * Called when the system configuration changes (e.g., language change in Settings).
     * On Android 13+, changing per-app language triggers this callback.
     */
    @Override
    public void onConfigurationChanged(@NonNull Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        
        Log.d(TAG, "onConfigurationChanged - detecting locale change");
        
        // Get the current effective app locale
        String newLanguage = getEffectiveAppLocale();
        
        // Check if language actually changed
        if (newLanguage != null && !Objects.equals(newLanguage, lastDetectedLanguage)) {
            lastDetectedLanguage = newLanguage;
            
            Log.d(TAG, "Language changed to: " + newLanguage);
            
            // Notify Angular app about the language change via JavaScript bridge
            notifyLanguageChange(newLanguage);
        }
    }

    /**
     * Get the effective application locale.
     * 
     * On Android 13+ (API 33+): Uses LocaleManager to read the per-app locale
     * set in Settings → Apps → weather-app → Language.
     * 
     * On Android 12 and below: Falls back to the device-wide locale from Configuration.
     */
    private String getEffectiveAppLocale() {
        try {
            Locale appLocale;
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // API 33+: Use LocaleManager for per-app language settings
                LocaleManager localeManager = (LocaleManager) getSystemService(LocaleManager.class);
                LocaleList appLocales = localeManager.getApplicationLocales();
                
                // getFirst() was added in API 35; use get(0) for API 33-34 compatibility
                appLocale = appLocales.isEmpty() ? null : appLocales.get(0);
            } else {
                // API < 33: Fall back to device-wide locale from Configuration
                appLocale = getResources().getConfiguration().getLocales().get(0);
            }
            
            if (appLocale != null) {
                String lang = appLocale.getLanguage().toLowerCase(Locale.ROOT);
                
                // Validate against supported languages
                for (String supported : SUPPORTED_LANGUAGES) {
                    if (supported.equals(lang)) {
                        return lang;
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting app locale", e);
        }
        
        // Ultimate fallback to English
        Log.w(TAG, "Falling back to default language: en");
        return "en";
    }

    /**
     * Notify the Angular app about a language change via JavaScript bridge.
     * This triggers ngx-translate to reload with the new locale.
     */
    private void notifyLanguageChange(String language) {
        // Execute JavaScript to dispatch a custom event
        String js = "window.dispatchEvent(new CustomEvent('android:languageChanged', {" +
                    "detail: {'language': '" + language + "'}}));";
        
        if (getBridge() != null && getBridge().getWebView() != null) {
            Log.d(TAG, "Notifying Angular of language change: " + language);
            getBridge().getWebView().evaluateJavascript(js, null);
        } else {
            Log.w(TAG, "WebView not available for language notification");
        }
    }
}
