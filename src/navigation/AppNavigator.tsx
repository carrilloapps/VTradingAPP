import React from 'react';
import { Text, Platform, View } from 'react-native';
import { NavigationContainer, DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import HomeScreen from '../screens/HomeScreen';
import DetailsScreen from '../screens/DetailsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ExchangeRatesScreen from '../screens/ExchangeRatesScreen';
import StocksScreen from '../screens/StocksScreen';
import AdvancedCalculatorScreen from '../screens/AdvancedCalculatorScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { useThemeContext } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/firebase/AnalyticsService';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ModernTabBar from '../components/navigation/ModernTabBar';

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

// Auth Stack
const AuthStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// Tabs Principales
const Tab = createMaterialTopTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
        initialRouteName="Home"
        tabBarPosition="bottom"
        tabBar={(props) => <ModernTabBar {...props} />}
        screenOptions={{
          swipeEnabled: true,
          tabBarShowLabel: false,
          tabBarIndicatorStyle: { height: 0 }, // Hide default indicator
        }}
      >
        <Tab.Screen 
          name="Markets" 
          component={StocksScreen} 
          options={{ 
            title: 'Acciones',
            tabBarIcon: ({ color }) => (
              <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="chart-line" size={24} color={color} />
              </View>
            )
          }} 
        />
        <Tab.Screen 
          name="Rates" 
          component={ExchangeRatesScreen} 
          options={{ 
            title: 'Tasas',
            tabBarIcon: ({ color }) => (
              <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="currency-usd" size={24} color={color} />
              </View>
            )
          }} 
        />
        <Tab.Screen 
          name="Home" 
          component={HomeStackScreen} 
          options={{ 
            tabBarIcon: ({ color }) => (
              <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ 
                  color: color, 
                  fontSize: 22, 
                  fontWeight: '900',
                  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                  includeFontPadding: false,
                  textAlign: 'center',
                }}>
                  Bs
                </Text>
              </View>
            )
          }} 
        />
        <Tab.Screen 
          name="Discover" 
          component={DetailsScreen} 
          options={{ 
            title: 'Descubre',
            tabBarIcon: ({ color }) => (
              <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="compass-outline" size={24} color={color} />
              </View>
            )
          }} 
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ 
            title: 'Configuración',
            tabBarIcon: ({ color }) => (
              <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="cog" size={24} color={color} />
              </View>
            )
          }} 
        />
      </Tab.Navigator>
  );
}

const AppNavigator = () => {
  const theme = useTheme();
  const { isDark } = useThemeContext();
  const { user, isLoading } = useAuth();
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
        {user ? (
          <>
            <RootStack.Screen name="Main" component={MainTabNavigator} />
            <RootStack.Screen 
              name="Notifications" 
              component={NotificationsScreen}
              options={{ 
                headerShown: false,
                animation: 'default',
              }} 
            />
            <RootStack.Screen 
              name="AdvancedCalculator" 
              component={AdvancedCalculatorScreen} 
              options={{ 
                headerShown: false, 
                animation: 'default' 
              }} 
            />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
