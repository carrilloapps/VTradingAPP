import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Text, useTheme, Switch } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import { useThemeContext } from '../theme/ThemeContext';

import UserProfileCard from '../components/settings/UserProfileCard';
import AlertItem from '../components/settings/AlertItem';
import ThemeSelector from '../components/settings/ThemeSelector';
import MenuButton from '../components/settings/MenuButton';

const SettingsScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { themeMode, setThemeMode } = useThemeContext();

  // Mock State
  const [alerts, setAlerts] = useState({
    usd: true,
    cantv: false,
  });
  const [pushEnabled, setPushEnabled] = useState(true);

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
            <TouchableOpacity style={styles.addButton}>
              <MaterialIcons name="add" size={18} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 14 }}>Nueva Alerta</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.cardContainer, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.elevation.level1 }]}>
            <AlertItem 
              symbol="USD/VES"
              status="Sube"
              target="40.50"
              isActive={alerts.usd}
              onToggle={(v) => setAlerts(p => ({ ...p, usd: v }))}
              iconName="currency-exchange"
              iconColor={theme.dark ? '#4ade80' : '#15803d'} // green-400 / green-700
              iconBgColor={theme.dark ? 'rgba(74, 222, 128, 0.2)' : '#dcfce7'} // green-100
            />
            <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant }} />
            <AlertItem 
              symbol="CANTV"
              status="Baja"
              target="3.20"
              isActive={alerts.cantv}
              onToggle={(v) => setAlerts(p => ({ ...p, cantv: v }))}
              iconName="show-chart"
              iconColor={theme.dark ? '#60a5fa' : '#1d4ed8'} // blue-400 / blue-700
              iconBgColor={theme.dark ? 'rgba(96, 165, 250, 0.2)' : '#dbeafe'} // blue-100
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>PREFERENCIAS</Text>
          
          <View style={[styles.cardContainer, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.elevation.level1 }]}>
            {/* Push Notifications */}
            <View style={styles.prefRow}>
              <View style={styles.prefLeft}>
                <View style={[styles.iconBox, { backgroundColor: theme.dark ? '#334155' : '#f1f5f9' }]}>
                  <MaterialIcons name="notifications" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
                <Text variant="bodyLarge" style={{ fontWeight: '500', color: theme.colors.onSurface }}>Notificaciones Push</Text>
              </View>
              <Switch value={pushEnabled} onValueChange={setPushEnabled} color={theme.colors.primary} />
            </View>

            <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant }} />

            {/* Appearance */}
            <View style={styles.prefContent}>
              <View style={styles.prefLeft}>
                <View style={[styles.iconBox, { backgroundColor: theme.dark ? '#334155' : '#f1f5f9' }]}>
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
          <View style={[styles.cardContainer, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.elevation.level1 }]}>
            <MenuButton 
              icon="security" 
              label="Seguridad y Privacidad" 
              onPress={() => {}} 
            />
            <MenuButton 
              icon="logout" 
              label="Cerrar Sesión" 
              onPress={() => {}} 
              isDanger
              hasTopBorder
            />
          </View>
          
          <View style={styles.footer}>
            <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, fontWeight: '500' }}>
              Finanzas VE v2.4.0 (Build 302)
            </Text>
          </View>
        </View>

      </ScrollView>
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
  }
});

export default SettingsScreen;
