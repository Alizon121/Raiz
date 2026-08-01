// app.config.js instead of app.json so the AdMob App IDs (and any other
// per-environment identifiers) can come from .env, same pattern already used
// for the Firebase keys — see App.tsx / .env.example.

// Google's official sample App IDs — safe defaults so a dev build still
// works before real AdMob App IDs are set in .env.
const TEST_ADMOB_IOS_APP_ID = "ca-app-pub-3940256099942544~1458002511";
const TEST_ADMOB_ANDROID_APP_ID = "ca-app-pub-3940256099942544~3347511713";

module.exports = {
  expo: {
    name: "Raiz",
    slug: "raiz",
    scheme: "raiz",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    ios: {
      bundleIdentifier: "com.raiz.app",
      supportsTablet: true,
      usesAppleSignIn: true,
      googleServicesFile: "./GoogleService-Info.plist",
    },
    android: {
      package: "com.raiz.app",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      googleServicesFile: "./google-services.json",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-apple-authentication",
      "expo-dev-client",
      "@react-native-google-signin/google-signin",
      "expo-font",
      "expo-asset",
      [
        "expo-camera",
        {
          cameraPermission: "Raiz uses your camera to read PLU stickers on produce.",
        },
      ],
      [
        "react-native-google-mobile-ads",
        {
          iosAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || TEST_ADMOB_IOS_APP_ID,
          androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || TEST_ADMOB_ANDROID_APP_ID,
          // AdMob requires apps that serve ads to children/mixed audiences to
          // declare a delay before requesting ads, to give the UMP consent
          // flow / ATT prompt time to resolve first.
          delayAppMeasurementInit: true,
        },
      ],
      [
        "expo-tracking-transparency",
        {
          userTrackingPermission:
            "Raiz uses this to show ads that are more relevant to you. You can decline and still use the app normally.",
        },
      ],
    ],
  },
};
