import { Stack } from 'expo-router';

import { IntroMusicProvider, useIntroMusic } from '@/context/IntroMusicContext';
import { SoundWidget } from '@/components/SoundWidget';

export const unstable_settings = {
  initialRouteName: 'intro',
};

function AuthStack() {
  const { showWidget, songTitle } = useIntroMusic();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="intro" />
        {/* animation: 'none' - intro.tsx glides its own logo to sign-in's exact logo
            position before navigating, so this screen mount needs to be an instant
            swap, not the default slide-from-right, or the glide's illusion of
            continuity breaks the moment navigation actually happens. */}
        <Stack.Screen name="sign-in" options={{ animation: 'none' }} />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="forgot-password" />
      </Stack>
      {showWidget && <SoundWidget title={songTitle} />}
    </>
  );
}

export default function AuthLayout() {
  return (
    <IntroMusicProvider>
      <AuthStack />
    </IntroMusicProvider>
  );
}
