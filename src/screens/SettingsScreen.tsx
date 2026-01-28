import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text, useTheme, Switch, Snackbar, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DeviceInfo from 'react-native-device-info';
import { fcmService } from '../services/firebase/FCMService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import CustomDialog from '../components/ui/CustomDialog';
import AboutDialog from '../components/ui/AboutDialog';
import { useThemeContext } from '../theme/ThemeContext';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { storageService, UserAlert } from '../services/StorageService';
import { observabilityService } from '../services/ObservabilityService';
import { AppConfig } from '../constants/AppConfig';
import { analyticsService } from '../services/firebase/AnalyticsService';

import UserProfileCard from '../components/settings/UserProfileCard';
import AlertItem from '../components/settings/AlertItem';
import ThemeSelector from '../components/settings/ThemeSelector';
import MenuButton from '../components/settings/MenuButton';
import ProfileEditDialog from '../components/settings/ProfileEditDialog';
import LogoutDialog from '../components/settings/LogoutDialog';
import SettingsSkeleton from '../components/settings/SettingsSkeleton';

const SettingsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { themeMode, setThemeMode } = useThemeContext();
  const { user, signOut, updateProfileName, deleteAccount } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  
  // App Info State
  const [appName, setAppName] = useState('');
  const [appVersion, setAppVersion] = useState('');
  const [buildNumber, setBuildNumber] = useState('');
  
  // Feedback State
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  // Functional State
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        try {
          // App Info
          setAppName(DeviceInfo.getApplicationName());
          setAppVersion(DeviceInfo.getVersion());
          setBuildNumber(DeviceInfo.getBuildNumber());

          // Settings & Alerts
          const settings = await storageService.getSettings();
          if (isActive) {
            setPushEnabled(settings.pushEnabled);
          }
          
          const savedAlerts = await storageService.getAlerts();
          if (isActive) {
            setAlerts(savedAlerts);
            setLoading(false);
          }
        } catch (e) {
          observabilityService.captureError(e);
          showToast('Error cargando configuración', 'error');
          if (isActive) {
            setLoading(false);
          }
        }
      };
      
      loadData();

      return () => {
        isActive = false;
      };
    }, [showToast])
  );

  const handleAction = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    setShowLogoutDialog(false);
    try {
        await signOut(showToast);
        // Navigation will handle the switch to AuthStack automatically via Zustand store
    } catch (e) {
        observabilityService.captureError(e);
        handleAction("Error al cerrar sesión");
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccountDialog(true);
  };

  const confirmDeleteAccount = async () => {
    setDeleteAccountLoading(true);
    try {
      await deleteAccount(showToast);
      setShowDeleteAccountDialog(false);
    } catch (e) {
      observabilityService.captureError(e);
      handleAction('Error al eliminar la cuenta');
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  const handleEditProfile = () => {
    setShowEditProfileDialog(true);
  };

  const saveProfileName = async (newName: string) => {
    try {
      await updateProfileName(newName, showToast);
      await analyticsService.logEvent('update_profile_name');
    } catch (error) {
      handleAction("Error al actualizar el perfil");
      showToast('Error al actualizar el perfil', 'error');
    }
  };

  const openExternalUrl = (url: string, title?: string) => {
    // @ts-ignore
    navigation.navigate('WebView', { url, title: title || 'Navegador' });
  };

  const togglePush = async (value: boolean) => {
      setPushEnabled(value);
      await storageService.saveSettings({ pushEnabled: value });
      await analyticsService.logEvent('toggle_push', { enabled: value });
      handleAction(`Notificaciones ${value ? 'habilitadas' : 'deshabilitadas'}`);
  };

  const handleThemeChange = async (mode: 'light' | 'dark' | 'system') => {
      setThemeMode(mode);
      await analyticsService.logEvent('change_theme', { mode });
  };

  const getTopicName = (symbol: string) => {
    // Topic por Símbolo (ej. ticker_usd_ves)
    // El backend enviará actualizaciones de precio a este topic
    // La app filtrará localmente si cumple la condición (target)
    const safeSymbol = symbol.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `ticker_${safeSymbol}`;
  };

  const toggleAlert = async (id: string, value: boolean) => {
      // Prevent double toggle
      if (togglingIds.has(id)) return;

      const alert = alerts.find(a => a.id === id);
      if (!alert) return;

      // Optimistic update
      const originalAlerts = [...alerts];
      const updated = alerts.map(a => a.id === id ? { ...a, isActive: value } : a);
      setAlerts(updated);

      // Add to toggling set
      setTogglingIds(prev => new Set(prev).add(id));

      try {
        // FCM Logic
        const topic = getTopicName(alert.symbol);
        
        if (value) {
            await fcmService.subscribeToTopic(topic);
        } else {
            // Check if other active alerts exist for the same symbol
            const otherActiveAlerts = updated.filter(a => 
                a.id !== id && a.symbol === alert.symbol && a.isActive
            );
            
            if (otherActiveAlerts.length === 0) {
                await fcmService.unsubscribeFromTopic(topic);
            }
        }
        
        // Persist to storage
        await storageService.saveAlerts(updated);
        handleAction(`Alerta ${value ? 'activada' : 'desactivada'}`);

      } catch (err) {
        showToast('Error al actualizar alerta', 'error');
        // Revert on error
        setAlerts(originalAlerts);
        handleAction('Error al actualizar la alerta');
      } finally {
        // Remove from toggling set
        setTogglingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
      }
  };

  const deleteAlert = async (id: string) => {
      const alert = alerts.find(a => a.id === id);
      if (alert && alert.isActive) {
        const topic = getTopicName(alert.symbol);
        try {
             // Solo desuscribir si no hay otras alertas activas para el mismo símbolo
             const otherActiveAlerts = alerts.filter(a => 
                a.id !== id && a.symbol === alert.symbol && a.isActive
            );
            
            if (otherActiveAlerts.length === 0) {
                await fcmService.unsubscribeFromTopic(topic);
            }
        } catch (e) {
            observabilityService.captureError(e);
            showToast('Error al desuscribir del tema', 'error');
        }
      }

      const updated = alerts.filter(a => a.id !== id);
      setAlerts(updated);
      await storageService.saveAlerts(updated);
      if (alert) {
        await analyticsService.logEvent('delete_alert', { symbol: alert.symbol });
      }
      handleAction('Alerta eliminada');
  };

  const handleEditAlert = (alert: UserAlert) => {
    (navigation as any).navigate('AddAlert', { editAlert: alert });
  };

  const handleAddAlert = () => {
      if (alerts.length >= 5) {
        Alert.alert('Límite Alcanzado', 'Solo puedes tener un máximo de 5 alertas activas.');
         return;
      }
      (navigation as any).navigate('AddAlert');
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  const handleRegister = () => {
    // For anonymous users, signing out redirects to the Auth flow where they can register
    handleLogout();
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
        rightActionIcon="information-outline"
        onActionPress={() => setShowAboutDialog(true)}
      />

      <ScrollView 
        contentContainerStyle={[styles.content, styles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile */}
        <View style={styles.section}>
          <UserProfileCard 
            user={user} 
            onEdit={handleEditProfile} 
            onRegister={handleRegister}
          />
        </View>

        {/* Alerts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>ALERTAS ACTIVAS</Text>
            <TouchableOpacity 
              style={[styles.addButton, alerts.length >= 5 && { opacity: 0.5 }]}
              onPress={handleAddAlert}
              disabled={alerts.length >= 5}
            >
              <MaterialCommunityIcons name="plus" size={18} color={theme.colors.primary} />
              <Text style={[styles.newAlertText, { color: theme.colors.primary }]}>Nueva alerta</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.cardContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.elevation.level1 }]}>
            {alerts.length === 0 ? (
                <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ 
                        width: 56, 
                        height: 56, 
                        borderRadius: 28, 
                        backgroundColor: theme.colors.elevation.level2,
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginBottom: 16
                    }}>
                        <MaterialCommunityIcons name="bell-plus" size={32} color={theme.colors.primary} />
                    </View>
                    <Text style={{ 
                        fontSize: 16, 
                        fontWeight: 'bold', 
                        color: theme.colors.onSurface,
                        marginBottom: 8 
                    }}>
                        Crea tu primera alerta
                    </Text>
                    <Text style={{ 
                        fontSize: 14, 
                        color: theme.colors.onSurfaceVariant, 
                        textAlign: 'center',
                        lineHeight: 20
                    }}>
                        Recibe notificaciones instantáneas cuando las tasas o acciones alcancen el precio que te interesa.
                    </Text>
                    <Button 
                        mode="outlined" 
                        onPress={handleAddAlert}
                        style={{ marginTop: 16, borderColor: theme.colors.outline }}
                        textColor={theme.colors.primary}
                    >
                        Crear Alerta
                    </Button>
                </View>
            ) : (
                alerts.map((alert, index) => (
                    <React.Fragment key={alert.id}>
                        <AlertItem 
                          symbol={alert.symbol}
                          status={alert.condition === 'above' ? 'Sube' : 'Baja'}
                          target={alert.target}
                          isActive={alert.isActive}
                          onToggle={(v) => toggleAlert(alert.id, v)}
                          onDelete={() => deleteAlert(alert.id)}
                          onPress={() => handleEditAlert(alert)}
                          disabled={togglingIds.has(alert.id)}
                          iconName={alert.iconName || 'show-chart'}
                        />
                        {index < alerts.length - 1 && (
                            <View style={[styles.separator, { backgroundColor: theme.colors.outline }]} />
                        )}
                    </React.Fragment>
                ))
            )}
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
                  <MaterialCommunityIcons name="bell-outline" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
                <Text variant="bodyLarge" style={[styles.prefText, { color: theme.colors.onSurface }]}>Notificaciones push</Text>
              </View>
              <Switch 
                value={pushEnabled} 
                onValueChange={togglePush} 
                color={theme.colors.primary} 
              />
            </View>

            {/* Widgets - Android Only */}
            {Platform.OS === 'android' && (
              <>
                <View style={[styles.separator, { backgroundColor: theme.colors.outline }]} />
                <TouchableOpacity onPress={() => navigation.navigate('Widgets' as never)}>
                  <View style={styles.prefRow}>
                    <View style={styles.prefLeft}>
                      <View style={[styles.iconBox, { backgroundColor: theme.colors.elevation.level2 }]}>
                        <MaterialCommunityIcons name="widgets" size={20} color={theme.colors.onSurfaceVariant} />
                      </View>
                      <Text variant="bodyLarge" style={[styles.prefText, { color: theme.colors.onSurface }]}>Personalización de widgets</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
                  </View>
                </TouchableOpacity>
              </>
            )}

            <View style={[styles.separator, { backgroundColor: theme.colors.outline }]} />

            {/* Appearance */}
            <View style={styles.prefContent}>
              <View style={styles.prefLeft}>
                <View style={[styles.iconBox, { backgroundColor: theme.colors.elevation.level2 }]}>
                  <MaterialCommunityIcons name="palette" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
                <Text variant="bodyLarge" style={[styles.prefText, { color: theme.colors.onSurface }]}>Apariencia</Text>
              </View>
              <ThemeSelector currentTheme={themeMode} onSelect={handleThemeChange} />
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>CUENTA</Text>
          <View style={[styles.cardContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.elevation.level1 }]}>
            <MenuButton
                      icon="shield-account"
                      label="Políticas de privacidad"
                      onPress={() => openExternalUrl(AppConfig.PRIVACY_POLICY_URL, 'Políticas de privacidad')}
                    />
            <MenuButton
              icon="gavel"
              label="Términos y condiciones"
              onPress={() => openExternalUrl(AppConfig.TERMS_OF_USE_URL, 'Términos y condiciones')}
              hasTopBorder
            />
            <MenuButton 
              icon="logout" 
              label="Cerrar sesión" 
              onPress={handleLogout} 
              isDanger
              hasTopBorder
            />
          </View>
          
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
              {appName} v{appVersion} (BUILD {buildNumber}) {__DEV__ ? 'DEBUG' : ''}
            </Text>
            <Text style={[styles.footerSubText, { color: theme.colors.onSurfaceVariant }]}>
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

      <LogoutDialog
        visible={showLogoutDialog}
        onDismiss={() => setShowLogoutDialog(false)}
        onConfirm={confirmLogout}
      />

      <ProfileEditDialog
        visible={showEditProfileDialog}
        onDismiss={() => setShowEditProfileDialog(false)}
        currentName={user?.displayName || ''}
        onSave={saveProfileName}
      />

      <AboutDialog
        visible={showAboutDialog}
        onDismiss={() => setShowAboutDialog(false)}
        showDeleteAccount={true}
        onDeleteAccount={handleDeleteAccount}
      />

      <CustomDialog
        visible={showDeleteAccountDialog}
        onDismiss={() => setShowDeleteAccountDialog(false)}
        title="Eliminar cuenta"
        content="Al eliminar la cuenta se borrarán todos los datos en los servidores del app, pero su configuración local se mantiene, como widget y personalización."
        onConfirm={confirmDeleteAccount}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        isDestructive
        confirmLoading={deleteAccountLoading}
        confirmDisabled={deleteAccountLoading}
        cancelMode="outlined"
        fullWidthActions
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 0,
    paddingTop: 20,
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
    borderRadius: 24, // Matches standard
    borderWidth: 1,
    overflow: 'hidden',
    // Flat style
    elevation: 0,
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
  scrollContent: {
    paddingBottom: 100,
  },
  newAlertText: {
    fontWeight: '700',
    fontSize: 14,
  },
  separator: {
    height: 1,
  },
  prefText: {
    fontWeight: '500',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerSubText: {
    fontSize: 10,
    marginTop: 4,
    opacity: 0.7,
  },
  aboutLinksContainer: {
    width: '100%',
    marginBottom: 16,
  },
});

export default SettingsScreen;
