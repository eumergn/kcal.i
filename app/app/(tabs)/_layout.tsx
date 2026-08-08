import React from 'react';
import { View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { CustomTabBar } from '@/components/CustomTabBar';
import { StreakBadge } from '@/components/StreakBadge';
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
  const router = useRouter();

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
