import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View as RNView } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';

const EASE_INOUT = Easing.inOut(Easing.ease);

/**
 * A two-option pill with both labels always visible and a sliding highlight behind
 * whichever is selected - tap either half to jump straight to it. Used in place of a
 * bare Switch wherever the two states aren't self-evident (kg/cm vs lb/in) or the
 * user specifically wants to see and pick a side rather than just flip a toggle.
 */
export function SegmentedToggle<T extends string>({
  options,
  selected,
  onChange,
  colors,
}: {
  options: [{ value: T; label: string }, { value: T; label: string }];
  selected: T;
  onChange: (value: T) => void;
  colors: (typeof Colors)['light'];
}) {
  const selectedIndex = options[1].value === selected ? 1 : 0;
  const slide = useRef(new Animated.Value(selectedIndex)).current;

  useEffect(() => {
    Animated.timing(slide, { toValue: selectedIndex, duration: 220, easing: EASE_INOUT, useNativeDriver: true }).start();
  }, [selectedIndex, slide]);

  const thumbTranslateX = slide.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <RNView style={[styles.track, { backgroundColor: colors.cardDivider }]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.thumb, { backgroundColor: colors.text, transform: [{ translateX: thumbTranslateX }] }]}
      />
      {options.map((opt, i) => (
        <Pressable key={opt.value} onPress={() => onChange(opt.value)} style={styles.half} accessibilityRole="button" accessibilityState={{ selected: i === selectedIndex }}>
          <Text style={[styles.label, { color: i === selectedIndex ? colors.background : colors.text }]}>{opt.label}</Text>
        </Pressable>
      ))}
    </RNView>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: 16, height: 36, width: 168, overflow: 'hidden' },
  thumb: { position: 'absolute', top: 2, left: 2, bottom: 2, width: '50%', borderRadius: 14 },
  half: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '700' },
});
