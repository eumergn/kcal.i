import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View as RNView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const OVERSHOOT_STROKE_MULTIPLIER = 1.4; // fixed "a little bit wider", not a growing amount
const OVERSHOOT_SCALE = 1.06;

/**
 * The shared instrument of this app's design language: an animated ring, not a bar.
 *
 * The first lap (0-100%) is untouched - same stroke width as always, exactly like
 * before. Only once progress passes 100% does a second lap appear: it starts over
 * from zero degrees (not a continuation) and is drawn with a fixed, modestly wider
 * stroke than the first lap, layered on top of it. This is deliberately not "the
 * whole ring gets thicker" - only the second-lap-onward portion is wider, so it
 * visibly reads as "you went around again" rather than a single blanket resize.
 */
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
  const isOver = progress > 1;
  const overshootLap = Math.min(Math.max(progress - 1, 0), 1); // 0-1: how much of the second lap is filled
  const overshootAnim = useRef(new Animated.Value(overshootLap)).current;
  const scaleAnim = useRef(new Animated.Value(isOver ? OVERSHOOT_SCALE : 1)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: Math.min(progress, 1), duration: 500, easing: EASE_OUT, useNativeDriver: false }).start();
  }, [progress, anim]);

  useEffect(() => {
    Animated.timing(overshootAnim, { toValue: overshootLap, duration: 500, easing: EASE_OUT, useNativeDriver: false }).start();
    Animated.timing(scaleAnim, { toValue: isOver ? OVERSHOOT_SCALE : 1, duration: 320, easing: EASE_OUT, useNativeDriver: true }).start();
  }, [overshootLap, isOver, overshootAnim, scaleAnim]);

  const strokeDashoffset = anim.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });
  const overshootDashoffset = overshootAnim.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ scale: scaleAnim }] }}>
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
        {isOver && (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth * OVERSHOOT_STROKE_MULTIPLIER}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={overshootDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>
      <RNView style={StyleSheet.absoluteFillObject}>
        <RNView style={styles.center}>{children}</RNView>
      </RNView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
