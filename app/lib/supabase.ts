import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True once real Supabase credentials are in `.env` (see `.env.example`). Auth
 * screens check this and show a clear setup message instead of crashing when
 * they're missing - expected during development until the project is connected.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// AsyncStorage assumes `window` exists, which breaks this project's static web
// pre-rendering (runs in Node, no DOM). Only use it on native; on web, leaving
// `storage` unset lets Supabase fall back to its own SSR-safe default.
const authStorage = Platform.OS === 'web' ? undefined : AsyncStorage;

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-anon-key', {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
