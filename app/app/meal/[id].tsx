import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View as RNView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { usePlan } from '@/context/PlanContext';
import { mealTotals } from '@/constants/planData';

function ItemRow({
  itemId,
  mealId,
  foodId,
  grams,
  colors,
}: {
  itemId: string;
  mealId: string;
  foodId: string;
  grams: number;
  colors: (typeof Colors)['light'];
}) {
  const { updateItemGrams, removeItem, getFoodFromCatalog } = usePlan();
  const food = getFoodFromCatalog(foodId);
  const [gramsText, setGramsText] = useState(String(grams));

  if (!food) return null; // shouldn't happen, but guards against a stale catalog reference

  const commit = () => {
    const parsed = parseInt(gramsText, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      updateItemGrams(mealId, itemId, parsed);
    } else {
      setGramsText(String(grams));
    }
  };

  const calories = Math.round((food.caloriesPer100 * grams) / 100);

  return (
    <View style={[styles.itemRow, { borderTopColor: colors.cardDivider }]} lightColor="transparent" darkColor="transparent">
      <View style={styles.itemTextCol} lightColor="transparent" darkColor="transparent">
        <Text style={[styles.itemName, { color: colors.text }]}>{food.name}</Text>
        <Text style={[styles.itemMeta, { color: colors.secondaryText }]}>{calories} kcal</Text>
      </View>
      <TextInput
        value={gramsText}
        onChangeText={setGramsText}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="number-pad"
        style={[styles.gramsInput, { color: colors.text, borderBottomColor: colors.cardDivider }]}
      />
      <Text style={[styles.gramsSuffix, { color: colors.secondaryText }]}>g</Text>
      <Pressable
        onPress={() => removeItem(mealId, itemId)}
        hitSlop={10}
        style={styles.removeButton}
        accessibilityLabel={`Remove ${food.name}`}
      >
        <FontAwesome name="trash-o" size={18} color={colors.secondaryText} />
      </Pressable>
    </View>
  );
}

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { meals, toggleEaten, addItem, catalog } = usePlan();

  const meal = meals.find((m) => m.id === id);

  if (!meal) {
    return (
      <View style={[styles.content, { backgroundColor: c.background }]}>
        <Text style={{ color: c.text }}>Meal not found.</Text>
      </View>
    );
  }

  const totals = mealTotals(meal.items, catalog);
  const usedFoodIds = new Set(meal.items.map((it) => it.foodId));
  const availableToAdd = catalog.filter((f) => !usedFoodIds.has(f.id));

  return (
    <>
      <Stack.Screen options={{ title: meal.name }} />
      <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
        <Text style={[styles.time, { color: c.secondaryText }]}>{meal.time}</Text>

        <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
          <Text style={[styles.summaryCalories, { color: c.text }]}>{Math.round(totals.calories)} kcal</Text>
          <Text style={styles.summaryMacros}>
            <Text style={{ color: c.ringProtein, fontWeight: '700' }}>P {Math.round(totals.proteinG)}g</Text>
            <Text style={{ color: c.secondaryText }}> · </Text>
            <Text style={{ color: c.ringCarbs, fontWeight: '700' }}>C {Math.round(totals.carbsG)}g</Text>
            <Text style={{ color: c.secondaryText }}> · </Text>
            <Text style={{ color: c.ringFat, fontWeight: '700' }}>F {Math.round(totals.fatG)}g</Text>
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: c.text }]}>Ingredients</Text>
        <View style={[styles.itemsCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
          {meal.items.length === 0 && (
            <Text style={[styles.emptyText, { color: c.secondaryText }]}>No ingredients yet - add some below.</Text>
          )}
          {meal.items.map((item, i) => (
            <RNView key={item.id} style={i > 0 ? { borderTopWidth: 0 } : undefined}>
              <ItemRow itemId={item.id} mealId={meal.id} foodId={item.foodId} grams={item.grams} colors={{ ...c, cardDivider: i === 0 ? 'transparent' : c.cardDivider }} />
            </RNView>
          ))}
        </View>

        {availableToAdd.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Add food</Text>
            <View style={styles.chipsWrap}>
              {availableToAdd.map((food) => (
                <Pressable
                  key={food.id}
                  onPress={() => addItem(meal.id, food.id)}
                  style={[styles.chip, { backgroundColor: c.card, borderColor: c.cardDivider }]}
                >
                  <FontAwesome name="plus" size={11} color={c.ringCalories} />
                  <Text style={[styles.chipText, { color: c.text }]}>{food.name}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Pressable
          onPress={() => toggleEaten(meal.id)}
          style={[styles.eatenButton, { backgroundColor: meal.eaten ? c.cardDivider : c.ringCalories }]}
        >
          <Text style={[styles.eatenButtonText, { color: meal.eaten ? c.text : '#04110D' }]}>
            {meal.eaten ? 'Unmark as eaten' : 'Mark as eaten'}
          </Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  time: { fontSize: 13, fontWeight: '600', marginBottom: 16 },

  summaryCard: { borderRadius: 20, padding: 20, marginBottom: 28, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  summaryCalories: { fontFamily: 'SpaceMono', fontSize: 30, fontWeight: '700' },
  summaryMacros: { fontSize: 13, fontWeight: '600', marginTop: 8 },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  itemsCard: { borderRadius: 18, paddingHorizontal: 16, marginBottom: 28, borderWidth: StyleSheet.hairlineWidth },
  emptyText: { fontSize: 13, fontWeight: '600', paddingVertical: 16 },

  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  itemTextCol: { flex: 1, gap: 3 },
  itemName: { fontSize: 15, fontWeight: '700' },
  itemMeta: { fontSize: 12, fontWeight: '600' },
  gramsInput: { fontFamily: 'SpaceMono', fontSize: 14, fontWeight: '700', minWidth: 40, textAlign: 'right', borderBottomWidth: 1, paddingVertical: 2 },
  gramsSuffix: { fontSize: 12, fontWeight: '600' },
  removeButton: { paddingLeft: 6 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  chipText: { fontSize: 13, fontWeight: '600' },

  eatenButton: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  eatenButtonText: { fontSize: 15, fontWeight: '700' },
});
