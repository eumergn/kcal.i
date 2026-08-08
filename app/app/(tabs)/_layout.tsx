import React from 'react';
import { View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { ScanTabButton } from '@/components/ScanTabButton';
import { Logo } from '@/components/Logo';

/** Active state is a grey pill behind the icon, not a colored icon - no accent color on the tab bar. */
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
  return (
    <View
      style={{
        width: 42,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? c.tabActiveBackground : 'transparent',
      }}
    >
      <FontAwesome name={name} size={20} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const c = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.tabIconSelected,
        tabBarInactiveTintColor: c.tabIconDefault,
        tabBarShowLabel: false,
        // Floating pill bar, detached from the bottom edge rather than flush - a
        // full border (not just borderTop) since it's fully rounded on all sides.
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 24,
          height: 64,
          borderRadius: 24,
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: c.cardDivider,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        },
        // Force every tab (including the custom scan button) to the same width slot -
        // without this, a custom tabBarButton doesn't get the same flex distribution
        // as the default icon+label buttons, and the FAB ends up visibly off-center.
        // Explicit centering on both axes: with tabBarShowLabel false, the default
        // item still reserves label padding that pushes the icon off vertical center.
        tabBarItemStyle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        tabBarIconStyle: { marginTop: 0, marginBottom: 0 },
        headerShown: useClientOnlyValue(false, true),
        headerTitleAlign: 'center',
        headerLeft: () => (
          <View style={{ marginLeft: 16 }}>
            <Logo layout="stacked" size="small" />
          </View>
        ),
        headerRight: () => <ThemeToggleButton />,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="line-chart" color={color} focused={focused} />,
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
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="shopping-cart" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="user" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
