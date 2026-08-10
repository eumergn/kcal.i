import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';

const introVideo = require('@/assets/videos/intro.mp4');

// The video itself cuts from a black background to a white one at this timestamp -
// matched here so the screen's own background (visible in the "contain" letterbox
// bars around the video) switches in sync instead of staying a fixed color that
// clashes with whichever half of the video is currently showing.
const BG_SWITCH_MS = 7250;
const BG_TRANSITION_MS = 250;

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

  const bgAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(bgAnim, { toValue: 1, duration: BG_TRANSITION_MS, easing: Easing.linear, useNativeDriver: false }).start();
    }, BG_SWITCH_MS);
    return () => clearTimeout(timer);
  }, [bgAnim]);

  const backgroundColor = bgAnim.interpolate({ inputRange: [0, 1], outputRange: ['#000000', '#FFFFFF'] });

  return (
    <Pressable style={styles.container} onPress={goToSignIn}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor }]}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFillObject}
          contentFit="contain"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
});
