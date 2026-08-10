import { useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View as RNView } from 'react-native';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';

import { Logo } from '@/components/Logo';
import { getSignInLogoCenterY } from '@/lib/introTransition';
import { useIntroMusic, VOLUME_START, VOLUME_DUCKED } from '@/context/IntroMusicContext';
import SignInScreen from './sign-in';

const introVideo = require('@/assets/videos/intro.mp4');

const CROSSFADE_MS = 600; // slow on purpose - video's baked-in wordmark is bolder than the real Logo, so a quick swap reads as a jump
const HOLD_MS = 150;
const GLIDE_MS = 480;
const VOLUME_RAMP_MS = CROSSFADE_MS + HOLD_MS + GLIDE_MS;

/**
 * Plays once before sign-in/sign-up. Not skippable by tap - only advances on video
 * end. Video is pre-baked (ffmpeg + OpenCV, see project notes) with its own
 * circle-reveal transition and padding, audio stripped (music is a separate player,
 * see IntroMusicContext). At the end: crossfades into the real Logo component, holds
 * briefly, then glides up to sign-in's real measured logo position (an invisible
 * SignInScreen instance below the video reports it - see lib/introTransition.ts).
 * Sign-in's entrance animation is 'none' so the handoff lands exactly on target.
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
    const targetCenterY = getSignInLogoCenterY() ?? screenHeight * 0.27;
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
    <RNView style={styles.container}>
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
          style={[
            styles.logoOverlay,
            { opacity: logoOpacity, transform: [{ translateY: logoTranslateY }, { scale: logoScale }] },
          ]}
        >
          <Logo />
        </Animated.View>
      )}
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' }, // matches video's white ending, not black
  logoOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
