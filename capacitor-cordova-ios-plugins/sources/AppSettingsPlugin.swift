import Foundation
import Capacitor

@CapacitorCordova
public class AppSettingsPlugin: CDVPlugin {
    public func getLanguage(_ callback: CAPPluginCallback) {
        let defaults = UserDefaults.standard
        let language = defaults.string(forKey: "app_language") ?? "en"
        callback(["language": language])
    }
    
    public func observeLanguageChanges(_ callback: CAPPluginCallback) {
        // This is handled via NotificationCenter in the bridge
        callback(nil, ["error": "Use NotificationCenter instead"])
    }
}
