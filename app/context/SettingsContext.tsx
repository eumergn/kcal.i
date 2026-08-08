import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Units = 'metric' | 'imperial';

type Settings = {
  units: Units;
  waterGoalLiters: number;
  notificationsEnabled: boolean;
};

type SettingsContextValue = Settings & {
  loaded: boolean;
  setUnits: (units: Units) => void;
  setWaterGoalLiters: (liters: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
};

const STORAGE_KEY = 'kcal-i:settings';
const DEFAULTS: Settings = { units: 'metric', waterGoalLiters: 2, notificationsEnabled: true };

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

/** On-device preferences - no server column for any of these yet, so AsyncStorage
 * is the honest source of truth rather than pretending they sync across devices. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
      })
      .finally(() => setLoaded(true));
  }, []);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        loaded,
        setUnits: (units) => update({ units }),
        setWaterGoalLiters: (waterGoalLiters) => update({ waterGoalLiters }),
        setNotificationsEnabled: (notificationsEnabled) => update({ notificationsEnabled }),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
