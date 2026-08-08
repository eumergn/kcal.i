import { Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import Colors from '@/constants/Colors';
import { useAppTheme } from '@/context/ThemeContext';

export function ThemeToggleButton() {
  const { scheme, toggle } = useAppTheme();
  const c = Colors[scheme];

  return (
    <Pressable
      onPress={toggle}
      hitSlop={12}
      style={{ marginRight: 16 }}
      accessibilityRole="button"
      accessibilityLabel={scheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {({ pressed }) => (
        <FontAwesome name={scheme === 'dark' ? 'sun-o' : 'moon-o'} size={20} color={c.text} style={{ opacity: pressed ? 0.5 : 1 }} />
      )}
    </Pressable>
  );
}
