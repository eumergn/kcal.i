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

export default function TermsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  return (
    <>
      <Stack.Screen options={{ title: 'Terms and Conditions' }} />
      <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
        <Text style={[styles.updated, { color: c.secondaryText }]}>Last updated: {LAST_UPDATED}</Text>
        <Text style={[styles.intro, { color: c.secondaryText }]}>
          By creating an account and using kcal.i, you agree to the terms below. This is a plain-language
          draft reflecting how the app actually works, not a substitute for legal advice.
        </Text>

        <Section title="Not medical advice" c={c}>
          {'kcal.i calculates calorie, macro and water targets from formulas based on published '}
          {'nutrition science (Mifflin-St Jeor and related research), using the information you '}
          {'provide. It is a planning tool, not medical, dietetic, or health advice, and is not a '}
          {'substitute for consulting a doctor or registered dietitian - especially if you have a '}
          {'medical condition, are pregnant, or have a history of disordered eating.'}
        </Section>

        <Section title="Your account" c={c}>
          {'You are responsible for the accuracy of the information you provide and for keeping your '}
          {'login credentials secure. You must be old enough to legally consent to these terms in your '}
          {'country of residence.'}
        </Section>

        <Section title="Grocery pricing" c={c}>
          {'Grocery prices shown in the app are estimates - either researched via an AI web-search '}
          {'lookup or manually curated - and are not a live, guaranteed feed of current store prices. '}
          {'Always verify actual prices before making purchasing decisions based on your budget.'}
        </Section>

        <Section title="Acceptable use" c={c}>
          {'You agree not to misuse the app: no attempting to disrupt its infrastructure, scrape it at '}
          {'scale, reverse engineer it beyond what applicable law permits, or use it for any unlawful '}
          {'purpose.'}
        </Section>

        <Section title="Ending your account" c={c}>
          {'You may stop using the app at any time. Deleting your account from Profile > Delete '}
          {'account permanently and irreversibly removes your data as described in the Privacy Policy.'}
        </Section>

        <Section title="No warranty, limitation of liability" c={c}>
          {'kcal.i is provided "as is", without warranty of any kind. Nutrition calculations, meal '}
          {'plans and price estimates are provided for general guidance only. To the maximum extent '}
          {'permitted by law, the developer is not liable for any outcome resulting from your use of '}
          {'the app, including decisions about diet, exercise, or spending.'}
        </Section>

        <Section title="Changes to these terms" c={c}>
          {'These terms may be updated as the app evolves. Continuing to use the app after a change '}
          {'means you accept the updated terms.'}
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
