import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../auth/AuthContext";
import AuthWelcomeScreen from "../screens/AuthWelcomeScreen";
import EmailAuthScreen from "../screens/EmailAuthScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ManualEntryScreen from "../screens/ManualEntryScreen";
import OnboardingScreen, { hasSeenOnboarding } from "../screens/OnboardingScreen";
import ProduceDetailScreen from "../screens/ProduceDetailScreen";
import ScanConfirmScreen from "../screens/ScanConfirmScreen";
import ScanScreen from "../screens/ScanScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { colors } from "../theme";
import type { AuthStackParamList, ScanStackParamList } from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const ScanStack = createNativeStackNavigator<ScanStackParamList>();
const MainTabs = createBottomTabNavigator();

function ScanNavigator() {
  return (
    <ScanStack.Navigator
      screenOptions={{
        headerTintColor: colors.forest,
        headerStyle: { backgroundColor: colors.cream },
        headerShadowVisible: false,
      }}
    >
      <ScanStack.Screen name="Scan" component={ScanScreen} options={{ headerShown: false }} />
      <ScanStack.Screen name="ScanConfirm" component={ScanConfirmScreen} options={{ title: "Confirm" }} />
      <ScanStack.Screen name="ManualEntry" component={ManualEntryScreen} options={{ title: "Enter PLU" }} />
      <ScanStack.Screen name="ProduceDetail" component={ProduceDetailScreen} options={{ title: "" }} />
    </ScanStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <MainTabs.Screen
        name="Scan"
        component={ScanNavigator}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="scan-outline" size={size} color={color} /> }}
      />
      <MainTabs.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }}
      />
      <MainTabs.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} /> }}
      />
    </MainTabs.Navigator>
  );
}

function SignedOutNavigator() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    hasSeenOnboarding().then(setOnboardingDone);
  }, []);

  if (onboardingDone === null) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      {!onboardingDone && (
        <AuthStack.Screen name="Onboarding">
          {() => <OnboardingScreen onDone={() => setOnboardingDone(true)} />}
        </AuthStack.Screen>
      )}
      <AuthStack.Screen name="AuthWelcome" component={AuthWelcomeScreen} />
      <AuthStack.Screen name="EmailAuth" component={EmailAuthScreen} />
    </AuthStack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.cream} />
      </View>
    );
  }

  return <NavigationContainer>{user ? <MainNavigator /> : <SignedOutNavigator />}</NavigationContainer>;
}
