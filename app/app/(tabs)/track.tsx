import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View as RNView } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { ProgressRing } from '@/components/ProgressRing';
import { Entrance } from '@/components/Entrance';
import { useWeight, WeightEntry } from '@/context/WeightContext';
import { accountCreatedAt } from '@/constants/account';
import { startOfToday, buildMonthDays } from '@/lib/dates';

type ChartRange = 'week' | 'month' | 'year';
const RANGE_DAYS: Record<ChartRange, number> = { week: 7, month: 30, year: 365 };
const RANGE_LABELS: { value: ChartRange; label: string }[] = [
  { value: 'week', label: 'W' },
  { value: 'month', label: 'M' },
  { value: 'year', label: 'Y' },
];

/** A hand-drawn chart, not a charting library - same "own the primitive" approach as
 * ProgressRing. X position is real elapsed time within the selected window (not just
 * entry index), so gaps between logs show as real gaps rather than compressing evenly -
 * an honest picture of how consistently you've actually been logging. Includes the
 * goal weight as a dashed reference line so "am I on track" is visible at a glance,
 * not just inferable from the numbers. */
function WeightHistoryChart({
  entries,
  goalWeightKg,
  rangeDays,
  width,
  height,
  color,
  goalColor,
  labelColor,
}: {
  entries: WeightEntry[];
  goalWeightKg: number | null;
  rangeDays: number;
  width: number;
  height: number;
  color: string;
  goalColor: string;
  labelColor: string;
}) {
  if (width <= 0) return null;

  const windowEnd = startOfToday().getTime();
  const windowStart = windowEnd - (rangeDays - 1) * 86400000;
  const visible = entries.filter((e) => new Date(e.date).getTime() >= windowStart);

  const PAD_TOP = 16;
  const PAD_BOTTOM = 20;
  const PAD_X = 4;
  const plotHeight = height - PAD_TOP - PAD_BOTTOM;

  const weights = visible.map((e) => e.weightKg);
  if (goalWeightKg !== null) weights.push(goalWeightKg);
  const min = weights.length ? Math.min(...weights) : 0;
  const max = weights.length ? Math.max(...weights) : 1;
  const range = max - min || 1;

  const xFor = (dateStr: string) => {
    const t = new Date(dateStr).getTime();
    const frac = rangeDays <= 1 ? 0.5 : (t - windowStart) / (windowEnd - windowStart);
    return PAD_X + Math.max(0, Math.min(1, frac)) * (width - PAD_X * 2);
  };
  const yFor = (weightKg: number) => PAD_TOP + plotHeight * (1 - (weightKg - min) / range);

  const points = visible.map((e) => ({ x: xFor(e.date), y: yFor(e.weightKg) }));
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const startDateLabel = new Date(windowStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endDateLabel = new Date(windowEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <RNView>
      <Svg width={width} height={height}>
        {goalWeightKg !== null && (
          <Line
            x1={PAD_X}
            x2={width - PAD_X}
            y1={yFor(goalWeightKg)}
            y2={yFor(goalWeightKg)}
            stroke={goalColor}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />
        )}
        {points.length >= 2 && <Path d={d} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4.5 : 2.5} fill={color} />
        ))}
      </Svg>
      <RNView style={styles.chartAxisRow}>
        <Text style={[styles.chartAxisLabel, { color: labelColor }]}>{startDateLabel}</Text>
        <Text style={[styles.chartAxisLabel, { color: labelColor }]}>{endDateLabel}</Text>
      </RNView>
      {visible.length < 2 && (
        <Text style={[styles.chartHint, { color: labelColor, marginTop: 6 }]}>
          {entries.length === 0 ? 'Log a few days to see your trend here.' : 'No logs in this range yet.'}
        </Text>
      )}
    </RNView>
  );
}

/** The earliest day the month grid is allowed to show as "in progress" - matches the
 * same account-creation floor Home's week strip uses. */
const MIN_DAY_OFFSET = -Math.floor((startOfToday().getTime() - accountCreatedAt.getTime()) / 86400000);

export default function TrackScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { entries, goalWeightKg, logWeight } = useWeight();

  const [chartWidth, setChartWidth] = useState(0);
  const [weightInput, setWeightInput] = useState('');
  const [chartRange, setChartRange] = useState<ChartRange>('month');

  const latestEntry = entries[entries.length - 1];
  const firstEntry = entries[0];

  const goalProgress = (() => {
    if (!latestEntry || !goalWeightKg || !firstEntry || firstEntry.weightKg === goalWeightKg) return 0;
    const pct = (firstEntry.weightKg - latestEntry.weightKg) / (firstEntry.weightKg - goalWeightKg);
    return Math.max(0, Math.min(1, pct));
  })();

  const handleLogWeight = () => {
    const parsed = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return;
    logWeight(parsed);
    setWeightInput('');
  };

  const today = useMemo(() => startOfToday(), []);
  const monthDays = useMemo(() => buildMonthDays(today, MIN_DAY_OFFSET), [today]);
  const monthLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  // "Completed" here means a real weight entry exists for today - the one honest
  // signal this screen has, distinct from Home's calorie-based streak.
  const loggedToday = entries.some((e) => e.date === today.toISOString().slice(0, 10));

  return (
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
        <Entrance>
          <Text style={[styles.eyebrow, { color: c.secondaryText }]}>WEIGHT</Text>
          <View style={[styles.weightCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
            <View style={styles.weightHeaderRow} lightColor="transparent" darkColor="transparent">
              <View style={{ flex: 1 }} lightColor="transparent" darkColor="transparent">
                <Text style={styles.weightValue}>
                  <Text style={{ color: c.text }}>{latestEntry ? latestEntry.weightKg.toFixed(1) : '--'}</Text>
                  <Text style={{ color: c.secondaryText, fontWeight: '600' }}> kg</Text>
                </Text>
                <Text style={[styles.weightLabel, { color: c.secondaryText }]}>
                  {goalWeightKg ? `Goal ${goalWeightKg.toFixed(1)} kg` : 'Current weight'}
                </Text>
              </View>
              {goalWeightKg !== null && latestEntry && (
                <ProgressRing size={56} strokeWidth={5} progress={goalProgress} color={c.ringBudget} track={c.ringTrack}>
                  <Text style={[styles.goalPct, { color: c.text }]}>{Math.round(goalProgress * 100)}%</Text>
                </ProgressRing>
              )}
            </View>

            <View style={styles.rangeRow} lightColor="transparent" darkColor="transparent">
              {RANGE_LABELS.map((r) => (
                <Pressable
                  key={r.value}
                  onPress={() => setChartRange(r.value)}
                  style={[
                    styles.rangePill,
                    { backgroundColor: r.value === chartRange ? c.text : 'transparent', borderColor: c.cardDivider },
                  ]}
                >
                  <Text style={[styles.rangePillText, { color: r.value === chartRange ? c.background : c.secondaryText }]}>{r.label}</Text>
                </Pressable>
              ))}
            </View>

            <RNView onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)} style={styles.chartWrap}>
              <WeightHistoryChart
                entries={entries}
                goalWeightKg={goalWeightKg}
                rangeDays={RANGE_DAYS[chartRange]}
                width={chartWidth}
                height={140}
                color={c.ringBudget}
                goalColor={c.ringCalories}
                labelColor={c.secondaryText}
              />
            </RNView>

            <RNView style={styles.logRow}>
              <TextInput
                value={weightInput}
                onChangeText={setWeightInput}
                onSubmitEditing={handleLogWeight}
                placeholder={latestEntry ? latestEntry.weightKg.toFixed(1) : 'e.g. 74.5'}
                placeholderTextColor={c.secondaryText}
                keyboardType="decimal-pad"
                style={[styles.logInput, { color: c.text, borderColor: c.cardDivider }]}
              />
              <Pressable onPress={handleLogWeight} style={[styles.logButton, { backgroundColor: c.text }]}>
                <Text style={[styles.logButtonText, { color: c.background }]}>Log today</Text>
              </Pressable>
            </RNView>
          </View>
        </Entrance>

        <Entrance delay={80}>
          <Text style={[styles.eyebrow, { color: c.secondaryText, marginTop: 32 }]}>{monthLabel.toUpperCase()}</Text>
          <View style={[styles.monthCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
            <View style={styles.monthGrid} lightColor="transparent" darkColor="transparent">
              {monthDays.map((day) => (
                <RNView key={day.offset} style={[styles.monthCell, { opacity: day.enabled ? 1 : 0.3 }]}>
                  <ProgressRing
                    size={30}
                    strokeWidth={2}
                    progress={day.isToday && loggedToday ? 1 : 0}
                    color={day.isToday ? c.text : c.ringTrack}
                    track={c.ringTrack}
                  >
                    <Text style={[styles.monthDayNum, { color: day.isToday ? c.text : c.secondaryText }]}>{day.dateNum}</Text>
                  </ProgressRing>
                </RNView>
              ))}
            </View>
            <Text style={[styles.chartHint, { color: c.secondaryText, marginTop: 14 }]}>
              Only today has a real record so far - the rest of the month fills in as you go.
            </Text>
          </View>
        </Entrance>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 120 },
  eyebrow: { fontSize: 12, fontWeight: '600', letterSpacing: 2, marginBottom: 16 },

  weightCard: { borderRadius: 22, padding: 20, borderWidth: StyleSheet.hairlineWidth },
  weightHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  weightValue: { fontFamily: 'SpaceMono', fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  weightLabel: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  goalPct: { fontSize: 12, fontWeight: '700' },

  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  rangePill: { width: 32, height: 26, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  rangePillText: { fontSize: 11, fontWeight: '800' },

  chartWrap: { marginBottom: 16 },
  chartAxisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  chartAxisLabel: { fontSize: 10, fontWeight: '600' },
  chartHint: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

  logRow: { flexDirection: 'row', gap: 10 },
  logInput: {
    flex: 1, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16,
    fontFamily: 'SpaceMono', fontSize: 14, fontWeight: '700',
  },
  logButton: { borderRadius: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  logButtonText: { fontSize: 13, fontWeight: '700' },

  monthCard: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 20 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  monthCell: { alignItems: 'center', justifyContent: 'center' },
  monthDayNum: { fontSize: 11, fontWeight: '700' },
});
