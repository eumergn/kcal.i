import type React from 'react';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { CustomTabBar } from '@/components/CustomTabBar';
import { StreakBadge } from '@/components/StreakBadge';
import { ScanTabButton } from '@/components/ScanTabButton';
import { Logo } from '@/components/Logo';

const EASE_INOUT = Easing.inOut(Easing.ease);

/**
 * The focused-state pill is a separate, always-mounted layer with its own fixed
 * borderRadius, faded in/out via opacity - not a conditional backgroundColor swap.
 * A conditional swap was the likely source of the pill occasionally rendering with
 * square corners on Android (a backgroundColor change applied to a view an instant
 * before its radius "catches up" visually); an always-present layer that only fades
 * can't have that problem, and the fade itself doubles as the "change slower,
 * don't snap instantly" the pill needed anyway.
 */
function TabBarIcon({
  name,
  color,
  focused,
}: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  focused: boolean;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const pillOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(pillOpacity, { toValue: focused ? 1 : 0, duration: 320, easing: EASE_INOUT, useNativeDriver: true }).start();
  }, [focused, pillOpacity]);

  return (
    <View style={styles.iconSlot}>
      <Animated.View pointerEvents="none" style={[styles.pill, { backgroundColor: c.tabActiveBackground, opacity: pillOpacity }]} />
      <FontAwesome name={name} size={20} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: useClientOnlyValue(false, true),
        headerTitle: () => null,
        headerShadowVisible: false,
        headerLeft: () => (
          <View style={{ marginLeft: 16 }}>
            <Logo layout="stacked" size="small" />
          </View>
        ),
        headerRight: () => <StreakBadge />,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabBarIcon name="home" color={focused ? c.ringCalories : c.tabIconDefault} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarIcon: ({ focused }) => <TabBarIcon name="line-chart" color={focused ? c.ringProtein : c.tabIconDefault} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: '',
          tabBarButton: () => <ScanTabButton onPress={() => router.push('/scan')} />,
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          title: 'Grocery',
          // Kept neutral gray on purpose - the other tabs get their own accent, this one doesn't.
          tabBarIcon: ({ focused }) => <TabBarIcon name="shopping-cart" color={focused ? c.ringBudget : c.tabIconDefault} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabBarIcon name="user" color={focused ? c.tint : c.tabIconDefault} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconSlot: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  pill: { ...StyleSheet.absoluteFillObject, borderRadius: 23 },
});
