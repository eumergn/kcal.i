import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';

const introVideo = require('@/assets/videos/intro.mp4');

/**
 * Frame-accurate brightness curve of the video's own black-to-white transition,
 * measured directly from the source (24fps, one sample per frame from the moment
 * the glow starts building at t=6.5s through the flash to full white at t=7.5s).
 * [milliseconds from video start, normalized 0-1 brightness]. Driving the screen's
 * background color (visible in the "contain" letterbox bars around the video) off
 * this real curve - instead of a guessed linear fade - is what makes the bars and
 * the video's own glow read as one continuous whole-screen effect instead of two
 * separately-timed animations.
 */
const BRIGHTNESS_CURVE: [number, number][] = [
  [6500, 0.035], [6542, 0.039], [6583, 0.039], [6625, 0.051], [6667, 0.086],
  [6708, 0.145], [6750, 0.243], [6792, 0.38], [6833, 0.518], [6875, 0.627],
  [6917, 0.718], [6958, 0.792], [7000, 0.855], [7042, 0.902], [7083, 0.933],
  [7125, 0.949], [7167, 0.957], [7208, 0.961], [7250, 0.961], [7292, 0.965],
  [7375, 1], // settles to true white slightly after the measured curve caps at
  // 0.965 - the video's own average never quite hits 255 because the black
  // logo artwork drawn on top keeps pulling it down, but the actual background
  // pixels are fully white by here, which is what the bars should match.
];

export default function IntroScreen() {
  const player = useVideoPlayer(introVideo, (p) => {
    p.loop = false;
    p.play();
  });

  const goToSignIn = () => router.replace('/sign-in');

  useEventListener(player, 'playToEnd', goToSignIn);

  const bgAnim = useRef(new Animated.Value(BRIGHTNESS_CURVE[0][1])).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      const steps = BRIGHTNESS_CURVE.slice(1).map(([ms, value], i) =>
        Animated.timing(bgAnim, {
          toValue: value,
          duration: ms - BRIGHTNESS_CURVE[i][0],
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      );
      Animated.sequence(steps).start();
    }, BRIGHTNESS_CURVE[0][0]);
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
