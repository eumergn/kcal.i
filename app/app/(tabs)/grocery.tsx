import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View as RNView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { GroceryItem, formatGrams, itemCost, normalizeToMonthly } from '@/constants/groceryData';
import { ProgressRing } from '@/components/ProgressRing';
import { useProfile } from '@/context/ProfileContext';
import { usePlan } from '@/context/PlanContext';
import { supabase } from '@/lib/supabase';

const STEP_GRAMS = 250;
const DAYS_PER_MONTH = 30;
const WALLET_BROWN = '#8B5E3C';

const ITEM_ICONS: Record<string, (color: string) => React.ReactNode> = {
  'chicken-breast': (col) => <MaterialCommunityIcons name="food-drumstick" size={17} color={col} />,
  oats: (col) => <MaterialCommunityIcons name="bowl-mix" size={17} color={col} />,
  carrots: (col) => <FontAwesome5 name="carrot" size={16} color={col} />,
  'tuna-canned': (col) => <FontAwesome5 name="fish" size={16} color={col} />,
  bread: (col) => <FontAwesome5 name="bread-slice" size={16} color={col} />,
  'ground-beef': (col) => <FontAwesome5 name="hamburger" size={16} color={col} />,
  rice: (col) => <MaterialCommunityIcons name="rice" size={17} color={col} />,
  eggs: (col) => <FontAwesome5 name="egg" size={16} color={col} />,
  pasta: (col) => <MaterialCommunityIcons name="pasta" size={17} color={col} />,
  'greek-yogurt': (col) => <MaterialCommunityIcons name="cup" size={17} color={col} />,
  'cottage-cheese': (col) => <MaterialCommunityIcons name="cheese" size={17} color={col} />,
  tofu: (col) => <MaterialCommunityIcons name="cube-outline" size={17} color={col} />,
  lentils: (col) => <MaterialCommunityIcons name="grain" size={17} color={col} />,
  chickpeas: (col) => <MaterialCommunityIcons name="grain" size={17} color={col} />,
  potatoes: (col) => <MaterialCommunityIcons name="food-variant" size={17} color={col} />,
  banana: (col) => <FontAwesome5 name="apple-alt" size={16} color={col} />,
  apple: (col) => <FontAwesome5 name="apple-alt" size={16} color={col} />,
  'frozen-veg': (col) => <MaterialCommunityIcons name="snowflake" size={17} color={col} />,
  spinach: (col) => <MaterialCommunityIcons name="leaf" size={17} color={col} />,
  milk: (col) => <MaterialCommunityIcons name="cup-water" size={17} color={col} />,
  'olive-oil': (col) => <MaterialCommunityIcons name="bottle-tonic-outline" size={17} color={col} />,
};
const defaultIcon = (col: string) => <FontAwesome5 name="shopping-basket" size={15} color={col} />;

function GroceryRow({
  item,
  colors,
  accentColor,
  onChangePrice,
  onAdjustPurchased,
}: {
  item: GroceryItem;
  colors: (typeof Colors)['light'];
  accentColor: string;
  onChangePrice: (id: string, text: string) => void;
  onAdjustPurchased: (id: string, delta: number) => void;
}) {
  const [priceText, setPriceText] = useState(item.pricePer100.toFixed(2));

  const commitPrice = () => {
    const parsed = parseFloat(priceText.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      onChangePrice(item.id, priceText);
      setPriceText(parsed.toFixed(2));
    } else {
      setPriceText(item.pricePer100.toFixed(2));
    }
  };

  const pct = item.neededGrams > 0 ? item.purchasedGrams / item.neededGrams : 0;
  const remaining = Math.max(item.neededGrams - item.purchasedGrams, 0);
  const renderIcon = ITEM_ICONS[item.id] ?? defaultIcon;
  // Bought more than the list called for - the ring goes thicker as well as the
  // shared "grow past 100%" scale effect, since this is the one place both read well together.
  const strokeWidth = pct > 1 ? 6 : 3;

  return (
    <View style={[styles.itemRow, { borderTopColor: colors.cardDivider }]} lightColor="transparent" darkColor="transparent">
      <ProgressRing size={44} strokeWidth={strokeWidth} progress={pct} color={accentColor} track={colors.ringTrack}>
        {renderIcon(accentColor)}
      </ProgressRing>

      <View style={{ flex: 1, gap: 8 }} lightColor="transparent" darkColor="transparent">
        <View style={styles.itemHeaderRow} lightColor="transparent" darkColor="transparent">
          <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
          <View style={styles.priceInputWrap} lightColor="transparent" darkColor="transparent">
            <Text style={[styles.priceCurrency, { color: colors.secondaryText }]}>€</Text>
            <TextInput
              value={priceText}
              onChangeText={setPriceText}
              onBlur={commitPrice}
              onSubmitEditing={commitPrice}
              keyboardType="decimal-pad"
              style={[styles.priceInput, { color: colors.text, borderBottomColor: colors.cardDivider }]}
            />
            <Text style={[styles.priceSuffix, { color: colors.secondaryText }]}>/100g</Text>
          </View>
        </View>

        <View style={styles.itemFooterRow} lightColor="transparent" darkColor="transparent">
          <Text style={[styles.itemMeta, { color: colors.secondaryText }]}>
            Bought {formatGrams(item.purchasedGrams)} / {formatGrams(item.neededGrams)}
            {remaining > 0 ? `, ${formatGrams(remaining)} left` : ', done'}
          </Text>
          <View style={styles.stepperRow} lightColor="transparent" darkColor="transparent">
            <Pressable
              onPress={() => onAdjustPurchased(item.id, -STEP_GRAMS)}
              hitSlop={8}
              style={[styles.stepperButton, { backgroundColor: colors.cardDivider }]}
              accessibilityLabel={`Decrease bought amount of ${item.name}`}
            >
              <FontAwesome name="minus" size={11} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={() => onAdjustPurchased(item.id, STEP_GRAMS)}
              hitSlop={8}
              style={[styles.stepperButton, { backgroundColor: colors.cardDivider }]}
              accessibilityLabel={`Increase bought amount of ${item.name}`}
            >
              <FontAwesome name="plus" size={11} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function GroceryScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const [items, setItems] = useState<GroceryItem[]>([]);
  const seededRef = useRef(false);
  const { profile } = useProfile();
  const { meals, catalog } = usePlan();

  // Colorful per-item rings, matching Home's macro palette - only the top "Spent"
  // summary ring stays dark gray, not every ring on the screen.
  const itemAccentColors = [c.ringProtein, c.ringCarbs, c.ringFat, c.ringCalories];

  // The exact figure the user set during onboarding (or later edited in Settings),
  // normalized to a monthly amount regardless of which period they entered it in -
  // this used to be a hardcoded placeholder, disconnected from what was actually
  // entered, which is the inconsistency this fixes.
  const monthlyBudget = profile ? normalizeToMonthly(profile.budget_amount, profile.budget_period) : 0;

  // Builds the shopping list from the REAL generated meal plan (PlanContext.meals -
  // already budget/diet-aware via lib/mealPlanner.ts) instead of a fixed static list,
  // so a bigger budget or a different diet genuinely changes which foods show up here,
  // not just their price. neededGrams is each food's daily plan quantity scaled to a
  // month. Runs once meals are actually generated (guarded, like the old seeding
  // effect), so later budget/profile edits don't wipe purchased progress already logged.
  //
  // Pricing prefers live per-country research (grocery_price_research, refreshed on
  // signup by the research-grocery-prices Edge Function - real web-searched prices, one
  // per food) over catalog's static priceFR/priceDE estimate, falling back to static if
  // the research row doesn't exist yet, is missing that food, or the query fails.
  useEffect(() => {
    if (!profile || meals.length === 0 || seededRef.current) return;
    seededRef.current = true;

    (async () => {
      const dailyGramsByFood: Record<string, number> = {};
      for (const meal of meals) {
        for (const item of meal.items) {
          dailyGramsByFood[item.foodId] = (dailyGramsByFood[item.foodId] ?? 0) + item.grams;
        }
      }

      let liveTable: Record<string, number> = {};
      try {
        const { data } = await supabase
          .from('grocery_price_research')
          .select('prices')
          .eq('country', profile.country)
          .maybeSingle();
        if (data?.prices) liveTable = data.prices;
      } catch {
        // stays with static catalog prices below
      }

      const built: GroceryItem[] = Object.entries(dailyGramsByFood).map(([foodId, dailyGrams]) => {
        const food = catalog.find((f) => f.id === foodId);
        return {
          id: foodId,
          name: food?.name ?? foodId,
          neededGrams: dailyGrams * DAYS_PER_MONTH,
          pricePer100: liveTable[foodId] ?? food?.pricePer100 ?? 0.5,
          purchasedGrams: 0,
        };
      });
      setItems(built);
    })();
  }, [profile, meals, catalog]);

  const totals = useMemo(() => {
    const spent = items.reduce((s, it) => s + itemCost(it, it.purchasedGrams), 0);
    const projected = items.reduce((s, it) => s + itemCost(it, it.neededGrams), 0);
    return { spent, projected, remaining: monthlyBudget - spent };
  }, [items, monthlyBudget]);

  const handleChangePrice = (id: string, text: string) => {
    const parsed = parseFloat(text.replace(',', '.'));
    if (isNaN(parsed) || parsed < 0) return;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, pricePer100: parsed } : it)));
  };

  const handleAdjustPurchased = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, purchasedGrams: Math.max(0, Math.min(it.neededGrams, it.purchasedGrams + delta)) } : it,
      ),
    );
  };

  return (
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
      <Text style={[styles.eyebrow, { color: c.secondaryText }]}>THIS MONTH</Text>

      <View style={[styles.budgetCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
        <View style={{ flex: 1 }} lightColor="transparent" darkColor="transparent">
          <Text style={[styles.budgetLabel, { color: c.secondaryText }]}>Spent</Text>
          <View style={styles.budgetValueRow} lightColor="transparent" darkColor="transparent">
            <Text style={[styles.budgetValue, { color: c.text }]}>{totals.spent.toFixed(2)}</Text>
            <Text style={[styles.budgetTarget, { color: c.secondaryText }]}> / {monthlyBudget.toFixed(2)} EUR</Text>
          </View>
          <Text style={[styles.projectedText, { color: c.secondaryText }]}>
            Full list would cost {totals.projected.toFixed(2)} EUR - {totals.remaining.toFixed(2)} EUR left in your budget
          </Text>
        </View>
        <ProgressRing size={72} strokeWidth={6} progress={monthlyBudget > 0 ? totals.spent / monthlyBudget : 0} color={c.ringBudget} track={c.ringTrack}>
          <FontAwesome5 name="wallet" size={22} color={WALLET_BROWN} />
        </ProgressRing>
      </View>

      <View style={styles.sectionTitleRow} lightColor="transparent" darkColor="transparent">
        <Text style={[styles.sectionTitle, { color: c.text }]}>Grocery items</Text>
        <View style={[styles.tierBadge, { backgroundColor: c.cardDivider }]}>
          <Text style={[styles.tierBadgeText, { color: totals.projected <= monthlyBudget ? c.ringProtein : c.ringCalories }]}>
            {totals.projected <= monthlyBudget ? 'Within budget' : 'Over budget'}
          </Text>
        </View>
      </View>
      <View style={[styles.itemsCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
        {items.map((item, i) => (
          <GroceryRow
            key={item.id}
            item={item}
            colors={{ ...c, cardDivider: i === 0 ? 'transparent' : c.cardDivider }}
            accentColor={itemAccentColors[i % itemAccentColors.length]}
            onChangePrice={handleChangePrice}
            onAdjustPurchased={handleAdjustPurchased}
          />
        ))}
      </View>

      <Text style={[styles.subtitle, { color: c.secondaryText }]}>
        Tap a price to edit it if you find it cheaper elsewhere - it updates your monthly total.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 120 },
  eyebrow: { fontSize: 12, fontWeight: '600', letterSpacing: 2, marginBottom: 16 },

  budgetCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 22, padding: 20, marginBottom: 32, borderWidth: StyleSheet.hairlineWidth,
  },
  budgetLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  budgetValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  budgetValue: { fontFamily: 'SpaceMono', fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  budgetTarget: { fontSize: 13, fontWeight: '600' },
  projectedText: { fontSize: 12, fontWeight: '600', marginTop: 10, lineHeight: 17 },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  tierBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  tierBadgeText: { fontSize: 11, fontWeight: '700' },
  itemsCard: { borderRadius: 20, paddingHorizontal: 20, marginBottom: 24, borderWidth: StyleSheet.hairlineWidth },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth },
  itemHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: { fontSize: 15, fontWeight: '700' },
  priceInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  priceCurrency: { fontSize: 12, fontWeight: '600' },
  priceInput: {
    fontFamily: 'SpaceMono', fontSize: 14, fontWeight: '700', minWidth: 44, textAlign: 'right',
    paddingVertical: 2, borderBottomWidth: 1,
  },
  priceSuffix: { fontSize: 11, fontWeight: '600' },

  itemFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemMeta: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  stepperRow: { flexDirection: 'row', gap: 8 },
  stepperButton: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },

  subtitle: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
