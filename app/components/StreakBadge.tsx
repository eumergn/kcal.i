import { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View as RNView } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { Text } from '@/components/Themed';
import { ProgressRing } from '@/components/ProgressRing';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { usePlan } from '@/context/PlanContext';
import { useProfile } from '@/context/ProfileContext';
import { mealTotals } from '@/constants/planData';
import { startOfToday, buildWeekDays } from '@/lib/dates';
import { cardShadow } from '@/lib/shadow';
import { computeTargets } from '@/lib/nutrition';

/**
 * A real (if limited) streak: 1 once today's calorie target is met, 0 otherwise.
 * There's no persisted per-day history yet - only today's totals are real - so this
 * can't count consecutive days honestly beyond "did today go well" until daily
 * records are stored server-side. Tapping it opens a small popover with the same
 * week-strip look as Home, so the two stay visually consistent.
 */
export function StreakBadge() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { meals, catalog } = usePlan();
  const { profile } = useProfile();
  const badgeRef = useRef<RNView>(null);
  const [visible, setVisible] = useState(false);
  const [anchorTop, setAnchorTop] = useState(0);

  const targetCalories = profile ? computeTargets(profile).calories : 2000;
  const caloriesToday = meals
    .filter((m) => m.eaten)
    .reduce((sum, m) => sum + mealTotals(m.items, catalog).calories, 0);
  const streak = caloriesToday >= targetCalories * 0.9 ? 1 : 0;

  const today = useMemo(() => startOfToday(), []);
  const weekDays = useMemo(() => buildWeekDays(today, 0), [today]);

  const open = () => {
    badgeRef.current?.measureInWindow((_x, y, _width, height) => {
      setAnchorTop(y + height + 8);
      setVisible(true);
    });
  };

  return (
    <>
      <Pressable
        ref={badgeRef}
        onPress={open}
        style={[styles.badge, { backgroundColor: c.card, borderColor: c.cardDivider, marginRight: 16 }]}
        accessibilityRole="button"
        accessibilityLabel="View this week's streak"
      >
        <FontAwesome5 name="fire" size={13} color={c.ringCalories} />
        <Text style={[styles.count, { color: c.text }]}>{streak}</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setVisible(false)} />
        <RNView style={[styles.popover, { top: anchorTop, backgroundColor: c.card, borderColor: c.cardDivider }]}>
          <Text style={[styles.popoverTitle, { color: c.secondaryText }]}>This week</Text>
          <RNView style={styles.popoverRow}>
            {weekDays.map((day) => (
              <RNView key={day.offset} style={styles.dayCell}>
                <Text style={[styles.dayLetter, { color: c.secondaryText }]}>{day.letter[0]}</Text>
                <ProgressRing
                  size={30}
                  strokeWidth={2}
                  progress={day.isToday ? streak : 0}
                  color={day.isToday ? c.ringCalories : c.ringTrack}
                  track={c.ringTrack}
                >
                  <Text style={[styles.dayNum, { color: day.isToday ? c.text : c.secondaryText }]}>{day.dateNum}</Text>
                </ProgressRing>
              </RNView>
            ))}
          </RNView>
        </RNView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 6,
  },
  count: { fontFamily: 'SpaceMono', fontSize: 13, fontWeight: '700' },

  popover: {
    position: 'absolute', right: 16, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth,
    padding: 16, minWidth: 260,
    ...cardShadow(6, 0.15, 12, 8),
  },
  popoverTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 1.5, marginBottom: 12 },
  popoverRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCell: { alignItems: 'center', gap: 5 },
  dayLetter: { fontSize: 10, fontWeight: '600' },
  dayNum: { fontSize: 11, fontWeight: '700' },
});
