import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function TrackScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track</Text>
      <Text style={styles.subtitle}>Weight, calories, protein and water tracking with charts, coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: 'bold' },
  subtitle: { fontSize: 14, opacity: 0.6, marginTop: 8, textAlign: 'center' },
});
