import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * `detectSessionInUrl: false` (set in lib/supabase.ts, since that option assumes a
 * browser) means nothing automatically turns the myapp:// redirect from a
 * confirmation/reset email into a session - this does that manually. Handles both
 * PKCE (`?code=`) and implicit (`#access_token=`) flows since Supabase's exact
 * behavior here isn't something to assume without testing against the real project.
 */
async function handleAuthDeepLink(url: string) {
  if (!url.includes('code=') && !url.includes('access_token=')) return;

  const { queryParams } = Linking.parse(url);
  const code = queryParams?.code;
  if (typeof code === 'string') {
    await supabase.auth.exchangeCodeForSession(code);
    return;
  }

  const hashMatch = url.match(/#(.+)/);
  if (hashMatch) {
    const params = new URLSearchParams(hashMatch[1]);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  }
}

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  requestAccountDeletion: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    // App was cold-started by tapping the email link.
    Linking.getInitialURL().then((url) => {
      if (url) handleAuthDeepLink(url);
    });
    // App was already running (backgrounded) when the link was tapped.
    const linkSub = Linking.addEventListener('url', ({ url }) => handleAuthDeepLink(url));

    return () => {
      listener.subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  const signUp: AuthContextValue['signUp'] = async (email, password) => {
    // Without this, Supabase falls back to its default "localhost:3000" redirect,
    // which can't open on a phone - the app's own URL scheme lets the confirmation
    // link hand off back into the app instead. Must also be added to the project's
    // allowed Redirect URLs in the Supabase dashboard, or Supabase will reject it.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: 'myapp://' },
    });
    if (error) return { error: error.message, needsEmailConfirmation: false };
    // Supabase returns a user with no session when email confirmation is required.
    const needsEmailConfirmation = Boolean(data.user) && !data.session;
    return { error: null, needsEmailConfirmation };
  };

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword: AuthContextValue['resetPassword'] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'myapp://' });
    return { error: error ? error.message : null };
  };

  // Doesn't delete anything itself - emails a one-time confirmation link (see
  // supabase/functions/request-account-deletion) and only supabase/functions/
  // confirm-account-deletion, triggered by clicking it, actually deletes the account.
  // Nothing changes locally here since nothing has been deleted yet.
  const requestAccountDeletion = async (): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.functions.invoke('request-account-deletion');
    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ session, loading, signUp, signIn, signOut, resetPassword, requestAccountDeletion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
