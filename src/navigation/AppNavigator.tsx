import React from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import DetailsScreen from '../screens/DetailsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useThemeContext } from '../theme/ThemeContext';

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

  return (
    <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'Markets') {
              iconName = 'bar-chart';
            } else if (route.name === 'Wallet') {
               iconName = 'account-balance-wallet';
            } else if (route.name === 'Settings') {
              iconName = 'settings';
            }

            return (
              <View style={{
                backgroundColor: focused ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                padding: 4,
                borderRadius: 20,
                width: 64, 
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                 <MaterialIcons name={iconName as string} size={24} color={color} />
              </View>
            );
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outline,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
            elevation: 8,
          },
          tabBarShowLabel: false,
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.onSurface,
        })}
      >
        <Tab.Screen name="Home" component={HomeStackScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Markets" component={DetailsScreen} options={{ title: 'Mercados' }} />
        <Tab.Screen name="Wallet" component={DetailsScreen} options={{ title: 'Billetera' }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configuración' }} />
      </Tab.Navigator>
  );
}

const AppNavigator = () => {
  const theme = useTheme();
  const { isDark } = useThemeContext();
  
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
    <NavigationContainer theme={themeWithPaper}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Main" component={MainTabNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
