import { useCallback, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from 'expo-router';

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

// Real tab content, in on-screen left-to-right order - "scan" is excluded, since it's
// a FAB that immediately pushes a modal rather than a tab with content to slide.
const TAB_ORDER = ['index', 'track', 'grocery', 'profile'];

let lastTabIndex = 0;

/**
 * Gives each tab screen a directional slide-in on focus: sliding in from the right
 * when moving to a tab further right in the bar, from the left when moving further
 * left - so gliding home -> track -> grocery -> profile (and back) feels like paging
 * across a filmstrip instead of an instant cut. Position only, no opacity - an
 * interrupted opacity animation (fast repeated tab switches) could leave a screen
 * visibly dimmed until the next focus event, which read as "unavailable" rather than
 * "mid-transition".
 */
export function useTabSlide(routeName: string) {
  const translateX = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const index = TAB_ORDER.indexOf(routeName);
      if (index === -1) return;
      const direction = index > lastTabIndex ? 1 : index < lastTabIndex ? -1 : 0;
      lastTabIndex = index;
      if (direction === 0) return;

      translateX.setValue(direction * 32);
      Animated.timing(translateX, { toValue: 0, duration: 280, easing: EASE_OUT, useNativeDriver: true }).start();
    }, [routeName]),
  );

  return { transform: [{ translateX }] };
}
