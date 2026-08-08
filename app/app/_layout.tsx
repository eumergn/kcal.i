import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

import Colors from '@/constants/Colors';
import { AppThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { PlanProvider } from '@/context/PlanContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProfileProvider, useProfile } from '@/context/ProfileContext';
import { Text, View } from '@/components/Themed';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AppThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <PlanProvider>
            <RootLayoutNav />
          </PlanProvider>
        </ProfileProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}

function RootLayoutNav() {
  const { scheme } = useAppTheme();
  const { session, loading } = useAuth();
  const { status: profileStatus } = useProfile();
  const c = Colors[scheme];

  const navigationTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: c.background,
      card: c.card,
      text: c.text,
      border: c.cardDivider,
      primary: c.tint,
    },
  };

  // Also covers "has a session but we're still checking whether user_profile exists" -
  // showing onboarding or tabs prematurely during that check would flash the wrong screen.
  if (loading || (session && profileStatus === 'loading')) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
        <ActivityIndicator color={c.ringCalories} />
        <Text style={{ color: c.secondaryText, marginTop: 12, fontSize: 13, fontWeight: '600' }}>Loading...</Text>
      </View>
    );
  }

  const hasAccount = Boolean(session);
  const hasProfile = profileStatus === 'present';

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        {/* Stack.Protected is the supported way to gate routes on a condition -
            swapping raw Stack.Screen children with a ternary isn't recognized by
            Expo Router's static route analysis and triggers a "children must be of
            type Screen" warning. Three states: no account -> auth, account but no
            profile yet -> onboarding, both -> the real app. */}
        <Stack.Protected guard={hasAccount && hasProfile}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="meal/[id]" options={{ presentation: 'modal', headerShown: true }} />
          <Stack.Screen name="scan" options={{ presentation: 'modal', headerShown: true, title: 'Scan a product' }} />
        </Stack.Protected>
        <Stack.Protected guard={hasAccount && !hasProfile}>
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!hasAccount}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
