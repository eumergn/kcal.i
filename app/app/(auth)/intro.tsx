import { useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';

import { Logo } from '@/components/Logo';
import { getSignInLogoCenterY } from '@/lib/introTransition';
import { useIntroMusic, VOLUME_START, VOLUME_DUCKED } from '@/context/IntroMusicContext';

const introVideo = require('@/assets/videos/intro.mp4');

const CROSSFADE_MS = 220;
const HOLD_MS = 150; // a brief beat between the crossfade settling and the glide starting, so the moment reads as deliberate rather than instant
const GLIDE_MS = 480;
const VOLUME_RAMP_MS = CROSSFADE_MS + HOLD_MS + GLIDE_MS; // ducks out across the same span as the visual transition, not a separate timer

/**
 * Plays once, full-screen, before the sign-in/sign-up welcome screen - the first
 * thing a signed-out user sees on every cold entry into the auth flow.
 *
 * The video is pre-padded (via ffmpeg + a frame-by-frame OpenCV pass, see project
 * notes) to a tall portrait canvas with the source's own black-to-white circle-reveal
 * transition extended directly into the new frames, plus a little horizontal margin
 * baked in on both sides so "cover" fit doesn't run the video edge-to-edge on most
 * phones. The reveal is a growing circle centered on the logo, not a flat fade or a
 * simple time-based swap - every pixel in the padding (and the small patched-out
 * region where an unwanted sparkle graphic used to be) uses the exact same
 * per-pixel distance-from-center test as the real content, frame-accurate to the
 * source. An earlier version patched that sparkle region with an independent
 * time-based black/white switch instead of the real position-dependent circle test,
 * which left a visibly wrong square during the few frames where the two disagreed -
 * fixed by making every pixel, everywhere, follow the one real circle formula.
 * VideoView paints an opaque background within its own bounds regardless of
 * contentFit, so a wrapping view's background color can never show through in the
 * letterboxed margins - baking the real transition into the video itself is the only
 * way to actually match it. The video's own audio track has been stripped entirely -
 * music is a separate, app-owned player (see context/IntroMusicContext.tsx) that
 * keeps playing across the handoff to sign-in instead of stopping with the video.
 *
 * At the end (or on tap-to-skip), instead of just navigating - which would cut to
 * sign-in with the default slide-from-right - this runs a three-phase handoff: the
 * video's final frame crossfades into the real Logo component (already centered,
 * matching what the video shows) while it settles in from a slight scale-up; a brief
 * hold; then the logo glides up to sign-in's actual measured position. Sign-in's own
 * entrance animation is set to 'none' so the handoff lands exactly where the glide
 * ends, instead of the whole screen sliding in on top of it.
 *
 * The target position comes from sign-in.tsx's own onLayout report (see
 * lib/introTransition.ts) whenever a real, on-screen instance of it has already
 * measured itself this session - accurate to the real device, not a guess. The one
 * gap is a fresh install's very first glide, before sign-in has ever mounted for
 * real - that one case falls back to a tuned Dimensions-based estimate; every glide
 * after that (including the very next one, since sign-in mounts for real moments
 * later) uses the real measured value.
 */
export default function IntroScreen() {
  const player = useVideoPlayer(introVideo, (p) => {
    p.loop = false;
    p.play();
  });
  const { duck, setShowWidget } = useIntroMusic();

  const [transitioning, setTransitioning] = useState(false);
  const videoOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1.08)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;

  const runTransition = () => {
    if (transitioning) return;
    setTransitioning(true);
    player.pause();
    duck(VOLUME_START, VOLUME_DUCKED, VOLUME_RAMP_MS);

    const screenHeight = Dimensions.get('window').height;
    const targetCenterY = getSignInLogoCenterY() ?? screenHeight * 0.18;
    const translateDistance = targetCenterY - screenHeight / 2;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: CROSSFADE_MS, useNativeDriver: true }),
        Animated.timing(videoOpacity, { toValue: 0, duration: CROSSFADE_MS, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: CROSSFADE_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.delay(HOLD_MS),
      Animated.timing(logoTranslateY, {
        toValue: translateDistance,
        duration: GLIDE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowWidget(true);
      router.replace('/sign-in');
    });
  };

  useEventListener(player, 'playToEnd', runTransition);

  return (
    <Pressable style={styles.container} onPress={runTransition}>
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
          style={[
            styles.logoOverlay,
            { opacity: logoOpacity, transform: [{ translateY: logoTranslateY }, { scale: logoScale }] },
          ]}
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
