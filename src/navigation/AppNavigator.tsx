import React from 'react';
import { Text, Platform, View } from 'react-native';
import { NavigationContainer, DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import WidgetsScreen from '../screens/WidgetsScreen';
import ExchangeRatesScreen from '../screens/ExchangeRatesScreen';
import StocksScreen from '../screens/StocksScreen';
import AdvancedCalculatorScreen from '../screens/AdvancedCalculatorScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import BankRatesScreen from '../screens/BankRatesScreen';
import { useThemeContext } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/firebase/AnalyticsService';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import WebViewScreen from '../screens/WebViewScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ModernTabBar from '../components/navigation/ModernTabBar';
import { navigationRef } from './NavigationRef';
import { storageService } from '../services/StorageService';
import DiscoverScreen from '../screens/DiscoverScreen';
import AddAlertScreen from '../screens/settings/AddAlertScreen';
import { UserAlert } from '../services/StorageService';
import AuthLoading from '../components/auth/AuthLoading';
import StockDetailScreen from '../screens/StockDetailScreen';
import { StockData } from '../services/StocksService';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  Notifications: undefined;
  Widgets: undefined;
  AdvancedCalculator: undefined;
  BankRates: undefined;
  WebView: { url: string; title?: string };
  AddAlert: { editAlert?: UserAlert };
  StockDetail: { stock: StockData };
};

// Root Stack that includes Splash
const RootStack = createNativeStackNavigator<RootStackParamList>();

// Stack para Home y Discover
const HomeStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Discover" component={DiscoverScreen} options={{ headerShown: true, title: 'Descubre' }} />
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
      <AuthStack.Screen name="WebView" component={WebViewScreen} />
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
              <View style={{ 
                width: 32, 
                height: 32, 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: 16,
              }}>
                <Text style={{ 
                  color: color, 
                  fontSize: 18,
                  fontWeight: 'bold',
                  includeFontPadding: false,
                  textAlign: 'center',
                  textAlignVertical: 'center',
                  marginBottom: Platform.OS === 'android' ? 2 : 0,
                }}>
                  Bs
                </Text>
              </View>
            )
          }} 
        />
        <Tab.Screen 
          name="Discover" 
          component={DiscoverScreen} 
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
  const { user, isLoading: authLoading } = useAuth();
  const [isReady, setIsReady] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const routeNameRef = React.useRef<string | undefined>(undefined);
  
  React.useEffect(() => {
    const checkOnboarding = async () => {
      const hasSeen = await storageService.getHasSeenOnboarding();
      setShowOnboarding(!hasSeen);
      setIsReady(true);
    };
    checkOnboarding();
  }, []);

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

  if (authLoading || !isReady) {
    return <AuthLoading />;
  }

  return (
    <>
      <NavigationContainer
        ref={navigationRef}
        theme={themeWithPaper}
        onReady={() => {
          routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
        }}
        onStateChange={async () => {
          const previousRouteName = routeNameRef.current;
          const currentRoute = navigationRef.current?.getCurrentRoute();
          const currentRouteName = currentRoute?.name;

          if (previousRouteName !== currentRouteName && currentRouteName) {
            await analyticsService.logScreenView(currentRouteName, currentRouteName);
          }
          routeNameRef.current = currentRouteName;
        }}
      >
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {showOnboarding ? (
            <RootStack.Screen name="Onboarding">
              {(props) => <OnboardingScreen {...props} onFinish={() => setShowOnboarding(false)} />}
            </RootStack.Screen>
          ) : user ? (
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
                name="StockDetail" 
                component={StockDetailScreen} 
                options={{ 
                  headerShown: false,
                  animation: 'default',
                }} 
              />
              <RootStack.Screen 
                name="Widgets" 
                component={WidgetsScreen}
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
              <RootStack.Screen 
                name="BankRates" 
                component={BankRatesScreen} 
                options={{ 
                  headerShown: false, 
                  animation: 'default' 
                }} 
              />
              <RootStack.Screen 
                name="WebView" 
                component={WebViewScreen} 
                options={{ 
                  headerShown: false, 
                  animation: 'slide_from_bottom' 
                }} 
              />
              <RootStack.Screen 
                name="AddAlert" 
                component={AddAlertScreen} 
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
    </>
  );
};

export default AppNavigator;
