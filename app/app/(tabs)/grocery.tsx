import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View as RNView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { GroceryItem, formatGrams, initialGroceryItems, itemCost, monthlyBudget } from '@/constants/groceryData';

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const STEP_GRAMS = 250;

function BudgetBar({ pct, color, track }: { pct: number; color: string; track: string }) {
  const widthAnim = useRef(new Animated.Value(Math.min(pct, 1))).current;

  useEffect(() => {
    Animated.timing(widthAnim, { toValue: Math.min(pct, 1), duration: 420, easing: EASE_OUT, useNativeDriver: false }).start();
  }, [pct, widthAnim]);

  const width = widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <RNView style={[styles.barTrack, { backgroundColor: track }]}>
      <Animated.View style={[styles.barFill, { width, backgroundColor: color }]} />
    </RNView>
  );
}

function GroceryRow({
  item,
  colors,
  onChangePrice,
  onAdjustPurchased,
}: {
  item: GroceryItem;
  colors: (typeof Colors)['light'];
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

  return (
    <View style={[styles.itemRow, { borderTopColor: colors.cardDivider }]} lightColor="transparent" darkColor="transparent">
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

      <BudgetBar pct={pct} color={colors.ringBudget} track={colors.ringTrack} />

      <View style={styles.itemFooterRow} lightColor="transparent" darkColor="transparent">
        <Text style={[styles.itemMeta, { color: colors.secondaryText }]}>
          Bought {formatGrams(item.purchasedGrams)} / {formatGrams(item.neededGrams)}
          {remaining > 0 ? ` · ${formatGrams(remaining)} left` : ' · done'}
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
  );
}

export default function GroceryScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const [items, setItems] = useState(initialGroceryItems);

  const totals = useMemo(() => {
    const spent = items.reduce((s, it) => s + itemCost(it, it.purchasedGrams), 0);
    const projected = items.reduce((s, it) => s + itemCost(it, it.neededGrams), 0);
    return { spent, projected, remaining: monthlyBudget - spent };
  }, [items]);

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
        <Text style={[styles.budgetLabel, { color: c.secondaryText }]}>Spent</Text>
        <View style={styles.budgetValueRow} lightColor="transparent" darkColor="transparent">
          <Text style={[styles.budgetValue, { color: c.text }]}>{totals.spent.toFixed(2)}</Text>
          <Text style={[styles.budgetTarget, { color: c.secondaryText }]}> / {monthlyBudget.toFixed(2)} {'EUR'}</Text>
        </View>
        <BudgetBar pct={totals.spent / monthlyBudget} color={c.ringBudget} track={c.ringTrack} />
        <Text style={[styles.projectedText, { color: c.secondaryText }]}>
          Projected if you buy everything: {totals.projected.toFixed(2)} EUR · {totals.remaining.toFixed(2)} EUR left to spend
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: c.text }]}>Grocery items</Text>
      <View style={[styles.itemsCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
        {items.map((item, i) => (
          <GroceryRow
            key={item.id}
            item={item}
            colors={{ ...c, cardDivider: i === 0 ? 'transparent' : c.cardDivider }}
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

  budgetCard: { borderRadius: 22, padding: 20, marginBottom: 32, borderWidth: StyleSheet.hairlineWidth },
  budgetLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  budgetValueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  budgetValue: { fontFamily: 'SpaceMono', fontSize: 34, fontWeight: '700', letterSpacing: -1 },
  budgetTarget: { fontSize: 14, fontWeight: '600' },
  projectedText: { fontSize: 12, fontWeight: '600', marginTop: 12 },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },

  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 16 },
  itemsCard: { borderRadius: 20, paddingHorizontal: 20, marginBottom: 24, borderWidth: StyleSheet.hairlineWidth },

  itemRow: { paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
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
