import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        // Update status bar style when dark/light appearance changes
        if traitCollection.hasDifferentColorAppearance(comparedTo: previousTraitCollection) {
            setNeedsStatusBarAppearanceUpdate()
        }
    }

    var preferredStatusBarStyle: UIStatusBarStyle {
        return traitCollection.userInterfaceStyle == .dark ? .lightContent : .default
    }

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        // Ensure the webview respects safe-area insets on iOS 11+
        if #available(iOS 15.0, *) {
            // Use standard safe area inset handling (keyboardFoggingBehavior is iOS 26+)
            window?.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = CAPBridgeViewController()
        window?.makeKeyAndVisible()
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        // Handle URLs if needed
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        // Continue user activity if needed
    }
}
