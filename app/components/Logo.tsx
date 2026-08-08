import { View as RNView } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

/**
 * The "Kcal.i" wordmark (Bruno Ace) + dumbbell icon lockup. `stacked` matches the
 * reference exactly (text above icon) for screens with vertical room to spare
 * (sign-in/sign-up); `inline` is a horizontal arrangement for the compact nav header,
 * where a stacked lockup would be too tall to fit the bar.
 */
export function Logo({ layout = 'stacked', size = 'large' }: { layout?: 'stacked' | 'inline'; size?: 'large' | 'small' }) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const fontSize = size === 'large' ? 32 : 17;
  const iconSize = size === 'large' ? 20 : 13;

  return (
    <RNView style={{ flexDirection: layout === 'stacked' ? 'column' : 'row', alignItems: 'center', gap: layout === 'stacked' ? 6 : 8 }}>
      <Text style={{ fontFamily: 'BrunoAce', fontSize, color: c.text }}>Kcal.i</Text>
      <FontAwesome5 name="dumbbell" size={iconSize} color={c.text} />
    </RNView>
  );
}
