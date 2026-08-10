import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View as RNView } from 'react-native';
import { Link, router } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { AuthTextInput } from '@/components/AuthTextInput';
import { Logo } from '@/components/Logo';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { setSignInLogoCenterY } from '@/lib/introTransition';

export default function SignInScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logoWrapRef = useRef<RNView>(null);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);
    if (signInError) setError(signInError);
    // On success, the root layout's session check automatically switches to the app.
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
        <RNView
          ref={logoWrapRef}
          style={styles.logoWrap}
          onLayout={() => {
            // Reports where the logo actually lands so intro.tsx's glide-transition
            // can target the real position instead of guessing it.
            logoWrapRef.current?.measureInWindow((_x, y, _width, height) => {
              setSignInLogoCenterY(y + height / 2);
            });
          }}
        >
          <Logo />
        </RNView>
        <Text style={[styles.title, { color: c.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: c.secondaryText }]}>Sign in to see today&apos;s plan.</Text>

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
            autoComplete="password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={[styles.errorText, { color: c.ringProtein }]}>{error}</Text>}

          <Pressable
            onPress={handleSignIn}
            disabled={loading || !isSupabaseConfigured}
            style={[styles.primaryButton, { backgroundColor: c.ringCalories, opacity: loading || !isSupabaseConfigured ? 0.5 : 1 }]}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Sign In</Text>}
          </Pressable>

          <Link href="/forgot-password" asChild>
            <Pressable style={styles.linkButton}>
              <Text style={[styles.linkText, { color: c.secondaryText }]}>Forgot password?</Text>
            </Pressable>
          </Link>
        </View>

        <Pressable onPress={() => router.push('/sign-up')} style={styles.footer}>
          <Text style={[styles.footerText, { color: c.secondaryText }]}>
            Don&apos;t have an account? <Text style={{ color: c.ringCalories, fontWeight: '700' }}>Sign up</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 6, marginBottom: 28 },

  warningBanner: { borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: StyleSheet.hairlineWidth },
  warningText: { fontSize: 12, fontWeight: '600', lineHeight: 17 },

  form: { gap: 12 },
  errorText: { fontSize: 13, fontWeight: '600' },

  primaryButton: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  linkButton: { alignItems: 'center', paddingVertical: 10 },
  linkText: { fontSize: 13, fontWeight: '600' },

  footer: { alignItems: 'center', marginTop: 32 },
  footerText: { fontSize: 14, fontWeight: '600' },
});
