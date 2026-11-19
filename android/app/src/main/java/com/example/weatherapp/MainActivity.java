package com.example.weatherapp;

import android.app.LocaleManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.LocaleList;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

import java.util.Locale;
import java.util.Objects;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";
    private static final String[] SUPPORTED_LANGUAGES = {"en", "pl", "fr", "ru", "uk"};

    private String lastDetectedLanguage;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(AndroidLanguageSettings.class);
        super.onCreate(savedInstanceState);

        lastDetectedLanguage = getEffectiveAppLocale();
        setupEdgeToEdge();
    }

    private void setupEdgeToEdge() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        WindowInsetsControllerCompat controller =
                new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(false);
        controller.setAppearanceLightNavigationBars(false);

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            getWindow().setStatusBarColor(Color.TRANSPARENT);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getWindow().setNavigationBarColor(Color.TRANSPARENT);
            }
        }
    }

    @Override
    public void onConfigurationChanged(@NonNull Configuration newConfig) {
        super.onConfigurationChanged(newConfig);

        String newLanguage = getEffectiveAppLocale();
        if (!Objects.equals(newLanguage, lastDetectedLanguage)) {
            lastDetectedLanguage = newLanguage;
            notifyLanguageChange(newLanguage);
        }
    }

    private String getEffectiveAppLocale() {
        try {
            Locale appLocale;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                LocaleManager localeManager = getSystemService(LocaleManager.class);
                LocaleList appLocales = localeManager != null ? localeManager.getApplicationLocales() : LocaleList.getEmptyLocaleList();
                appLocale = appLocales.isEmpty() ? null : appLocales.get(0);
            } else {
                appLocale = getResources().getConfiguration().getLocales().get(0);
            }

            if (appLocale != null) {
                String lang = appLocale.getLanguage().toLowerCase(Locale.ROOT);
                for (String supported : SUPPORTED_LANGUAGES) {
                    if (supported.equals(lang)) {
                        return lang;
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting app locale", e);
        }

        return "en";
    }

    private void notifyLanguageChange(String language) {
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }

        String js = "window.dispatchEvent(new CustomEvent('android:languageChanged', {" +
                "detail: {'language': '" + language + "'}}));";
        getBridge().getWebView().evaluateJavascript(js, null);
    }
}
