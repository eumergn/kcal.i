import { Pressable, View, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { cardShadow } from '@/lib/shadow';

export function ScanTabButton({ onPress }: { onPress: () => void }) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  return (
    // Outer wrapper fills the equal-width tab slot and centers the circle within it -
    // the circle itself stays a fixed 56x56 regardless of slot width.
    <View style={styles.slot}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: c.text, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Scan a product barcode"
      >
        <FontAwesome name="camera" size={26} color={c.background} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Taller than the 64pt bar itself and centered on it (no marginTop offset) - it
  // overflows evenly past both the top and bottom edges instead of just poking above.
  button: {
    width: 64,
    height: 64,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow(4, 0.35, 8, 6),
  },
});
