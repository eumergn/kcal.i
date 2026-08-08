import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type WeightEntry = { date: string; weightKg: number }; // date is YYYY-MM-DD

type WeightContextValue = {
  entries: WeightEntry[];
  goalWeightKg: number | null;
  loaded: boolean;
  logWeight: (weightKg: number) => void;
  setGoalWeightKg: (weightKg: number) => void;
  seedFromOnboarding: (currentWeightKg: number, goalWeightKg: number) => void;
};

const STORAGE_KEY = 'kcal-i:weight-log';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

const WeightContext = createContext<WeightContextValue | undefined>(undefined);

/**
 * Weight has no column in the Supabase schema yet (added late, after the migration
 * was written) - this persists on-device via AsyncStorage instead of leaving the log
 * fake or losing it on reload. Real, just not cloud-synced yet.
 */
export function WeightProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [goalWeightKg, setGoalWeightKgState] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as { entries: WeightEntry[]; goalWeightKg: number | null };
          setEntries(parsed.entries ?? []);
          setGoalWeightKg_local(parsed.goalWeightKg ?? null);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const persist = (nextEntries: WeightEntry[], nextGoal: number | null) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ entries: nextEntries, goalWeightKg: nextGoal }));
  };

  const setGoalWeightKg_local = (v: number | null) => setGoalWeightKgState(v);

  const logWeight = (weightKg: number) => {
    setEntries((prev) => {
      const today = todayKey();
      const withoutToday = prev.filter((e) => e.date !== today); // one entry per day - editing today replaces it
      const next = [...withoutToday, { date: today, weightKg }].sort((a, b) => a.date.localeCompare(b.date));
      persist(next, goalWeightKg);
      return next;
    });
  };

  const setGoalWeightKg = (weightKg: number) => {
    setGoalWeightKgState(weightKg);
    persist(entries, weightKg);
  };

  const seedFromOnboarding = (currentWeightKg: number, goalKg: number) => {
    const today = todayKey();
    const seeded: WeightEntry[] = [{ date: today, weightKg: currentWeightKg }];
    setEntries(seeded);
    setGoalWeightKgState(goalKg);
    persist(seeded, goalKg);
  };

  return (
    <WeightContext.Provider value={{ entries, goalWeightKg, loaded, logWeight, setGoalWeightKg, seedFromOnboarding }}>
      {children}
    </WeightContext.Provider>
  );
}

export function useWeight(): WeightContextValue {
  const ctx = useContext(WeightContext);
  if (!ctx) throw new Error('useWeight must be used within WeightProvider');
  return ctx;
}
