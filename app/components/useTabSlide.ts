import { useCallback, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from 'expo-router';

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const SLIDE_DISTANCE = 24;

// Real tab content, in on-screen left-to-right order - "scan" is excluded, since it's
// a FAB that immediately pushes a modal rather than a tab with content to slide.
const TAB_ORDER = ['index', 'track', 'grocery', 'profile'];

let lastTabIndex = 0;

/**
 * A directional slide-in on focus, and nothing else - a prior version also tried to
 * slide the outgoing screen out first (awaiting that animation before calling
 * navigate()), which added a blocking delay before the tab bar could even switch and
 * read as stutter rather than motion on a real device. Native-driven, immediate
 * navigation, short duration: prioritizes actually feeling smooth over being a
 * two-sided transition.
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

      translateX.setValue(direction * SLIDE_DISTANCE);
      Animated.timing(translateX, { toValue: 0, duration: 200, easing: EASE_OUT, useNativeDriver: true }).start();
    }, [routeName]),
  );

  return { transform: [{ translateX }] };
}
