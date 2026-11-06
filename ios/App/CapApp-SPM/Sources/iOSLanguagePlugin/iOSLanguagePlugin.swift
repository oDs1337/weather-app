import Foundation
import Capacitor

/**
 * iOSLanguagePlugin provides access to the native iOS application language.
 * 
 * On iOS, when a user selects a language for an app in Settings → Apps → [App Name] → Language,
 * iOS sets that as the preferred localization for the app's bundle.
 * 
 * Bundle.main.preferredLocalizations.first returns this app-specific language selection,
 * which is different from Locale.preferredLanguages (the user's general language list).
 */
@objc(iOSLanguagePlugin)
public class iOSLanguagePlugin: CAPPlugin {
    
    /// Get the current application language as selected in iOS Settings.
    /// Returns the bundle's preferred localization, normalized to a BCP 47 language code.
    @objc(func getLanguageWithCallback:)
    public func getLanguage(_ call: CAPPluginCall) {
        // Primary source: Bundle.main.preferredLocalizations.first
        // This returns the language selected specifically for this app in iOS Settings.
        let bundleLang = Bundle.main.preferredLocalizations.first ?? "en"
        
        // Fallback: Locale.preferredLocales (iOS 15+) or Locale.preferredLanguages (older)
        var fallbackLang = "en"
        if #available(iOS 15.0, *) {
            fallbackLang = Locale.preferredLocales.first?.identifier ?? "en"
        } else {
            fallbackLang = Locale.preferredLanguages.first ?? "en"
        }
        
        // Log for diagnostics
        print("[iOSLanguagePlugin] Bundle.main.preferredLocalizations.first: \(bundleLang)")
        print("[iOSLanguagePlugin] Locale.preferredLocales/PreferredLanguages: \(fallbackLang)")
        
        // Use bundle language as primary, fallback to system languages
        let language = bundleLang != "en" ? bundleLang : fallbackLang
        
        call.resolve([
            "languageTag": language
        ])
    }
}
