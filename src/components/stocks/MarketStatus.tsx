import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface MarketStatusProps {
  isOpen: boolean;
  time: string;
}

const MarketStatus: React.FC<MarketStatusProps> = ({ isOpen, time }) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isOpen, fadeAnim]);

  const statusColor = isOpen ? '#10B981' : '#EF4444'; // emerald-500 vs red-500

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        <View style={styles.indicatorContainer}>
          {isOpen && (
            <Animated.View
              style={[
                styles.ping,
                {
                  backgroundColor: statusColor,
                  opacity: fadeAnim,
                },
              ]}
            />
          )}
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
        </View>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {isOpen ? 'BVC MERCADO ABIERTO' : 'BVC MERCADO CERRADO'}
        </Text>
      </View>
      <Text style={[styles.timeText, { color: theme.colors.onSurfaceVariant }]}>
        {time}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicatorContainer: {
    position: 'relative',
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ping: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default MarketStatus;
