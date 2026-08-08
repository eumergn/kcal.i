import { useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, TextInput, View as RNView } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useTabSlide } from '@/components/useTabSlide';
import { ProgressRing } from '@/components/ProgressRing';
import { Entrance } from '@/components/Entrance';
import { usePlan } from '@/context/PlanContext';
import { mealTotals, targets } from '@/constants/planData';
import { useWeight, WeightEntry } from '@/context/WeightContext';

const WATER_TARGET_CUPS = 8;

/** A hand-drawn line, not a charting library - same "own the primitive" approach as
 * ProgressRing. Only renders once there are at least two points to connect. */
function WeightTrendChart({ entries, width, height, color }: { entries: WeightEntry[]; width: number; height: number; color: string }) {
  if (entries.length < 2 || width <= 0) return null;

  const weights = entries.map((e) => e.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const pad = 6;

  const points = entries.map((e, i) => ({
    x: entries.length === 1 ? width / 2 : (i / (entries.length - 1)) * width,
    y: pad + (height - pad * 2) * (1 - (e.weightKg - min) / range),
  }));

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <Svg width={width} height={height}>
      <Path d={d} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 2.5} fill={color} />
      ))}
    </Svg>
  );
}

export default function TrackScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const slideStyle = useTabSlide('track');
  const { meals, catalog } = usePlan();
  const { entries, goalWeightKg, logWeight } = useWeight();

  const [chartWidth, setChartWidth] = useState(0);
  const [weightInput, setWeightInput] = useState('');
  const [cupsToday, setCupsToday] = useState(0);

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

  const totals = meals
    .filter((m) => m.eaten)
    .reduce(
      (acc, m) => {
        const t = mealTotals(m.items, catalog);
        return { calories: acc.calories + t.calories, proteinG: acc.proteinG + t.proteinG };
      },
      { calories: 0, proteinG: 0 },
    );

  return (
    <Animated.View style={[{ flex: 1 }, slideStyle]}>
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

            <RNView onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)} style={styles.chartWrap}>
              {entries.length >= 2 ? (
                <WeightTrendChart entries={entries} width={chartWidth} height={72} color={c.ringBudget} />
              ) : (
                <Text style={[styles.chartHint, { color: c.secondaryText }]}>Log a few days to see your trend here.</Text>
              )}
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
          <Text style={[styles.eyebrow, { color: c.secondaryText, marginTop: 32 }]}>TODAY</Text>
          <View style={styles.recapRow} lightColor="transparent" darkColor="transparent">
            <View style={[styles.recapCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
              <ProgressRing size={56} strokeWidth={5} progress={totals.calories / targets.calories} color={c.ringCalories} track={c.ringTrack}>
                <FontAwesome5 name="fire" size={18} color={c.ringCalories} />
              </ProgressRing>
              <Text style={[styles.recapValue, { color: c.text }]}>{Math.round(totals.calories)}<Text style={{ color: c.secondaryText, fontWeight: '600' }}>/{targets.calories}</Text></Text>
              <Text style={[styles.recapLabel, { color: c.secondaryText }]}>Calories</Text>
            </View>
            <View style={[styles.recapCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
              <ProgressRing size={56} strokeWidth={5} progress={totals.proteinG / targets.proteinG} color={c.ringProtein} track={c.ringTrack}>
                <MaterialCommunityIcons name="food-drumstick" size={18} color={c.ringProtein} />
              </ProgressRing>
              <Text style={[styles.recapValue, { color: c.text }]}>{Math.round(totals.proteinG)}<Text style={{ color: c.secondaryText, fontWeight: '600' }}>/{targets.proteinG}g</Text></Text>
              <Text style={[styles.recapLabel, { color: c.secondaryText }]}>Protein</Text>
            </View>
          </View>
        </Entrance>

        <Entrance delay={140}>
          <Text style={[styles.eyebrow, { color: c.secondaryText, marginTop: 32 }]}>WATER</Text>
          <View style={[styles.waterCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
            <ProgressRing size={64} strokeWidth={5} progress={cupsToday / WATER_TARGET_CUPS} color={c.ringCarbs} track={c.ringTrack}>
              <FontAwesome5 name="tint" size={20} color={c.ringCarbs} />
            </ProgressRing>
            <View style={{ flex: 1 }} lightColor="transparent" darkColor="transparent">
              <Text style={styles.waterValue}>
                <Text style={{ color: c.text }}>{cupsToday}</Text>
                <Text style={{ color: c.secondaryText, fontWeight: '600' }}>/{WATER_TARGET_CUPS} cups</Text>
              </Text>
              <Text style={[styles.weightLabel, { color: c.secondaryText }]}>Water today</Text>
            </View>
            <RNView style={styles.waterButtons}>
              <Pressable
                onPress={() => setCupsToday((n) => Math.max(0, n - 1))}
                disabled={cupsToday <= 0}
                style={[styles.stepperButton, { backgroundColor: c.cardDivider, opacity: cupsToday <= 0 ? 0.4 : 1 }]}
              >
                <FontAwesome name="minus" size={13} color={c.text} />
              </Pressable>
              <Pressable onPress={() => setCupsToday((n) => n + 1)} style={[styles.stepperButton, { backgroundColor: c.cardDivider }]}>
                <FontAwesome name="plus" size={13} color={c.text} />
              </Pressable>
            </RNView>
          </View>
        </Entrance>
      </ScrollView>
    </Animated.View>
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

  chartWrap: { height: 72, marginBottom: 16, justifyContent: 'center' },
  chartHint: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

  logRow: { flexDirection: 'row', gap: 10 },
  logInput: {
    flex: 1, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16,
    fontFamily: 'SpaceMono', fontSize: 14, fontWeight: '700',
  },
  logButton: { borderRadius: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  logButtonText: { fontSize: 13, fontWeight: '700' },

  recapRow: { flexDirection: 'row', gap: 12 },
  recapCard: { flex: 1, alignItems: 'center', gap: 8, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 18 },
  recapValue: { fontFamily: 'SpaceMono', fontSize: 14, fontWeight: '700' },
  recapLabel: { fontSize: 11, fontWeight: '600' },

  waterCard: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 20 },
  waterValue: { fontFamily: 'SpaceMono', fontSize: 22, fontWeight: '700' },
  waterButtons: { gap: 10 },
  stepperButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
