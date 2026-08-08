import { TextInput, TextInputProps, StyleSheet } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export function AuthTextInput(props: TextInputProps) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  return (
    <TextInput
      placeholderTextColor={c.secondaryText}
      style={[styles.input, { backgroundColor: c.card, color: c.text, borderColor: c.cardDivider }]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
  },
});
