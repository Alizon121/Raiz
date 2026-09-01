// app.config.js instead of app.json so the AdMob App IDs (and any other
// per-environment identifiers) can come from .env, same pattern already used
// for the Firebase keys — see App.tsx / .env.example.

// Google's official sample App IDs — safe defaults so a dev build still
// works before real AdMob App IDs are set in .env.
const TEST_ADMOB_IOS_APP_ID = "ca-app-pub-3940256099942544~1458002511";
const TEST_ADMOB_ANDROID_APP_ID = "ca-app-pub-3940256099942544~3347511713";

// Google's current recommended SKAdNetworkItems list for AdMob (per
// https://developers.google.com/admob/ios/quick-start) — lets iOS attribute
// ad-driven installs/conversions via SKAdNetwork instead of IDFA. Missing
// these doesn't break ad serving, just conversion measurement, so this list
// is expected to need occasional refreshes as Google adds networks — check
// that page if AdMob's console starts flagging it as stale.
const SKAD_NETWORK_ITEMS = [
  "cstr6suwn9.skadnetwork",
  "4fzdc2evr5.skadnetwork",
  "2fnua5tdw4.skadnetwork",
  "ydx93a7ass.skadnetwork",
  "p78axxw29g.skadnetwork",
  "v72qych5uu.skadnetwork",
  "ludvb6z3bs.skadnetwork",
  "cp8zw746q7.skadnetwork",
  "3sh42y64q3.skadnetwork",
  "c6k4g5qg8m.skadnetwork",
  "s39g8k73mm.skadnetwork",
  "wg4vff78zm.skadnetwork",
  "3qy4746246.skadnetwork",
  "f38h382jlk.skadnetwork",
  "hs6bdukanm.skadnetwork",
  "mlmmfzh3r3.skadnetwork",
  "v4nxqhlyqp.skadnetwork",
  "wzmmz9fp6w.skadnetwork",
  "su67r6k2v3.skadnetwork",
  "yclnxrl5pm.skadnetwork",
  "t38b2kh725.skadnetwork",
  "7ug5zh24hu.skadnetwork",
  "gta9lk7p23.skadnetwork",
  "vutu7akeur.skadnetwork",
  "y5ghdn5j9k.skadnetwork",
  "v9wttpbfk9.skadnetwork",
  "n38lu8286q.skadnetwork",
  "47vhws6wlr.skadnetwork",
  "kbd757ywx3.skadnetwork",
  "9t245vhmpl.skadnetwork",
  "a2p9lx4jpn.skadnetwork",
  "22mmun2rn5.skadnetwork",
  "44jx6755aq.skadnetwork",
  "k674qkevps.skadnetwork",
  "4468km3ulz.skadnetwork",
  "2u9pt9hc89.skadnetwork",
  "8s468mfl3y.skadnetwork",
  "klf5c3l5u5.skadnetwork",
  "ppxm28t8ap.skadnetwork",
  "kbmxgpxpgc.skadnetwork",
  "uw77j35x4d.skadnetwork",
  "578prtvx9j.skadnetwork",
  "4dzt52r2t5.skadnetwork",
  "tl55sbb4fm.skadnetwork",
  "c3frkrj4fj.skadnetwork",
  "e5fvkxwrpn.skadnetwork",
  "8c4e2ghe7u.skadnetwork",
  "3rd42ekr43.skadnetwork",
  "97r2b46745.skadnetwork",
  "3qcr597p9d.skadnetwork",
];

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
      bundleIdentifier: "com.pesticideraiz.app",
      buildNumber: "2",
      supportsTablet: true,
      usesAppleSignIn: true,
      googleServicesFile: "./GoogleService-Info.plist",
    },
    android: {
      package: "com.raiz.app",
      adaptiveIcon: {
        backgroundColor: "#357A42",
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
          skAdNetworkItems: SKAD_NETWORK_ITEMS,
        },
      ],
      [
        "expo-tracking-transparency",
        {
          userTrackingPermission:
            "Raiz uses this to show ads that are more relevant to you. You can decline and still use the app normally.",
        },
      ],
      "expo-iap",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash-icon.png",
          imageWidth: 220,
          resizeMode: "contain",
          backgroundColor: "#F6F8F5",
        },
      ],
      "./plugins/withPodModularHeaders",
      "./plugins/withStoreKitConfig",
    ],
  },
};
