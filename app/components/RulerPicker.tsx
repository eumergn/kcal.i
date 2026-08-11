import { useMemo, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View as RNView } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';

const ITEM_SIZE = 32;
const VISIBLE_SIZE = 208;
const PADDING = VISIBLE_SIZE / 2 - ITEM_SIZE / 2;

/**
 * A scrubber for a single numeric value (height, weight, age, ...) - a snapping
 * ScrollView rather than a hand-rolled drag gesture, so momentum/snap come from the
 * platform for free. Value updates live as you drag (onScroll, not just on release),
 * so the displayed number always matches exactly where your finger is.
 */
export function RulerPicker({
  value,
  onChange,
  min,
  max,
  step = 1,
  majorEvery = 5,
  decimals = 0,
  orientation = 'vertical',
  reverseVertical = false,
  unit,
  colors,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  majorEvery?: number;
  decimals?: number;
  orientation?: 'vertical' | 'horizontal';
  reverseVertical?: boolean;
  unit: string;
  colors: (typeof Colors)['light'];
}) {
  const items = useMemo(() => {
    const arr: number[] = [];
    const count = Math.round((max - min) / step);
    for (let i = 0; i <= count; i++) arr.push(Math.round((min + i * step) * 1000) / 1000);
    return arr;
  }, [min, max, step]);

  const isVertical = orientation === 'vertical';
  const flip = isVertical && reverseVertical;

  // Optionally shows highest-at-top, lowest-at-bottom for a vertical ruler (a physical
  // ruler/thermometer feel) instead of the default ascending top-to-bottom. `items`
  // itself stays ascending so the min/max math above stays simple - this is purely a
  // display-order flip, opt-in per instance so it doesn't affect every vertical picker.
  const displayItems = flip ? [...items].reverse() : items;

  const closestIndex = (v: number) => {
    const i = Math.round((v - min) / step);
    return flip ? items.length - 1 - i : i;
  };
  const initialIndex = Math.max(0, Math.min(displayItems.length - 1, closestIndex(value)));
  const lastIndex = useRef(initialIndex);

  const indexFromEvent = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = orientation === 'vertical' ? e.nativeEvent.contentOffset.y : e.nativeEvent.contentOffset.x;
    return Math.max(0, Math.min(displayItems.length - 1, Math.round(offset / ITEM_SIZE)));
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = indexFromEvent(e);
    if (index === lastIndex.current) return;
    lastIndex.current = index;
    onChange(displayItems[index]);
  };

  // onScroll alone can miss the exact final rest position - the last event fired
  // during the gesture doesn't always land exactly where momentum/snap settles, so
  // the displayed number could end up one tick off from where the ruler visually
  // stopped. This is the authoritative correction once scrolling has fully settled.
  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = indexFromEvent(e);
    lastIndex.current = index;
    onChange(displayItems[index]);
  };

  return (
    <RNView>
      <Text style={styles.value}>
        <Text style={{ color: colors.text }}>{value.toFixed(decimals)}</Text>
        <Text style={{ color: colors.secondaryText, fontWeight: '600' }}> {unit}</Text>
      </Text>
      <RNView
        style={
          isVertical
            ? { height: VISIBLE_SIZE, justifyContent: 'center' }
            : { height: 72, width: VISIBLE_SIZE, alignSelf: 'center', justifyContent: 'center' }
        }
      >
        <RNView
          pointerEvents="none"
          style={isVertical ? [styles.centerLineH, { backgroundColor: colors.text }] : [styles.centerLineV, { backgroundColor: colors.text }]}
        />
        <ScrollView
          horizontal={!isVertical}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_SIZE}
          decelerationRate="fast"
          scrollEventThrottle={16}
          contentContainerStyle={
            isVertical ? { paddingVertical: PADDING } : { paddingHorizontal: PADDING, flexDirection: 'row', alignItems: 'flex-start' }
          }
          contentOffset={isVertical ? { x: 0, y: initialIndex * ITEM_SIZE } : { x: initialIndex * ITEM_SIZE, y: 0 }}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumEnd}
        >
          {displayItems.map((v, i) => {
            const isMajor = i % majorEvery === 0;
            const isSelected = v === value;
            const label = v.toFixed(decimals);
            return isVertical ? (
              <RNView key={v} style={styles.tickRowH}>
                <RNView style={styles.tickMarkSlotH}>
                  <RNView style={[styles.tickMarkH, { width: isMajor ? 16 : 8, backgroundColor: isSelected ? colors.text : colors.cardDivider }]} />
                </RNView>
                <RNView style={styles.tickLabelSlotH}>
                  {isMajor && (
                    <Text style={[styles.tickLabel, { color: isSelected ? colors.text : colors.secondaryText, fontWeight: isSelected ? '800' : '600' }]}>
                      {label}
                    </Text>
                  )}
                </RNView>
              </RNView>
            ) : (
              <RNView key={v} style={styles.tickColV}>
                <RNView style={styles.tickMarkSlotV}>
                  <RNView style={[styles.tickMarkV, { height: isMajor ? 16 : 8, backgroundColor: isSelected ? colors.text : colors.cardDivider }]} />
                </RNView>
                {isMajor && (
                  <Text style={[styles.tickLabel, { color: isSelected ? colors.text : colors.secondaryText, fontWeight: isSelected ? '800' : '600', marginTop: 6 }]}>
                    {label}
                  </Text>
                )}
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

  // Vertical ruler (ticks stacked top-to-bottom, scrolled vertically)
  centerLineH: { position: 'absolute', left: '30%', right: '30%', height: 2, borderRadius: 1, opacity: 0.9 },
  tickRowH: { height: ITEM_SIZE, flexDirection: 'row', alignItems: 'center', alignSelf: 'center' },
  tickMarkSlotH: { width: 20, alignItems: 'flex-end' },
  tickMarkH: { height: 2, borderRadius: 1 },
  tickLabelSlotH: { width: 40, marginLeft: 12, justifyContent: 'center' },

  // Horizontal ruler (ticks side-by-side, scrolled horizontally)
  centerLineV: { position: 'absolute', top: '20%', bottom: '20%', width: 2, borderRadius: 1, opacity: 0.9, alignSelf: 'center' },
  tickColV: { width: ITEM_SIZE, alignItems: 'center' },
  tickMarkSlotV: { height: 20, justifyContent: 'flex-end' },
  tickMarkV: { width: 2, borderRadius: 1 },

  tickLabel: { fontSize: 13 },
});
