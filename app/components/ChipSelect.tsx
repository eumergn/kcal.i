import { Pressable, StyleSheet, View as RNView } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export type ChipOption = { value: string; label: string; description?: string };

export function ChipSelect({
  options,
  selected,
  onToggle,
}: {
  options: ChipOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  return (
    <RNView style={styles.wrap}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <Pressable
            key={opt.value}
            onPress={() => onToggle(opt.value)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? c.ringCalories : c.card,
                borderColor: isSelected ? c.ringCalories : c.cardDivider,
              },
            ]}
          >
            <Text style={[styles.label, { color: isSelected ? '#04110D' : c.text }]}>{opt.label}</Text>
            {opt.description && (
              <Text style={[styles.description, { color: isSelected ? '#04110D' : c.secondaryText }]}>
                {opt.description}
              </Text>
            )}
          </Pressable>
        );
      })}
    </RNView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 12, maxWidth: '100%' },
  label: { fontSize: 14, fontWeight: '700' },
  description: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
