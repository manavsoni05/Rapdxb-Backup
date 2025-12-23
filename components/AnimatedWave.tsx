import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface AnimatedWaveProps {
  size?: number;
  color?: string;
}

export default function AnimatedWave({ size = 18, color = '#ffffff' }: AnimatedWaveProps) {
  const wave1 = useRef(new Animated.Value(0.3)).current;
  const wave2 = useRef(new Animated.Value(0.5)).current;
  const wave3 = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const createAnimation = (animatedValue: Animated.Value, toValue: number, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0.3,
            duration,
            useNativeDriver: true,
          }),
        ])
      );

    createAnimation(wave1, 1, 600).start();
    createAnimation(wave2, 1, 800).start();
    createAnimation(wave3, 1, 1000).start();
  }, []);

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <AnimatedCircle
          cx="6"
          cy="12"
          r="2"
          fill={color}
          opacity={wave1}
        />
        <AnimatedCircle
          cx="12"
          cy="12"
          r="2"
          fill={color}
          opacity={wave2}
        />
        <AnimatedCircle
          cx="18"
          cy="12"
          r="2"
          fill={color}
          opacity={wave3}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
