package com.example.weatherapp;

import android.app.LocaleManager;
import android.content.Intent;
import android.os.Build;
import android.os.LocaleList;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Locale;

/**
 * Android Language Settings Plugin.
 * 
 * Provides native language settings access for the Weather App on Android.
 * 
 * On Android 13+ (API 33+):
 * - Reads app-specific locale via LocaleManager.getApplicationLocales()
 *   (the language selected in Settings → Apps → weather-app → Language)
 * - Sets app-specific locale via LocaleManager.setApplicationLocales()
 * 
 * On Android 12 and below (API < 33):
 * - Falls back to SharedPreferences + Configuration manipulation
 *   since per-app language settings are not available.
 */
@CapacitorPlugin(name = "AndroidLanguageSettings")
public class AndroidLanguageSettings extends Plugin {

    private static final String TAG = "AndroidLangSettings";
    
    // Supported languages matching the Angular app's translation files
    private static final String[] SUPPORTED_LANGUAGES = {"en", "pl", "fr", "ru", "uk"};

    @Override
    public void load() {
        super.load();
        Log.d(TAG, "AndroidLanguageSettings plugin loaded");
    }

    /**
     * Get the current app language.
     * 
     * On Android 13+: Reads from LocaleManager (per-app locale setting).
     * On Android 12 and below: Falls back to device-wide locale.
     */
    @PluginMethod
    public void getLanguage(PluginCall call) {
        try {
            String lang = getCurrentLanguage();
            JSObject result = new JSObject();
            result.put("language", lang);
            call.resolve(result);
            Log.d(TAG, "getLanguage: " + lang);
        } catch (Exception e) {
            call.reject("Failed to get language: " + e.getMessage());
            Log.e(TAG, "Error getting language", e);
        }
    }

    /**
     * Set the app language.
     * 
     * On Android 13+: Uses LocaleManager.setApplicationLocales() for per-app locale.
     * On Android 12 and below: Falls back to SharedPreferences + Configuration update.
     */
    @PluginMethod
    public void setLanguage(PluginCall call) {
        try {
            String lang = call.getString("language");
            
            if (lang == null || !isSupportedLanguage(lang)) {
                call.reject("Invalid or unsupported language: " + lang);
                return;
            }
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // API 33+: Use LocaleManager for per-app locale setting
                setLocaleViaLocaleManager(lang);
            } else {
                // API < 33: Fall back to SharedPreferences + Configuration update
                setLocaleViaSharedPreferences(lang);
            }
            
            JSObject result = new JSObject();
            result.put("language", lang);
            call.resolve(result);
            Log.d(TAG, "setLanguage: " + lang);
        } catch (Exception e) {
            call.reject("Failed to set language: " + e.getMessage());
            Log.e(TAG, "Error setting language", e);
        }
    }

    /**
     * Launch the SettingsActivity for the user to change settings.
     * Only available on Android 12 and below where per-app language is not natively supported.
     */
    @PluginMethod
    public void openSettings(PluginCall call) {
        try {
            Intent intent = new Intent(getActivity(), SettingsActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(intent);
            call.resolve();
            Log.d(TAG, "openSettings: launched");
        } catch (Exception e) {
            call.reject("Failed to open settings: " + e.getMessage());
            Log.e(TAG, "Error opening settings", e);
        }
    }

    /**
     * Get the current language from LocaleManager (API 33+) or device-wide locale.
     */
    private String getCurrentLanguage() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // API 33+: Read per-app locale from LocaleManager
                LocaleManager localeManager = (LocaleManager) getActivity().getSystemService(LocaleManager.class);
                LocaleList appLocales = localeManager.getApplicationLocales();
                
                // getFirst() was added in API 35; use get(0) for API 33-34 compatibility
                Locale appLocale = appLocales.isEmpty() ? null : appLocales.get(0);
                
                if (appLocale != null) {
                    String lang = appLocale.getLanguage().toLowerCase(Locale.ROOT);
                    if (isSupportedLanguage(lang)) {
                        return lang;
                    }
                }
            } else {
                // API < 33: Fall back to device-wide locale from Configuration
                Locale systemLocale = getActivity().getResources()
                    .getConfiguration()
                    .getLocales()
                    .get(0);
                
                String sysLang = systemLocale.getLanguage().toLowerCase(Locale.ROOT);
                if (isSupportedLanguage(sysLang)) {
                    return sysLang;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting current language", e);
        }
        
        // Ultimate fallback to English
        return "en";
    }

    /**
     * Set the per-app locale using LocaleManager (API 33+ only).
     */
    private void setLocaleViaLocaleManager(String langCode) {
        try {
            LocaleManager localeManager = (LocaleManager) getActivity().getSystemService(LocaleManager.class);
            Locale locale = new Locale(langCode);
            
            // Create a LocaleList with the selected language as the only locale
            LocaleList localeList = new LocaleList(locale);
            
            // Set the per-app locale - this updates Settings → Apps → weather-app → Language
            localeManager.setApplicationLocales(localeList);
            
            Log.d(TAG, "setLocaleViaLocaleManager: " + langCode);
        } catch (Exception e) {
            Log.e(TAG, "Failed to set locale via LocaleManager", e);
            throw e;
        }
    }

    /**
     * Set the locale using SharedPreferences and Configuration update.
     * This is a fallback for Android 12 and below where per-app language settings are not available.
     */
    private void setLocaleViaSharedPreferences(String langCode) {
        try {
            // Save to SharedPreferences as backup
            getActivity().getSharedPreferences("app_settings", android.content.Context.MODE_PRIVATE)
                .edit()
                .putString("app_language", langCode)
                .apply();
            
            // Update Configuration directly (works for this app session only on older Android)
            Locale locale = new Locale(langCode);
            Locale.setDefault(locale);
            
            android.content.res.Configuration config = getActivity().getResources().getConfiguration();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                config.setLocales(new LocaleList(locale));
            } else {
                config.locale = locale;
            }
            
            getActivity().getResources().updateConfiguration(
                config, 
                getActivity().getResources().getDisplayMetrics()
            );
            
            Log.d(TAG, "setLocaleViaSharedPreferences: " + langCode);
        } catch (Exception e) {
            Log.e(TAG, "Failed to set locale via SharedPreferences", e);
            throw e;
        }
    }

    /**
     * Check if a language code is supported.
     */
    private boolean isSupportedLanguage(String lang) {
        for (String code : SUPPORTED_LANGUAGES) {
            if (code.equals(lang)) {
                return true;
            }
        }
        return false;
    }
}
