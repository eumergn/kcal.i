import { ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const LAST_UPDATED = 'August 2026';

function Section({ title, children, c }: { title: string; children: React.ReactNode; c: (typeof Colors)['light'] }) {
  return (
    <View style={{ marginBottom: 24 }} lightColor="transparent" darkColor="transparent">
      <Text style={[styles.heading, { color: c.text }]}>{title}</Text>
      <Text style={[styles.body, { color: c.secondaryText }]}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  return (
    <>
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
        <Text style={[styles.updated, { color: c.secondaryText }]}>Last updated: {LAST_UPDATED}</Text>
        <Text style={[styles.intro, { color: c.secondaryText }]}>
          This is a plain-language description of what kcal.i actually collects and does with your
          data, kept accurate to how the app is really built rather than generic boilerplate. It is
          not a substitute for legal advice.
        </Text>

        <Section title="What we collect" c={c}>
          {'Account: email address and password (handled by our authentication provider, Supabase - '}
          {'we never see or store your raw password).\n\n'}
          {'Health and fitness profile: age, sex, height, weight, activity level, fitness goal, '}
          {'dietary type, allergies and gym frequency, collected during onboarding to calculate your '}
          {'personalized calorie, macro and water targets.\n\n'}
          {'Budget and location: your grocery budget and country, used to generate cost-aware meal '}
          {'plans and grocery pricing.\n\n'}
          {'Usage data you generate: meals you log, weight entries, and foods you scan or add.'}
        </Section>

        <Section title="How it's used" c={c}>
          {'Solely to run the app for you: computing your nutrition targets, generating your daily '}
          {'meal and grocery plans, and showing your own progress over time. We do not use your data '}
          {'to train models, build advertising profiles, or for any purpose beyond delivering the app.'}
        </Section>

        <Section title="Where it's stored" c={c}>
          {'Your account and profile data are stored in a Supabase-hosted Postgres database in the EU '}
          {'(eu-west-1). Some settings (theme, units, weight log, water goal) are stored only on your '}
          {'own device and are not synced to our servers.'}
        </Section>

        <Section title="Third parties" c={c}>
          {'Barcode scans are looked up via OpenFoodFacts, a free public product database - only the '}
          {'scanned barcode number is sent, nothing that identifies you.\n\n'}
          {"Grocery price research uses Google's Gemini API with web search - only a country code and "}
          {'generic food names are sent, never your personal or profile data.\n\n'}
          {'We do not use advertising networks, analytics/tracking SDKs, or sell your data to anyone.'}
        </Section>

        <Section title="Data retention" c={c}>
          {'Detailed daily food logs older than 90 days are automatically rolled up into monthly '}
          {'summaries and the detailed rows removed. Notification history is purged after 60 days. '}
          {'Your profile and weight history are kept for as long as your account exists.'}
        </Section>

        <Section title="Your rights" c={c}>
          {'You can permanently delete your account and all associated data at any time from Profile '}
          {'> Delete account. We email you a confirmation link before anything is deleted - clicking it '}
          {'irreversibly removes your profile, meal history, weight log and everything else tied to '}
          {'your account from our servers.'}
        </Section>

        <Section title="Contact" c={c}>
          {'Questions about this policy or your data can be sent to the developer via the app store '}
          {'listing this app was installed from.'}
        </Section>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 60 },
  updated: { fontSize: 12, fontWeight: '600', marginBottom: 12 },
  intro: { fontSize: 13, fontWeight: '600', lineHeight: 19, marginBottom: 28 },
  heading: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  body: { fontSize: 13, lineHeight: 20 },
});
