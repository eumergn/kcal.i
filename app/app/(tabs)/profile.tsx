import { Animated, Pressable, ScrollView, StyleSheet, View as RNView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useTabSlide } from '@/components/useTabSlide';

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { session, signOut } = useAuth();
  const { toggleFrom } = useAppTheme();
  const slideStyle = useTabSlide('profile');

  return (
    <Animated.View style={[{ flex: 1 }, slideStyle]}>
      <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: c.text }]}>Profile</Text>
        {session?.user?.email && (
          <Text style={[styles.email, { color: c.secondaryText }]}>Signed in as {session.user.email}</Text>
        )}
        <Text style={[styles.subtitle, { color: c.secondaryText }]}>
          Goal, budget, diet and allergy settings, coming soon.
        </Text>

        <Text style={[styles.sectionTitle, { color: c.text }]}>Settings</Text>
        <View style={[styles.settingsCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
          <Pressable
            onPress={(e) => toggleFrom(e.nativeEvent.pageX, e.nativeEvent.pageY)}
            style={styles.settingsRow}
            accessibilityRole="button"
            accessibilityLabel={scheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <RNView style={[styles.settingsIconWrap, { backgroundColor: c.cardDivider }]}>
              <FontAwesome name={scheme === 'dark' ? 'moon-o' : 'sun-o'} size={16} color={c.text} />
            </RNView>
            <Text style={[styles.settingsLabel, { color: c.text }]}>Theme</Text>
            <Text style={[styles.settingsValue, { color: c.secondaryText }]}>{scheme === 'dark' ? 'Dark' : 'Light'}</Text>
            <FontAwesome name="chevron-right" size={13} color={c.secondaryText} />
          </Pressable>
        </View>

        <Pressable onPress={signOut} style={[styles.signOutButton, { backgroundColor: c.cardDivider }]}>
          <Text style={[styles.signOutText, { color: c.ringProtein }]}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 120 },
  title: { fontSize: 24, fontWeight: '800' },
  email: { fontSize: 13, marginTop: 8, fontWeight: '600' },
  subtitle: { fontSize: 13, marginTop: 4, fontWeight: '600' },

  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 32, marginBottom: 16 },
  settingsCard: { borderRadius: 20, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  settingsIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { flex: 1, fontSize: 15, fontWeight: '700' },
  settingsValue: { fontSize: 14, fontWeight: '600' },

  signOutButton: { borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 32, alignItems: 'center' },
  signOutText: { fontSize: 14, fontWeight: '700' },
});
