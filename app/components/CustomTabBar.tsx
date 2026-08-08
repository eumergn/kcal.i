import { ReactElement } from 'react';
import { Pressable, StyleSheet, View as RNView } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

/**
 * A hand-rolled tab bar instead of the library's default BottomTabBar: the default
 * reserves internal padding for a label row even with tabBarShowLabel off, which kept
 * throwing icon vertical centering off. Rendering the row ourselves gives exact control
 * over both axes.
 */
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  return (
    <RNView style={[styles.bar, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        if (options.tabBarButton) {
          // The scan tab supplies its own fully custom button and ignores these props.
          const CustomButton = options.tabBarButton as (props: Record<string, unknown>) => ReactElement;
          return (
            <RNView key={route.key} style={styles.item}>
              <CustomButton />
            </RNView>
          );
        }

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        const color = isFocused ? c.tabIconSelected : c.tabIconDefault;
        const icon = options.tabBarIcon?.({ focused: isFocused, color, size: 20 });

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            // The default Android ripple fills the whole rectangular touch target with
            // square corners, clashing with the circular focused-state background - it's
            // suppressed in favor of a plain opacity dip, which needs no shape of its own.
            android_ripple={{ color: 'transparent' }}
            style={({ pressed }) => [styles.item, { opacity: pressed ? 0.6 : 1 }]}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.title}
          >
            {icon}
          </Pressable>
        );
      })}
    </RNView>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  item: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' },
});
