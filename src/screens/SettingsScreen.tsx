import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { Text, useTheme, Switch, Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DeviceInfo from 'react-native-device-info';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import { useThemeContext } from '../theme/ThemeContext';

import UserProfileCard from '../components/settings/UserProfileCard';
import AlertItem from '../components/settings/AlertItem';
import ThemeSelector from '../components/settings/ThemeSelector';
import MenuButton from '../components/settings/MenuButton';

const SettingsScreen = () => {
  const theme = useTheme();
  const colors = theme.colors as any;
  const insets = useSafeAreaInsets();
  const { themeMode, setThemeMode } = useThemeContext();
  
  // App Info State
  const [appName, setAppName] = useState('');
  const [appVersion, setAppVersion] = useState('');
  const [buildNumber, setBuildNumber] = useState('');
  const [buildDate, setBuildDate] = useState('');
  
  // Feedback State
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Mock State
  const [alerts, setAlerts] = useState({
    usd: true,
    cantv: false,
  });
  const [pushEnabled, setPushEnabled] = useState(true);

  useEffect(() => {
    const loadAppInfo = async () => {
      const name = DeviceInfo.getApplicationName();
      const version = DeviceInfo.getVersion();
      const build = DeviceInfo.getBuildNumber();
      // Using last update time as a proxy for build date/install date
      const lastUpdate = await DeviceInfo.getLastUpdateTime(); 
      const date = new Date(lastUpdate).toLocaleDateString();
      
      setAppName(name);
      setAppVersion(version);
      setBuildNumber(build);
      setBuildDate(date);
    };
    
    loadAppInfo();
  }, []);

  const handleAction = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar tu sesión actual?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Salir", style: "destructive", onPress: () => handleAction("Sesión cerrada correctamente") }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        backgroundColor="transparent"
        translucent
        barStyle={theme.dark ? 'light-content' : 'dark-content'} 
      />

      {/* Header */}
      <UnifiedHeader
        variant="section"
        title="Configuración"
        showNotification={false}
        style={{ borderBottomWidth: 0 }}
      />

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile */}
        <View style={styles.section}>
          <UserProfileCard />
        </View>

        {/* Alerts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>ALERTAS ACTIVAS</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => handleAction("Funcionalidad de Nueva Alerta en desarrollo")}
            >
              <MaterialIcons name="add" size={18} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 14 }}>Nueva Alerta</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.cardContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.elevation.level1 }]}>
            <AlertItem 
              symbol="USD/VES"
              status="Sube"
              target="40.50"
              isActive={alerts.usd}
              onToggle={(v) => {
                setAlerts(p => ({ ...p, usd: v }));
                handleAction(`Alerta USD/VES ${v ? 'activada' : 'desactivada'}`);
              }}
              iconName="currency-exchange"
              iconColor={colors.success} 
              iconBgColor={colors.successContainer} 
            />
            <View style={{ height: 1, backgroundColor: theme.colors.outline }} />
            <AlertItem 
              symbol="CANTV"
              status="Baja"
              target="3.20"
              isActive={alerts.cantv}
              onToggle={(v) => {
                setAlerts(p => ({ ...p, cantv: v }));
                handleAction(`Alerta CANTV ${v ? 'activada' : 'desactivada'}`);
              }}
              iconName="show-chart"
              iconColor={colors.info} 
              iconBgColor={colors.infoContainer} 
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>PREFERENCIAS</Text>
          
          <View style={[styles.cardContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.elevation.level1 }]}>
            {/* Push Notifications */}
            <View style={styles.prefRow}>
              <View style={styles.prefLeft}>
                <View style={[styles.iconBox, { backgroundColor: theme.colors.elevation.level2 }]}>
                  <MaterialIcons name="notifications" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
                <Text variant="bodyLarge" style={{ fontWeight: '500', color: theme.colors.onSurface }}>Notificaciones Push</Text>
              </View>
              <Switch 
                value={pushEnabled} 
                onValueChange={(v) => {
                  setPushEnabled(v);
                  handleAction(`Notificaciones ${v ? 'habilitadas' : 'deshabilitadas'}`);
                }} 
                color={theme.colors.primary} 
              />
            </View>

            <View style={{ height: 1, backgroundColor: theme.colors.outline }} />

            {/* Appearance */}
            <View style={styles.prefContent}>
              <View style={styles.prefLeft}>
                <View style={[styles.iconBox, { backgroundColor: theme.colors.elevation.level2 }]}>
                  <MaterialIcons name="palette" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
                <Text variant="bodyLarge" style={{ fontWeight: '500', color: theme.colors.onSurface }}>Apariencia</Text>
              </View>
              <ThemeSelector currentTheme={themeMode} onSelect={setThemeMode} />
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>CUENTA</Text>
          <View style={[styles.cardContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.elevation.level1 }]}>
            <MenuButton 
              icon="security" 
              label="Seguridad y Privacidad" 
              onPress={() => handleAction("Abriendo configuración de seguridad...")} 
            />
            <MenuButton 
              icon="logout" 
              label="Cerrar Sesión" 
              onPress={handleLogout} 
              isDanger
              hasTopBorder
            />
          </View>
          
          <View style={styles.footer}>
            <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, fontWeight: '500' }}>
              {appName} v{appVersion} (BUILD {buildNumber}) {__DEV__ ? 'DEBUG' : ''}
            </Text>
            <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant, marginTop: 4, opacity: 0.7 }}>
              {DeviceInfo.getDeviceId()} | {DeviceInfo.getSystemName()} {DeviceInfo.getSystemVersion()}
            </Text>
          </View>
        </View>

      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={{ backgroundColor: theme.colors.inverseSurface }}
      >
        <Text style={{ color: theme.colors.inverseOnSurface }}>{snackbarMessage}</Text>
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 0,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  prefContent: {
    padding: 16,
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
});

export default SettingsScreen;
