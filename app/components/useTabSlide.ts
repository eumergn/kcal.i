import { useCallback, useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing } from 'react-native';
import { useFocusEffect } from 'expo-router';

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const SLIDE_DISTANCE = Math.round(Dimensions.get('window').width * 0.22);

// Real tab content, in on-screen left-to-right order - "scan" is excluded, since it's
// a FAB that immediately pushes a modal rather than a tab with content to slide.
export const TAB_ORDER = ['index', 'track', 'grocery', 'profile'];

const registry = new Map<string, Animated.Value>();
let lastTabIndex = 0;

/**
 * Gives each tab screen a directional slide on tab change - not just the incoming
 * screen nudging in (too subtle to read as a transition on its own), but the outgoing
 * screen sliding out first via slideOutCurrentTab, called from CustomTabBar before it
 * navigates. Each screen registers its own Animated.Value here so the tab bar (which
 * has no direct handle on screen internals) can trigger that exit animation.
 */
export function useTabSlide(routeName: string) {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    registry.set(routeName, translateX);
    return () => {
      if (registry.get(routeName) === translateX) registry.delete(routeName);
    };
  }, [routeName, translateX]);

  useFocusEffect(
    useCallback(() => {
      const index = TAB_ORDER.indexOf(routeName);
      if (index === -1) return;
      const direction = index > lastTabIndex ? 1 : index < lastTabIndex ? -1 : 0;
      lastTabIndex = index;
      if (direction === 0) return;

      translateX.setValue(direction * SLIDE_DISTANCE);
      Animated.timing(translateX, { toValue: 0, duration: 260, easing: EASE_OUT, useNativeDriver: true }).start();
    }, [routeName]),
  );

  return { transform: [{ translateX }] };
}

/** Slides the currently-focused screen out before the tab bar navigates away from it,
 * so the transition has a visible outgoing half, not just the incoming screen's slide-in. */
export function slideOutCurrentTab(fromRouteName: string, toRouteName: string): Promise<void> {
  const fromIndex = TAB_ORDER.indexOf(fromRouteName);
  const toIndex = TAB_ORDER.indexOf(toRouteName);
  const ref = registry.get(fromRouteName);
  if (fromIndex === -1 || toIndex === -1 || !ref) return Promise.resolve();

  const direction = toIndex > fromIndex ? 1 : -1;
  return new Promise((resolve) => {
    Animated.timing(ref, { toValue: -direction * SLIDE_DISTANCE, duration: 160, easing: EASE_OUT, useNativeDriver: true }).start(() => {
      ref.setValue(0);
      resolve();
    });
  });
}
