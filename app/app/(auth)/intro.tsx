import { useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';

import { Logo } from '@/components/Logo';
import { getSignInLogoCenterY } from '@/lib/introTransition';
import SignInScreen from './sign-in';

const introVideo = require('@/assets/videos/intro.mp4');

const CROSSFADE_MS = 220;
const GLIDE_MS = 480;

/**
 * Plays once, full-screen, before the sign-in/sign-up welcome screen - the first
 * thing a signed-out user sees on every cold entry into the auth flow.
 *
 * The video is pre-padded (via ffmpeg + a frame-by-frame OpenCV pass, see project
 * notes) to a tall portrait canvas with the source's own black-to-white circle-reveal
 * transition extended directly into the new frames - the real reveal is a growing
 * circle centered on the logo, not a flat fade, so the padding continues that same
 * circle (same center, frame-accurate radius for every frame that exists in the
 * original, then a smooth continuation to cover the taller canvas) rather than a
 * separately-timed color swap. That's necessary, not just nicer: VideoView paints an
 * opaque background within its own bounds regardless of contentFit, so a wrapping
 * view's background color can never show through in the letterboxed margins - baking
 * the real transition into the video itself is the only way to actually match it.
 *
 * At the end (or on tap-to-skip), instead of just navigating - which would cut to
 * sign-in with the default slide-from-right - this crossfades the video's final
 * frame into the real Logo component (already centered, matching what the video's
 * last frame shows), then glides that logo up to sign-in's actual measured logo
 * position before navigating. Sign-in's own entrance animation is set to 'none' so
 * the handoff lands exactly where the glide ends, instead of the whole screen
 * sliding in on top of it.
 *
 * The target position isn't a guessed percentage of screen height - a real,
 * invisible instance of SignInScreen is mounted below (opacity 0, not display:none,
 * so it still lays out) the moment this screen appears, and reports its own logo's
 * real measured position via lib/introTransition.ts. That self-measurement uses the
 * actual device's real dimensions, safe-area insets and font metrics, and re-runs on
 * every single launch - not a cached value from a previous mount - so it's accurate
 * on any phone, not just the one this was built and tested on. The video runs ~10s,
 * which is ample time for that layout pass to complete well before the glide needs it.
 */
export default function IntroScreen() {
  const player = useVideoPlayer(introVideo, (p) => {
    p.loop = false;
    p.play();
  });

  const [transitioning, setTransitioning] = useState(false);
  const videoOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;

  const runTransition = () => {
    if (transitioning) return;
    setTransitioning(true);
    player.pause();

    const screenHeight = Dimensions.get('window').height;
    const targetCenterY = getSignInLogoCenterY() ?? screenHeight * 0.18;
    const translateDistance = targetCenterY - screenHeight / 2;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: CROSSFADE_MS, useNativeDriver: true }),
        Animated.timing(videoOpacity, { toValue: 0, duration: CROSSFADE_MS, useNativeDriver: true }),
      ]),
      Animated.timing(logoTranslateY, {
        toValue: translateDistance,
        duration: GLIDE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace('/sign-in');
    });
  };

  useEventListener(player, 'playToEnd', runTransition);

  return (
    <Pressable style={styles.container} onPress={runTransition}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { opacity: 0 }]}>
        <SignInScreen />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: videoOpacity }]}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      </Animated.View>

      {transitioning && (
        <Animated.View
          pointerEvents="none"
          style={[styles.logoOverlay, { opacity: logoOpacity, transform: [{ translateY: logoTranslateY }] }]}
        >
          <Logo />
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // White, not black - the crossfade happens once the video's own baked-in
  // transition has finished (or on a skip tap, almost always well into or past it
  // too), so as the video's opacity fades to 0 during the crossfade, this needs to
  // match its white ending rather than let black bleed through behind it.
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  logoOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
