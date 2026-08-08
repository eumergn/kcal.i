import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import { AuthTextInput } from '@/components/AuthTextInput';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) {
      setError('Enter your email.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: resetError } = await resetPassword(email.trim());
    setLoading(false);
    if (resetError) {
      setError(resetError);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <FontAwesome name="envelope-o" size={32} color={c.ringCalories} style={{ marginBottom: 16 }} />
        <Text style={[styles.title, { color: c.text }]}>Check your email</Text>
        <Text style={[styles.subtitle, { color: c.secondaryText }]}>
          If an account exists for {email}, we sent a link to reset your password.
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
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
        <Text style={[styles.title, { color: c.text }]}>Reset your password</Text>
        <Text style={[styles.subtitle, { color: c.secondaryText }]}>We&apos;ll email you a link to set a new one.</Text>

        {!isSupabaseConfigured && (
          <View style={[styles.warningBanner, { backgroundColor: c.card }]}>
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

          {error && <Text style={[styles.errorText, { color: c.ringProtein }]}>{error}</Text>}

          <Pressable
            onPress={handleReset}
            disabled={loading || !isSupabaseConfigured}
            style={[styles.primaryButton, { backgroundColor: c.ringCalories, opacity: loading || !isSupabaseConfigured ? 0.5 : 1 }]}
          >
            {loading ? <ActivityIndicator color="#04110D" /> : <Text style={styles.primaryButtonText}>Send Reset Link</Text>}
          </Pressable>
        </View>

        <Pressable onPress={() => router.back()} style={styles.footer}>
          <Text style={[styles.footerText, { color: c.secondaryText }]}>Back to sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  content: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logo: { width: 56, height: 56, borderRadius: 16, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 6, marginBottom: 28 },

  warningBanner: { borderRadius: 14, padding: 14, marginBottom: 20 },
  warningText: { fontSize: 12, fontWeight: '600', lineHeight: 17 },

  form: { gap: 12 },
  errorText: { fontSize: 13, fontWeight: '600' },

  primaryButton: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { fontSize: 15, fontWeight: '700', color: '#04110D' },

  footer: { alignItems: 'center', marginTop: 32 },
  footerText: { fontSize: 14, fontWeight: '600' },
});
