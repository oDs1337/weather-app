import Foundation
import Capacitor

/**
 * AppSettingsPlugin reads language preference from NSUserDefaults,
 * which is where Settings.bundle stores its values.
 */
@objc(AppSettingsPlugin)
public class AppSettingsPlugin: CAPPlugin {
    
    private let settingsKey = "app_language"
    
    /// Get the current language setting from NSUserDefaults (Settings.bundle)
    @objc(func getLanguageWithCallback:)
    public func getLanguage(_ call: CAPPluginCall) {
        let defaults = UserDefaults.standard
        let language = defaults.string(forKey: settingsKey) ?? "en"
        
        call.resolve([
            "language": language
        ])
    }
    
    /// Set the language preference in NSUserDefaults (Settings.bundle)
    @objc(func setLanguageWithCallback:)
    public func setLanguage(_ call: CAPPluginCall) {
        guard let language = call.getString("language") else {
            call.reject("Invalid language parameter")
            return
        }
        
        let defaults = UserDefaults.standard
        defaults.set(language, forKey: settingsKey)
        defaults.synchronize()
        
        call.resolve([
            "language": language
        ])
    }
    
    /// Listen for changes to the app_language setting via NotificationCenter
    @objc(func observeLanguageChangesWithCallback:)
    public func observeLanguageChanges(_ call: CAPPluginCall) {
        // We'll use a notification observer pattern
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(settingsChanged),
            name: UserDefaults.didChangeNotification,
            object: nil
        )
        
        call.resolve()
    }
    
    @objc func settingsChanged(_ notification: Notification) {
        let defaults = UserDefaults.standard
        if let language = defaults.string(forKey: settingsKey) {
            sendEvent("languageChanged", [
                "language": language
            ])
        }
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}
