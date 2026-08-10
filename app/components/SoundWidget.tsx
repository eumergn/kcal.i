import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View as RNView } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { cardShadow } from '@/lib/shadow';
import { useIntroMusic } from '@/context/IntroMusicContext';

const BAR_COUNT = 4;

/** One vibrating equalizer bar - each on its own staggered loop so together they
 * read as a wave rather than pulsing in lockstep. Frozen at rest height while muted,
 * instead of continuing to animate over silence. */
function EqualizerBar({ delay, color, active }: { delay: number; color: string; active: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      anim.stopAnimation();
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 380, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 380, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay, active]);

  return (
    <Animated.View
      style={[
        styles.bar,
        { backgroundColor: color, height: anim.interpolate({ inputRange: [0, 1], outputRange: [5, 16] }) },
      ]}
    />
  );
}

/**
 * A small "now playing" bar, bottom-anchored - shown from the moment intro's glide
 * finishes (see IntroMusicContext) until the music fades out on real sign-in. The
 * on/off button pauses the shared player instantly; un-muting fades back in slowly
 * rather than jumping straight back to full duck volume.
 */
export function SoundWidget({ title }: { title: string }) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { isMuted, toggleMute } = useIntroMusic();

  return (
    <RNView style={[styles.wrap, { backgroundColor: `${c.card}BF`, borderColor: c.cardDivider }]}>
      <FontAwesome5 name="music" size={13} color={c.secondaryText} />
      <RNView style={styles.bars}>
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <EqualizerBar key={i} delay={i * 100} color={c.ringCalories} active={!isMuted} />
        ))}
      </RNView>
      <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
        {title}
      </Text>
      <Pressable
        onPress={toggleMute}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={isMuted ? 'Turn sound on' : 'Turn sound off'}
      >
        <FontAwesome5 name={isMuted ? 'volume-mute' : 'volume-up'} size={15} color={c.secondaryText} />
      </Pressable>
    </RNView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...cardShadow(6, 0.15, 12, 8),
  },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 16 },
  bar: { width: 3, borderRadius: 2 },
  title: { fontSize: 12, fontWeight: '700', flex: 1 },
});
