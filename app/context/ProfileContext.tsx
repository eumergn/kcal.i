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

type StoredProfile = OnboardingProfile & { currency: string };

type ProfileStatus = 'loading' | 'missing' | 'present';

type ProfileContextValue = {
  status: ProfileStatus;
  profile: StoredProfile | null;
  createProfile: (profile: OnboardingProfile) => Promise<{ error: string | null }>;
  updateProfile: (patch: Partial<OnboardingProfile>) => Promise<{ error: string | null }>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [status, setStatus] = useState<ProfileStatus>('loading');
  const [profile, setProfile] = useState<StoredProfile | null>(null);

  useEffect(() => {
    if (!session || !isSupabaseConfigured) {
      setStatus('loading');
      setProfile(null);
      return;
    }

    let cancelled = false;
    setStatus('loading');

    supabase
      .from('user_profile')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile(data as StoredProfile | null);
        setStatus(data ? 'present' : 'missing');
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  const createProfile = async (newProfile: OnboardingProfile): Promise<{ error: string | null }> => {
    if (!session) return { error: 'No active session.' };
    // upsert, not insert: a stale row from an earlier attempt (or a double-tap on the
    // final "Create my plan" button before the button had a chance to disable) would
    // otherwise fail with a duplicate primary key instead of just settling on the
    // latest answers.
    const record = { id: session.user.id, currency: 'EUR', ...newProfile }; // both launch countries (FR/DE) use EUR
    const { error } = await supabase.from('user_profile').upsert(record, { onConflict: 'id' });
    if (error) return { error: error.message };
    setProfile(record);
    setStatus('present');
    return { error: null };
  };

  const updateProfile = async (patch: Partial<OnboardingProfile>): Promise<{ error: string | null }> => {
    if (!session) return { error: 'No active session.' };
    const { error } = await supabase.from('user_profile').update(patch).eq('id', session.user.id);
    if (error) return { error: error.message };
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    return { error: null };
  };

  return <ProfileContext.Provider value={{ status, profile, createProfile, updateProfile }}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
