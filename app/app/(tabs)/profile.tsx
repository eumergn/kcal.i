import { Animated, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { useTabSlide } from '@/components/useTabSlide';

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { session, signOut } = useAuth();
  const slideStyle = useTabSlide('profile');

  return (
    <Animated.View style={[{ flex: 1 }, slideStyle]}>
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={[styles.title, { color: c.text }]}>Profile</Text>
        <Text style={[styles.subtitle, { color: c.secondaryText }]}>
          Goal, budget, diet, allergies and account settings, coming soon.
        </Text>
        {session?.user?.email && (
          <Text style={[styles.email, { color: c.secondaryText }]}>Signed in as {session.user.email}</Text>
        )}
        <Pressable onPress={signOut} style={[styles.signOutButton, { backgroundColor: c.cardDivider }]}>
          <Text style={[styles.signOutText, { color: c.ringProtein }]}>Sign out</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 8, textAlign: 'center', fontWeight: '600' },
  email: { fontSize: 13, marginTop: 20, fontWeight: '600' },
  signOutButton: { borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 28 },
  signOutText: { fontSize: 14, fontWeight: '700' },
});
