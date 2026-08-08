import { createContext, ReactNode, useContext, useState } from 'react';

import { initialMeals, Meal } from '@/constants/planData';
import { FoodCatalogEntry, foodCatalog as staticFoodCatalog } from '@/constants/foodCatalog';

type PlanContextValue = {
  meals: Meal[];
  toggleEaten: (mealId: string) => void;
  updateItemGrams: (mealId: string, itemId: string, grams: number) => void;
  removeItem: (mealId: string, itemId: string) => void;
  addItem: (mealId: string, foodId: string) => void;
  catalog: FoodCatalogEntry[];
  getFoodFromCatalog: (foodId: string) => FoodCatalogEntry | undefined;
  addFoodToCatalog: (entry: FoodCatalogEntry) => void;
};

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

/** Shared across Home, the meal-detail modal, and the scan modal so edits/scans in one show up everywhere. */
export function PlanProvider({ children }: { children: ReactNode }) {
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [catalog, setCatalog] = useState<FoodCatalogEntry[]>(staticFoodCatalog);

  const toggleEaten = (mealId: string) => {
    setMeals((prev) => prev.map((m) => (m.id === mealId ? { ...m, eaten: !m.eaten } : m)));
  };

  const updateItemGrams = (mealId: string, itemId: string, grams: number) => {
    setMeals((prev) =>
      prev.map((m) =>
        m.id !== mealId ? m : { ...m, items: m.items.map((it) => (it.id === itemId ? { ...it, grams: Math.max(0, grams) } : it)) },
      ),
    );
  };

  const removeItem = (mealId: string, itemId: string) => {
    setMeals((prev) => prev.map((m) => (m.id !== mealId ? m : { ...m, items: m.items.filter((it) => it.id !== itemId) })));
  };

  const addItem = (mealId: string, foodId: string) => {
    setMeals((prev) =>
      prev.map((m) =>
        m.id !== mealId ? m : { ...m, items: [...m.items, { id: `${foodId}-${Date.now()}`, foodId, grams: 100 }] },
      ),
    );
  };

  const getFoodFromCatalog = (foodId: string) => catalog.find((f) => f.id === foodId);

  const addFoodToCatalog = (entry: FoodCatalogEntry) => {
    setCatalog((prev) => (prev.some((f) => f.id === entry.id) ? prev : [...prev, entry]));
  };

  return (
    <PlanContext.Provider
      value={{ meals, toggleEaten, updateItemGrams, removeItem, addItem, catalog, getFoodFromCatalog, addFoodToCatalog }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}
