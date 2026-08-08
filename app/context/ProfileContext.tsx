import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export type Sex = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
export type Goal = 'cut' | 'bulk' | 'maintain' | 'recomposition';
export type DietType = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'halal' | 'kosher';
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly';

export type OnboardingProfile = {
  first_name: string;
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  goal: Goal;
  activity_level: ActivityLevel;
  gym_days_per_week: number;
  country: 'FR' | 'DE';
  budget_amount: number;
  budget_period: BudgetPeriod;
  diet_type: DietType;
  allergies: string[];
};

type ProfileStatus = 'loading' | 'missing' | 'present';

type ProfileContextValue = {
  status: ProfileStatus;
  createProfile: (profile: OnboardingProfile) => Promise<{ error: string | null }>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [status, setStatus] = useState<ProfileStatus>('loading');

  useEffect(() => {
    if (!session || !isSupabaseConfigured) {
      setStatus('loading');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    supabase
      .from('user_profile')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setStatus(data ? 'present' : 'missing');
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  const createProfile = async (profile: OnboardingProfile): Promise<{ error: string | null }> => {
    if (!session) return { error: 'No active session.' };
    const { error } = await supabase.from('user_profile').insert({
      id: session.user.id,
      currency: 'EUR', // both launch countries (FR/DE) use EUR
      ...profile,
    });
    if (error) return { error: error.message };
    setStatus('present');
    return { error: null };
  };

  return <ProfileContext.Provider value={{ status, createProfile }}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
