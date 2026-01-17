import React from 'react';
import { NavigationContainer, DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import DetailsScreen from '../screens/DetailsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ExchangeRatesScreen from '../screens/ExchangeRatesScreen';
import StocksScreen from '../screens/StocksScreen';
import { useThemeContext } from '../theme/ThemeContext';

/* eslint-disable react/no-unstable-nested-components */

// Root Stack that includes Splash
const RootStack = createNativeStackNavigator();

// Stack para Home y Details
const HomeStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Details" component={DetailsScreen} options={{ headerShown: true, title: 'Detalles' }} />
    </HomeStack.Navigator>
  );
}

// Tabs Principales
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outline,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom + 8,
            paddingTop: 8,
            elevation: 8,
          },
          tabBarShowLabel: false,
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.onSurface,
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeStackScreen} 
          options={{ 
            headerShown: false,
            tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />
          }} 
        />
        <Tab.Screen 
          name="Rates" 
          component={ExchangeRatesScreen} 
          options={{ 
            headerShown: false, 
            title: 'Tasas',
            tabBarIcon: ({ color }) => <MaterialIcons name="show-chart" size={24} color={color} />
          }} 
        />
        <Tab.Screen 
          name="Markets" 
          component={StocksScreen} 
          options={{ 
            headerShown: false, 
            title: 'Acciones',
            tabBarIcon: ({ color }) => <MaterialIcons name="bar-chart" size={24} color={color} />
          }} 
        />
        <Tab.Screen 
          name="Wallet" 
          component={DetailsScreen} 
          options={{ 
            headerShown: false, 
            title: 'Billetera',
            tabBarIcon: ({ color }) => <MaterialIcons name="account-balance-wallet" size={24} color={color} />
          }} 
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ 
            headerShown: false, 
            title: 'Configuración',
            tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={24} color={color} />
          }} 
        />
      </Tab.Navigator>
  );
}

import { analyticsService } from '../services/firebase/AnalyticsService';

const AppNavigator = () => {
  const theme = useTheme();
  const { isDark } = useThemeContext();
  const routeNameRef = React.useRef<string | undefined>(undefined);
  const navigationRef = React.useRef<any>(null);
  
  const navigationTheme = isDark ? NavDarkTheme : NavDefaultTheme;
  const themeWithPaper = {
    ...navigationTheme,
    colors: {
      ...navigationTheme.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outline,
      primary: theme.colors.primary,
    },
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={themeWithPaper}
      onReady={() => {
        routeNameRef.current = navigationRef.current.getCurrentRoute().name;
      }}
      onStateChange={async () => {
        const previousRouteName = routeNameRef.current;
        const currentRoute = navigationRef.current.getCurrentRoute();
        const currentRouteName = currentRoute.name;

        if (previousRouteName !== currentRouteName) {
          await analyticsService.logScreenView(currentRouteName, currentRouteName);
        }
        routeNameRef.current = currentRouteName;
      }}
    >
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Main" component={MainTabNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
