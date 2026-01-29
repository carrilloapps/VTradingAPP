import React, { useState } from 'react';
import { Text, Platform, View, StatusBar } from 'react-native';
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
import CurrencyDetailScreen from '../screens/CurrencyDetailScreen';
import { useThemeContext } from '../theme/ThemeContext';
import { analyticsService } from '../services/firebase/AnalyticsService';
import { useAuthStore } from '../stores/authStore';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import WebViewScreen from '../screens/WebViewScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ModernTabBar from '../components/navigation/ModernTabBar';
import { navigationRef } from './NavigationRef';
import { storageService } from '../services/StorageService';
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import AddAlertScreen from '../screens/settings/AddAlertScreen';
import { UserAlert } from '../services/StorageService';
import AuthLoading from '../components/auth/AuthLoading';
import StockDetailScreen from '../screens/StockDetailScreen';
import { StockData } from '../services/StocksService';
import { CurrencyRate } from '../services/CurrencyService';
import DeviceInfo from 'react-native-device-info';
import { remoteConfigService } from '../services/firebase/RemoteConfigService';
import ForceUpdateModal from '../components/ui/ForceUpdateModal';
import ArticleDetailScreen from '../screens/discover/ArticleDetailScreen';
import CategoryDetailScreen from '../screens/discover/CategoryDetailScreen';
import TagDetailScreen from '../screens/discover/TagDetailScreen';
import AllArticlesScreen from '../screens/discover/AllArticlesScreen';
import SearchResultsScreen from '../screens/discover/SearchResultsScreen';
import { WordPressCategory, WordPressTag } from '../services/WordPressService';

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
  CurrencyDetail: { rate: CurrencyRate };
  ArticleDetail: { article?: any; slug?: string }; // Updated with slug
  CategoryDetail: { category?: WordPressCategory; slug?: string };
  TagDetail: { tag?: WordPressTag; slug?: string };
  AllArticles: undefined;
  SearchResults: { initialQuery?: string };
};

export type MainTabParamList = {
  Markets: undefined;
  Rates: undefined;
  Home: undefined;
  Discover: { categorySlug?: string; tagSlug?: string }; // Updated with slugs
  Settings: undefined;
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
const Tab = createMaterialTopTabNavigator<MainTabParamList>();

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

const linking = {
  prefixes: ['vtrading://', 'https://discover.vtrading.app'],
  config: {
    screens: {
      Main: {
        screens: {
          Discover: {
            path: 'discover',
          },
        },
      },
      ArticleDetail: {
        path: 'article/:slug',
      },
      CategoryDetail: {
        path: 'categoria/:slug',
      },
      TagDetail: {
        path: 'tag/:slug',
      },
      AllArticles: {
        path: 'articulos',
      },
      SearchResults: {
        path: 'buscar/:initialQuery?',
      },
      // Alternative for direct slugs from WordPress (discover.vtrading.app/{slug})
      // NOTE: This must be handled carefully to avoid conflicts with other paths
      // In this config, specific paths above take precedence.
      // If no other path matches, it falls through to this one?
      // React Navigation matches hierarchically.
      // We can map the root path to ArticleDetail with a slug param.
    },
  },
  // Custom getStateFromPath to handle root slugs for articles
  getStateFromPath: (path: string, options: any) => {
    // Clean path
    const cleanPath = path.replace(/^\/+/, '');
    
    // Check for known prefixes to avoid hijacking
    if (
        cleanPath.startsWith('discover') || 
        cleanPath.startsWith('article/') || 
        cleanPath.startsWith('categoria/') || 
        cleanPath.startsWith('tag/') || 
        cleanPath.startsWith('articulos') || 
        cleanPath.startsWith('buscar/')
    ) {
        // Let default logic handle it
        return undefined; 
    }

    // If it's a root slug (e.g. "my-article-slug"), map to ArticleDetail
    if (cleanPath.length > 0) {
        return {
            routes: [
                {
                    name: 'ArticleDetail',
                    params: { slug: cleanPath },
                },
            ],
        };
    }

    return undefined;
  },
};

const AppNavigator = () => {
  const theme = useTheme(); // Assuming useAppTheme is meant to be useTheme from react-native-paper
  const { isDark } = useThemeContext();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);

  // Zustand store selectors
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showForceUpdate, setShowForceUpdate] = useState(false);
  const routeNameRef = React.useRef<string | undefined>(undefined);
  
  React.useEffect(() => {
    const initApp = async () => {
      // 1. Check Onboarding
      const hasSeen = await storageService.getHasSeenOnboarding();
      setShowOnboarding(!hasSeen);

      // 2. Check Force Update
      try {
        await remoteConfigService.fetchAndActivate();
        const config = remoteConfigService.getJson<any>('strings'); // Using 'strings' key as requested
        
        if (config && config.forceUpdate) {
            const currentBuild = parseInt(DeviceInfo.getBuildNumber(), 10);
            const requiredBuild = config.forceUpdate.build;
            
            if (currentBuild < requiredBuild) {
                setShowForceUpdate(true);
            }
        }
      } catch (e) {
        // Fail silently on config check, don't block app unless confirmed
        console.warn('Failed to check force update', e);
      }

      setIsReady(true);
    };
    initApp();
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

  if (showForceUpdate) {
      return (
        <React.Fragment>
            <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
            <ForceUpdateModal visible={true} />
        </React.Fragment>
      );
  }

  return (
    <>
      <NavigationContainer
        ref={navigationRef}
        theme={themeWithPaper}
        linking={linking}
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
              <RootStack.Screen 
                name="CurrencyDetail" 
                component={CurrencyDetailScreen} 
                options={{ 
                  headerShown: false, 
                  animation: 'default' 
                }} 
              />
              <RootStack.Screen 
                name="ArticleDetail" 
                component={ArticleDetailScreen} 
                options={{ 
                  headerShown: false, 
                  animation: 'default' 
                }} 
              />
              <RootStack.Screen 
                name="CategoryDetail" 
                component={CategoryDetailScreen} 
                options={{ 
                  headerShown: false, 
                  animation: 'default' 
                }} 
              />
              <RootStack.Screen 
                name="TagDetail" 
                component={TagDetailScreen} 
                options={{ 
                  headerShown: false, 
                  animation: 'default' 
                }} 
              />
              <RootStack.Screen 
                name="AllArticles" 
                component={AllArticlesScreen} 
                options={{ 
                  headerShown: false, 
                  animation: 'default' 
                }} 
              />
              <RootStack.Screen 
                name="SearchResults" 
                component={SearchResultsScreen} 
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
