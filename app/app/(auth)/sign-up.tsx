import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import { AuthTextInput } from '@/components/AuthTextInput';
import { Logo } from '@/components/Logo';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function SignUpScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: signUpError, needsEmailConfirmation } = await signUp(email.trim(), password);
    setLoading(false);
    if (signUpError) {
      setError(signUpError);
      return;
    }
    if (needsEmailConfirmation) {
      setConfirmationSent(true);
    }
    // If confirmation isn't required, a session is created immediately and the
    // root layout's auth check switches to the app automatically.
  };

  if (confirmationSent) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <FontAwesome name="envelope-o" size={32} color={c.ringCalories} style={{ marginBottom: 16 }} />
        <Text style={[styles.title, { color: c.text }]}>Check your email</Text>
        <Text style={[styles.subtitle, { color: c.secondaryText }]}>
          We sent a confirmation link to {email}. Confirm it, then come back and sign in.
        </Text>
        <Pressable onPress={() => router.replace('/sign-in')} style={[styles.primaryButton, { backgroundColor: c.ringCalories, marginTop: 24 }]}>
          <Text style={styles.primaryButtonText}>Back to sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
        <View style={styles.logoWrap} lightColor="transparent" darkColor="transparent">
          <Logo />
        </View>
        <Text style={[styles.title, { color: c.text }]}>Create your account</Text>
        <Text style={[styles.subtitle, { color: c.secondaryText }]}>Start tracking your goal, budget, and meals.</Text>

        {!isSupabaseConfigured && (
          <View style={[styles.warningBanner, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
            <Text style={[styles.warningText, { color: c.ringProtein }]}>
              Supabase isn&apos;t connected yet - add your project URL and anon key to .env (see .env.example).
            </Text>
          </View>
        )}

        <View style={styles.form} lightColor="transparent" darkColor="transparent">
          <AuthTextInput
            placeholder="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <AuthTextInput
            placeholder="Password"
            autoCapitalize="none"
            autoComplete="new-password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <AuthTextInput
            placeholder="Confirm password"
            autoCapitalize="none"
            autoComplete="new-password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {error && <Text style={[styles.errorText, { color: c.ringProtein }]}>{error}</Text>}

          <Pressable
            onPress={handleSignUp}
            disabled={loading || !isSupabaseConfigured}
            style={[styles.primaryButton, { backgroundColor: c.ringCalories, opacity: loading || !isSupabaseConfigured ? 0.5 : 1 }]}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Create Account</Text>}
          </Pressable>
        </View>

        <Pressable onPress={() => router.push('/sign-in')} style={styles.footer}>
          <Text style={[styles.footerText, { color: c.secondaryText }]}>
            Already have an account? <Text style={{ color: c.ringCalories, fontWeight: '700' }}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  content: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 6, marginBottom: 28 },

  warningBanner: { borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: StyleSheet.hairlineWidth },
  warningText: { fontSize: 12, fontWeight: '600', lineHeight: 17 },

  form: { gap: 12 },
  errorText: { fontSize: 13, fontWeight: '600' },

  primaryButton: { borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  footer: { alignItems: 'center', marginTop: 32 },
  footerText: { fontSize: 14, fontWeight: '600' },
});
