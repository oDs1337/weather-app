package com.example.weatherapp;

import android.content.res.Configuration;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity for the Weather App.
 * Handles Android system language changes by detecting locale changes
 * and notifying the Angular app via JavaScript bridge.
 */
public class MainActivity extends BridgeActivity {
    
    private String lastDetectedLanguage = null;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Capacitor automatically loads plugins via PluginManager in BridgeActivity
        // Detect and store initial language after bridge is ready
        lastDetectedLanguage = getCurrentLocaleLanguage();
    }
    
    /**
     * Called when the system configuration changes (e.g., language change in Settings).
     * Detects locale changes and notifies the Angular app.
     */
    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        
        // Get the current locale from the configuration
        String newLanguage = getCurrentLocaleLanguage();
        
        // Check if language actually changed
        if (newLanguage != null && !newLanguage.equals(lastDetectedLanguage)) {
            lastDetectedLanguage = newLanguage;
            
            // Notify Angular app about the language change
            notifyLanguageChange(newLanguage);
        }
    }
    
    /**
     * Extract the language code from the current device locale.
     * Handles both old and new Android API levels for locale retrieval.
     */
    private String getCurrentLocaleLanguage() {
        Configuration config = getResources().getConfiguration();
        java.util.Locale locale;
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
            // API 24+: Use getLocales()
            locale = config.getLocales().get(0);
        } else {
            // API < 24: Use locale field directly
            locale = config.locale;
        }
        
        if (locale != null) {
            String lang = locale.getLanguage();
            return lang.toLowerCase();
        }
        
        return "en";
    }
    
    /**
     * Notify the Angular app about a language change via JavaScript.
     * This triggers the app to reload translations with the new language.
     */
    private void notifyLanguageChange(String language) {
        // Only notify for supported languages
        String[] supportedLanguages = {"en", "pl", "fr", "ru", "uk"};
        boolean isSupported = false;
        for (String lang : supportedLanguages) {
            if (lang.equals(language)) {
                isSupported = true;
                break;
            }
        }
        
        if (!isSupported) {
            return;
        }
        
        // Execute JavaScript to notify the Angular app
        String js = "window.dispatchEvent(new CustomEvent('android:languageChanged', {detail: {'language': '" + language + "'}}));";
        
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript(js, null);
        }
    }
}
