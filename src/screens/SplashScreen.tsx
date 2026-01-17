import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme, Text } from 'react-native-paper';

const SplashScreen = () => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    // Start animation explicitly if needed, though autoPlay handles it
    if (lottieRef.current) {
      lottieRef.current.play();
    }
  }, []);

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.colors.background, opacity: fadeAnim }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text variant="displayMedium" style={[styles.logoText, { color: theme.colors.primary }]}>
            VTrading
          </Text>
          <Text variant="titleMedium" style={[styles.appText, { color: theme.colors.onSurfaceVariant }]}>
            APP
          </Text>
        </View>
        
        <View style={styles.lottieContainer}>
          <LottieView
            ref={lottieRef}
            source={require('../assets/animations/splash.json')}
            autoPlay
            loop
            style={styles.lottie}
            resizeMode="contain"
          />
        </View>

        <Text variant="bodySmall" style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
          Cargando mercados...
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontWeight: '900',
    letterSpacing: -1,
  },
  lottieContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  appText: {
    letterSpacing: 2,
  },
  loadingText: {
    marginTop: 20,
  },
});

export default SplashScreen;
