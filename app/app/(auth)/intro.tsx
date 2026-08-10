import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';

import { View } from '@/components/Themed';

const introVideo = require('@/assets/videos/intro.mp4');

/**
 * Plays once, full-screen, before the sign-in/sign-up welcome screen - the first
 * thing a signed-out user sees on every cold entry into the auth flow. Advances to
 * sign-in automatically when it finishes, or immediately on tap so nobody's stuck
 * waiting on it.
 */
export default function IntroScreen() {
  const player = useVideoPlayer(introVideo, (p) => {
    p.loop = false;
    p.play();
  });

  const goToSignIn = () => router.replace('/sign-in');

  useEventListener(player, 'playToEnd', goToSignIn);

  return (
    <Pressable style={styles.container} onPress={goToSignIn}>
      <View style={StyleSheet.absoluteFillObject}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
});
