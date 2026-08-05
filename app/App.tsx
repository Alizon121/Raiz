import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AuthProvider } from "./src/auth/AuthContext";
import { initAds } from "./src/ads/initAds";
import { PremiumProvider } from "./src/iap/PremiumContext";
import RootNavigator from "./src/navigation/RootNavigator";

// webClientId is the "Web client (auto created by Google Service)" OAuth
// client ID from Google Cloud Console — Firebase creates it automatically
// once you enable the Google sign-in provider. See app/README.md.
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export default function App() {
  useEffect(() => {
    initAds().catch((error) => console.warn("[ads] initAds failed:", error));
  }, []);

  return (
    <AuthProvider>
      <PremiumProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </PremiumProvider>
    </AuthProvider>
  );
}
