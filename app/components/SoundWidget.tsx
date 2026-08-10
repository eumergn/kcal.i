import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View as RNView } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { cardShadow } from '@/lib/shadow';
import { useIntroMusic } from '@/context/IntroMusicContext';

const BAR_COUNT = 4;

/** One vibrating equalizer bar, staggered per-bar so they read as a wave. Freezes at rest height while muted. */
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

/** Bottom-anchored "now playing" bar, shown from intro's glide until sign-in fades the music out. */
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
    bottom: 10,
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
