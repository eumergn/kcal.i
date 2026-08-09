import { Platform } from 'react-native';

/**
 * shadow* style props are deprecated on react-native-web (it wants "boxShadow"
 * instead) but are still what iOS/Android actually need - this picks the right one
 * per platform instead of triggering the "shadow* style props are deprecated" warning
 * every time this app runs in a browser.
 */
export function cardShadow(offsetY: number, opacity: number, radius: number, elevation: number) {
  if (Platform.OS === 'web') {
    return { boxShadow: `0px ${offsetY}px ${radius}px rgba(0,0,0,${opacity})` };
  }
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}
