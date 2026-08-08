import { useMemo, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View as RNView } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';

const ITEM_HEIGHT = 32;
const VISIBLE_HEIGHT = 208;
const PADDING = VISIBLE_HEIGHT / 2 - ITEM_HEIGHT / 2;

/**
 * A vertical scrubber for a single numeric value (height, weight, age) - a snapping
 * ScrollView rather than a hand-rolled drag gesture, since it gets correct momentum
 * and snap behavior for free from the platform instead of reimplementing physics.
 * Every step gets a tick; every 5th step is labeled, matching a real ruler.
 */
export function RulerPicker({
  value,
  onChange,
  min,
  max,
  step = 1,
  majorEvery = 5,
  unit,
  colors,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  majorEvery?: number;
  unit: string;
  colors: (typeof Colors)['light'];
}) {
  const items = useMemo(() => {
    const arr: number[] = [];
    for (let v = min; v <= max + 1e-6; v += step) arr.push(Math.round(v * 100) / 100);
    return arr;
  }, [min, max, step]);

  const initialIndex = Math.max(0, Math.min(items.length - 1, Math.round((value - min) / step)));
  const lastIndex = useRef(initialIndex);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.max(0, Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT)));
    if (index === lastIndex.current) return;
    lastIndex.current = index;
    onChange(items[index]);
  };

  return (
    <RNView>
      <Text style={styles.value}>
        <Text style={{ color: colors.text }}>{value}</Text>
        <Text style={{ color: colors.secondaryText, fontWeight: '600' }}> {unit}</Text>
      </Text>
      <RNView style={{ height: VISIBLE_HEIGHT, justifyContent: 'center' }}>
        <RNView pointerEvents="none" style={[styles.centerLine, { backgroundColor: colors.text }]} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: PADDING }}
          contentOffset={{ x: 0, y: initialIndex * ITEM_HEIGHT }}
          onMomentumScrollEnd={handleMomentumEnd}
        >
          {items.map((v, i) => {
            const isMajor = i % majorEvery === 0;
            const isSelected = v === value;
            return (
              <RNView key={v} style={styles.tickRow}>
                <RNView style={styles.tickMarkSlot}>
                  <RNView
                    style={[
                      styles.tickMark,
                      {
                        width: isMajor ? 16 : 8,
                        backgroundColor: isSelected ? colors.text : colors.cardDivider,
                      },
                    ]}
                  />
                </RNView>
                <RNView style={styles.tickLabelSlot}>
                  {isMajor && (
                    <Text style={[styles.tickLabel, { color: isSelected ? colors.text : colors.secondaryText, fontWeight: isSelected ? '800' : '600' }]}>
                      {v}
                    </Text>
                  )}
                </RNView>
              </RNView>
            );
          })}
        </ScrollView>
      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  value: { fontFamily: 'SpaceMono', fontSize: 34, fontWeight: '700', letterSpacing: -1, textAlign: 'center', marginBottom: 12 },
  centerLine: { position: 'absolute', left: '30%', right: '30%', height: 2, borderRadius: 1, opacity: 0.9 },
  tickRow: { height: ITEM_HEIGHT, flexDirection: 'row', alignItems: 'center', alignSelf: 'center' },
  tickMarkSlot: { width: 20, alignItems: 'flex-end' },
  tickMark: { height: 2, borderRadius: 1 },
  tickLabelSlot: { width: 40, marginLeft: 12, justifyContent: 'center' },
  tickLabel: { fontSize: 13 },
});
