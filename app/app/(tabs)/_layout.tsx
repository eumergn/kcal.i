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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16, gap: 6 }}>
            <HeaderLogo />
            {/* System font, not SpaceMono - only its Regular weight is bundled, so a
                custom TTF with no true bold face would silently render un-bold on iOS. */}
            <Text style={{ fontSize: 18, fontWeight: '900', letterSpacing: -0.4 }}>kCal.i</Text>
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
