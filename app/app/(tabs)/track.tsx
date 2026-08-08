import { Animated, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useTabSlide } from '@/components/useTabSlide';

export default function TrackScreen() {
  const slideStyle = useTabSlide('track');
  return (
    <Animated.View style={[{ flex: 1 }, slideStyle]}>
      <View style={styles.container}>
        <Text style={styles.title}>Track</Text>
        <Text style={styles.subtitle}>Weight, calories, protein and water tracking with charts, coming soon.</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: 'bold' },
  subtitle: { fontSize: 14, opacity: 0.6, marginTop: 8, textAlign: 'center' },
});
