import { Pressable, StyleSheet, View as RNView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';

/** A bordered, icon-led selectable row - the reference's choice-card pattern, used
 * for gender, activity level, gym experience, goal type, diet, country and more. */
export function OptionCard({
  icon,
  label,
  description,
  selected,
  onPress,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  colors: (typeof Colors)['light'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: selected ? colors.text : colors.cardDivider, borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <RNView style={[styles.iconWrap, { backgroundColor: colors.cardDivider }]}>{icon}</RNView>
      <RNView style={styles.textCol}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {description && <Text style={[styles.description, { color: colors.secondaryText }]}>{description}</Text>}
      </RNView>
      {selected && (
        <RNView style={[styles.check, { backgroundColor: colors.text }]}>
          <FontAwesome name="check" size={11} color={colors.background} />
        </RNView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, gap: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  textCol: { flex: 1, gap: 2 },
  label: { fontSize: 15, fontWeight: '700' },
  description: { fontSize: 12, fontWeight: '600' },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
