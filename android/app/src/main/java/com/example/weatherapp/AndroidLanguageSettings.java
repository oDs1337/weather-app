package com.example.weatherapp;

import android.app.LocaleManager;
import android.content.Context;
import android.os.Build;
import android.os.LocaleList;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Locale;

@CapacitorPlugin(name = "AndroidLanguageSettings")
public class AndroidLanguageSettings extends Plugin {

    private static final String TAG = "AndroidLangSettings";
    private static final String PREFS_NAME = "app_settings";
    private static final String KEY_LANGUAGE = "app_language";
    private static final String[] SUPPORTED_LANGUAGES = {"en", "pl", "fr", "ru", "uk"};

    @PluginMethod
    public void getLanguage(PluginCall call) {
        JSObject result = new JSObject();
        result.put("language", getCurrentLanguage());
        call.resolve(result);
    }

    @PluginMethod
    public void setLanguage(PluginCall call) {
        String lang = call.getString("language");
        if (lang == null || !isSupportedLanguage(lang)) {
            call.reject("Invalid or unsupported language: " + lang);
            return;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                LocaleManager localeManager = getActivity().getSystemService(LocaleManager.class);
                if (localeManager != null) {
                    localeManager.setApplicationLocales(new LocaleList(Locale.forLanguageTag(lang)));
                }
            } else {
                getActivity()
                        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                        .edit()
                        .putString(KEY_LANGUAGE, lang)
                        .apply();
            }

            JSObject result = new JSObject();
            result.put("language", lang);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Failed to set language", e);
            call.reject("Failed to set language: " + e.getMessage());
        }
    }

    private String getCurrentLanguage() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                LocaleManager localeManager = getActivity().getSystemService(LocaleManager.class);
                LocaleList appLocales = localeManager != null ? localeManager.getApplicationLocales() : LocaleList.getEmptyLocaleList();
                if (!appLocales.isEmpty()) {
                    String lang = appLocales.get(0).getLanguage().toLowerCase(Locale.ROOT);
                    if (isSupportedLanguage(lang)) {
                        return lang;
                    }
                }
            } else {
                String saved = getActivity()
                        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                        .getString(KEY_LANGUAGE, null);
                if (saved != null && isSupportedLanguage(saved)) {
                    return saved;
                }
            }

            Locale systemLocale = getActivity().getResources().getConfiguration().getLocales().get(0);
            String sysLang = systemLocale.getLanguage().toLowerCase(Locale.ROOT);
            if (isSupportedLanguage(sysLang)) {
                return sysLang;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting current language", e);
        }

        return "en";
    }

    private boolean isSupportedLanguage(String lang) {
        for (String code : SUPPORTED_LANGUAGES) {
            if (code.equals(lang)) {
                return true;
            }
        }
        return false;
    }
}
