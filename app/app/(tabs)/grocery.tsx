import { useMemo, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, TextInput, View as RNView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { GroceryItem, formatGrams, initialGroceryItems, itemCost, normalizeToMonthly } from '@/constants/groceryData';
import { useTabSlide } from '@/components/useTabSlide';
import { ProgressRing } from '@/components/ProgressRing';
import { useProfile } from '@/context/ProfileContext';

const STEP_GRAMS = 250;
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
  const [items, setItems] = useState(initialGroceryItems);
  const slideStyle = useTabSlide('grocery');
  const { profile } = useProfile();

  // Colorful per-item rings, matching Home's macro palette - only the top "Spent"
  // summary ring stays dark gray, not every ring on the screen.
  const itemAccentColors = [c.ringProtein, c.ringCarbs, c.ringFat, c.ringCalories];

  // The exact figure the user set during onboarding (or later edited in Settings),
  // normalized to a monthly amount regardless of which period they entered it in -
  // this used to be a hardcoded placeholder, disconnected from what was actually
  // entered, which is the inconsistency this fixes.
  const monthlyBudget = profile ? normalizeToMonthly(profile.budget_amount, profile.budget_period) : 0;

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
    <Animated.View style={[{ flex: 1 }, slideStyle]}>
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

      <Text style={[styles.sectionTitle, { color: c.text }]}>Grocery items</Text>
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
    </Animated.View>
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

  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 16 },
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
