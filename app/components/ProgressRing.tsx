import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View as RNView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/** The shared instrument of this app's design language: an animated ring, not a bar. */
export function ProgressRing({
  size,
  strokeWidth,
  progress,
  color,
  track,
  children,
}: {
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
  track: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const anim = useRef(new Animated.Value(Math.min(progress, 1))).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: Math.min(progress, 1), duration: 500, easing: EASE_OUT, useNativeDriver: false }).start();
  }, [progress, anim]);

  const strokeDashoffset = anim.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });

  return (
    <RNView style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={track} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <RNView style={StyleSheet.absoluteFillObject}>
        <RNView style={styles.center}>{children}</RNView>
      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
