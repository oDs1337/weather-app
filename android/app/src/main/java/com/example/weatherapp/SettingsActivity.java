package com.example.weatherapp;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.LocaleList;
import android.preference.ListPreference;
import android.preference.Preference;
import android.preference.PreferenceActivity;
import android.preference.PreferenceManager;
import android.util.Log;

import java.util.Locale;

/**
 * Settings Activity for Android (fallback for API < 33).
 * 
 * Provides native app settings including language selection.
 * This activity is only relevant on Android 12 and below where per-app
 * language settings are not natively supported by the OS.
 * On Android 13+, users should use Settings → Apps → weather-app → Language instead.
 */
public class SettingsActivity extends PreferenceActivity implements Preference.OnPreferenceChangeListener {

    private static final String TAG = "SettingsActivity";
    private static final String KEY_LANGUAGE = "app_language";
    
    // Supported languages matching the Angular app
    private static final String[] LANGUAGE_CODES = {"en", "pl", "fr", "ru", "uk"};
    private static final String[] LANGUAGE_NAMES = {
        "English (English)",
        "Polski (Polish)",
        "Français (French)",
        "Русский (Russian)",
        "Українська (Ukrainian)"
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Load preferences from XML
        addPreferencesFromResource(R.xml.app_settings);
        
        // Setup language preference
        ListPreference languagePref = (ListPreference) findPreference(KEY_LANGUAGE);
        if (languagePref != null) {
            languagePref.setEntries(LANGUAGE_NAMES);
            languagePref.setEntryValues(LANGUAGE_CODES);
            
            // Set current value from saved preferences or system locale
            String currentLang = getCurrentLanguage();
            languagePref.setValue(currentLang);
            languagePref.setOnPreferenceChangeListener(this);
        }
    }

    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        if (KEY_LANGUAGE.equals(preference.getKey())) {
            String newLang = (String) newValue;
            
            // Validate the language code
            if (!isSupportedLanguage(newLang)) {
                Log.w(TAG, "Unsupported language: " + newLang);
                return false;
            }
            
            // Save to SharedPreferences
            PreferenceManager.getDefaultSharedPreferences(this)
                .edit()
                .putString(KEY_LANGUAGE, newLang)
                .apply();
            
            // Update app locale
            updateLocale(newLang);
            
            Log.i(TAG, "Language changed to: " + newLang);
            return true;
        }
        return false;
    }

    /**
     * Get the current language from SharedPreferences or system default.
     */
    private String getCurrentLanguage() {
        // First check saved preference
        String savedLang = PreferenceManager.getDefaultSharedPreferences(this)
            .getString(KEY_LANGUAGE, null);
        
        if (savedLang != null && isSupportedLanguage(savedLang)) {
            return savedLang;
        }
        
        // Fall back to system locale
        Locale systemLocale = getSystemLocale();
        String sysLang = systemLocale.getLanguage().toLowerCase(Locale.ROOT);
        
        if (isSupportedLanguage(sysLang)) {
            return sysLang;
        }
        
        return "en"; // Default fallback
    }

    /**
     * Get the current system locale, handling API level differences.
     */
    private Locale getSystemLocale() {
        android.content.res.Configuration config = getResources().getConfiguration();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            return config.getLocales().get(0);
        } else {
            return config.locale;
        }
    }

    /**
     * Update the app locale and restart MainActivity to apply changes.
     */
    private void updateLocale(String langCode) {
        Locale locale = new Locale(langCode);
        Locale.setDefault(locale);
        
        android.content.res.Configuration config = getResources().getConfiguration();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            config.setLocales(new LocaleList(locale));
        } else {
            config.locale = locale;
        }
        
        getResources().updateConfiguration(config, getResources().getDisplayMetrics());
        
        // Restart MainActivity to apply the new locale
        Intent intent = getIntent();
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    /**
     * Check if a language code is supported.
     */
    private boolean isSupportedLanguage(String lang) {
        for (String code : LANGUAGE_CODES) {
            if (code.equals(lang)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get the current language from SharedPreferences.
     */
    public String getSavedLanguage() {
        return PreferenceManager.getDefaultSharedPreferences(this)
            .getString(KEY_LANGUAGE, "en");
    }

    /**
     * Set the language preference programmatically (for plugin calls).
     */
    public void setLanguage(String langCode) {
        if (!isSupportedLanguage(langCode)) {
            Log.w(TAG, "Cannot set unsupported language: " + langCode);
            return;
        }
        
        PreferenceManager.getDefaultSharedPreferences(this)
            .edit()
            .putString(KEY_LANGUAGE, langCode)
            .apply();
        
        updateLocale(langCode);
    }

    /**
     * Get the current language (for plugin calls).
     */
    public String getLanguage() {
        return getCurrentLanguage();
    }
}
