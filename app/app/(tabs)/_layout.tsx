import React from 'react';
import { View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { ScanTabButton } from '@/components/ScanTabButton';
import { HeaderLogo } from '@/components/HeaderLogo';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tabIconSelected,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderTopColor: Colors[colorScheme ?? 'light'].cardDivider,
        },
        // Force every tab (including the custom scan button) to the same width slot -
        // without this, a custom tabBarButton doesn't get the same flex distribution
        // as the default icon+label buttons, and the FAB ends up visibly off-center.
        tabBarItemStyle: { flex: 1 },
        headerShown: useClientOnlyValue(false, true),
        headerTitleAlign: 'center',
        headerLeft: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16, gap: 8 }}>
            <HeaderLogo />
            {/* Bruno Ace (bundled, single weight) - matches the angular cut-corner
                wordmark reference exactly. No fontWeight override: forcing a numeric
                weight on a single-weight custom TTF doesn't bold it, just risks iOS
                silently ignoring the custom face entirely (same issue as SpaceMono). */}
            <Text style={{ fontFamily: 'BrunoAce', fontSize: 17 }}>Kcal.i</Text>
          </View>
        ),
        headerRight: () => <ThemeToggleButton />,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color} />,
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
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-cart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
