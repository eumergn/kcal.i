import { ReactElement } from 'react';
import { Pressable, StyleSheet, View as RNView } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { slideOutCurrentTab } from '@/components/useTabSlide';

/**
 * A hand-rolled tab bar instead of the library's default BottomTabBar: the default
 * reserves internal padding for a label row even with tabBarShowLabel off, which kept
 * throwing icon vertical centering off. Rendering the row ourselves gives exact control
 * over both axes.
 *
 * Three layers, not one: `wrap` carries the shadow/elevation only (no overflow clip,
 * or Android drops the shadow); `clip` carries the actual rounded background/border
 * with `overflow: hidden` so the corners are always exactly the given radius,
 * regardless of Android's elevation-shadow quirks re-drawing a square backing view on
 * re-render; the scan button renders as a sibling of `clip`, not inside it, so it can
 * still overflow both the top and bottom edges unclipped.
 */
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  return (
    <RNView style={styles.wrap}>
      <RNView style={[styles.clip, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          if (options.tabBarButton) {
            // Reserves the slot's width but renders nothing here - the real button
            // is the unclipped sibling below, positioned to land in this same slot.
            return <RNView key={route.key} style={styles.item} />;
          }

          const onPress = async () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (isFocused || event.defaultPrevented) return;
            // The outgoing screen slides out first, then the tab swap happens, then
            // the incoming screen's own useTabSlide focus effect slides it in - both
            // halves of the transition are now visible instead of just the incoming nudge.
            const fromRoute = state.routes[state.index].name;
            await slideOutCurrentTab(fromRoute, route.name);
            navigation.navigate(route.name);
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

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        if (!options.tabBarButton) return null;
        const CustomButton = options.tabBarButton as (props: Record<string, unknown>) => ReactElement;
        const slotWidth = 100 / state.routes.length;
        return (
          <RNView key={route.key} style={[styles.floatingItem, { left: `${slotWidth * index}%`, width: `${slotWidth}%` }]}>
            <CustomButton />
          </RNView>
        );
      })}
    </RNView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    height: 64,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  clip: {
    flex: 1,
    borderRadius: 32,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  item: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' },
  floatingItem: { position: 'absolute', top: 0, height: '100%', alignItems: 'center', justifyContent: 'center' },
});
