import notifee, { AndroidImportance } from '@notifee/react-native';

import { fcmService } from '@/services/firebase/FCMService';
import { storageService } from '@/services/StorageService';
import { observabilityService } from '@/services/ObservabilityService';
import { analyticsService, ANALYTICS_EVENTS } from '@/services/firebase/AnalyticsService';
import SafeLogger from '@/utils/safeLogger';

/**
 * Servicio para inicializar el sistema de notificaciones
 * Este servicio se debe llamar al inicio de la aplicación
 */
class NotificationInitService {
  private isInitialized = false;

  /**
   * Initialize notification channels once at startup
   */
  private async createChannels(): Promise<void> {
    try {
      await notifee.createChannel({
        id: 'price_alerts',
        name: 'Alertas de Precio',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });

      await notifee.createChannel({
        id: 'general',
        name: 'General',
        importance: AndroidImportance.DEFAULT,
      });

      SafeLogger.log('[NotificationInit] Notification channels created');
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'NotificationInitService.createChannels',
      });
    }
  }

  /**
   * Inicializa el sistema completo de notificaciones
   * - Verifica y solicita permisos
   * - Obtiene y registra el token FCM
   * - Suscribe a tópicos demográficos y base
   * - Resuscribe a alertas guardadas
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      SafeLogger.log('[NotificationInit] Already initialized');
      return;
    }

    try {
      SafeLogger.log('[NotificationInit] Starting initialization...');

      // 0. Crear canales de notificación (Android)
      await this.createChannels();

      // 1. Verificar si ya tiene permiso
      const hasPermission = await fcmService.checkPermission();
      SafeLogger.log('[NotificationInit] Has permission:', { hasPermission });

      if (!hasPermission) {
        SafeLogger.log('[NotificationInit] No permission yet, will request on user interaction');
        // No solicitamos automáticamente, esperamos a que el usuario interactúe
        // Pero registramos que no tiene permisos
        await analyticsService.setUserProperty('notification_permission', 'denied');
        return;
      }

      // 2. Verificar preferencia del usuario (pushEnabled)
      const settings = await storageService.getSettings();
      if (!settings.pushEnabled) {
        SafeLogger.log('[NotificationInit] Notifications disabled by user preference');
        await analyticsService.setUserProperty('notification_preference', 'disabled');
        return;
      }

      // 3. Obtener token FCM
      const token = await fcmService.getFCMToken();
      if (token) {
        SafeLogger.log('[NotificationInit] FCM Token obtained');
        await analyticsService.setUserProperty('fcm_token_status', 'active');
        await analyticsService.setUserProperty('notification_preference', 'enabled');
      } else {
        SafeLogger.log('[NotificationInit] Failed to obtain FCM token');
        await analyticsService.setUserProperty('fcm_token_status', 'failed');
        return;
      }

      // 4. Suscribir a tópicos base y demográficos
      await fcmService.subscribeToDemographics(['all_users']);
      SafeLogger.log('[NotificationInit] Subscribed to demographics');

      // 5. Resuscribir a alertas guardadas (solo las activas)
      await this.resubscribeToAlerts();

      // 6. Marcar como inicializado
      this.isInitialized = true;
      await analyticsService.logEvent(ANALYTICS_EVENTS.NOTIFICATION_SYSTEM_INITIALIZED);
      SafeLogger.log('[NotificationInit] Initialization complete');
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'NotificationInitService.initialize',
        action: 'init_notification_system',
      });
      await analyticsService.logError('notification_init');
      SafeLogger.error('[NotificationInit] Initialization failed:', {
        error: e,
      });
    }
  }

  /**
   * Solicita permisos de notificación de forma explícita
   * Debe ser llamado por una acción del usuario
   */
  async requestPermission(): Promise<boolean> {
    try {
      const granted = await fcmService.requestUserPermission();

      await analyticsService.logEvent(ANALYTICS_EVENTS.NOTIFICATION_PERMISSION_REQUESTED, {
        granted,
      });

      await analyticsService.setUserProperty(
        'notification_permission',
        granted ? 'granted' : 'denied',
      );

      if (granted) {
        // Si se otorgó permiso, inicializar todo
        await this.initialize();
      }

      return granted;
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'NotificationInitService.requestPermission',
        action: 'request_notification_permission',
      });
      await analyticsService.logError('notification_permission');
      return false;
    }
  }

  /**
   * Resuscribe a todos los tópicos de alertas guardadas
   * Útil después de reinstalar la app o cambiar de dispositivo
   */
  private async resubscribeToAlerts(): Promise<void> {
    try {
      const alerts = await storageService.getAlerts();
      const activeAlerts = alerts.filter(a => a.isActive);

      if (activeAlerts.length === 0) {
        SafeLogger.log('[NotificationInit] No active alerts to resubscribe');
        return;
      }

      // Obtener símbolos únicos
      const uniqueSymbols = [...new Set(activeAlerts.map(a => a.symbol))];

      // Suscribir a cada tópico
      for (const symbol of uniqueSymbols) {
        const safeSymbol = symbol.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const topic = `ticker_${safeSymbol}`;
        await fcmService.subscribeToTopic(topic);
        SafeLogger.log('[NotificationInit] Resubscribed to:', { topic });
      }

      SafeLogger.log('[NotificationInit] Resubscribed to alert topics', {
        count: uniqueSymbols.length,
      });

      await analyticsService.logEvent(ANALYTICS_EVENTS.NOTIFICATION_ALERTS_RESUBSCRIBED, {
        count: uniqueSymbols.length,
      });
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'NotificationInitService.resubscribeToAlerts',
        action: 'resubscribe_alert_topics',
      });
      await analyticsService.logError('notification_resubscribe');
      SafeLogger.error('[NotificationInit] Failed to resubscribe to alerts:', {
        error: e,
      });
    }
  }

  /**
   * Verifica el estado actual del sistema de notificaciones
   */
  async checkStatus(): Promise<{
    hasPermission: boolean;
    hasToken: boolean;
    isInitialized: boolean;
    activeAlertsCount: number;
  }> {
    try {
      const hasPermission = await fcmService.checkPermission();
      const token = await fcmService.getFCMToken();
      const alerts = await storageService.getAlerts();
      const activeAlertsCount = alerts.filter(a => a.isActive).length;

      return {
        hasPermission,
        hasToken: !!token,
        isInitialized: this.isInitialized,
        activeAlertsCount,
      };
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'NotificationInitService.checkStatus',
        action: 'check_notification_status',
      });
      return {
        hasPermission: false,
        hasToken: false,
        isInitialized: false,
        activeAlertsCount: 0,
      };
    }
  }

  /**
   * Fuerza la reinicialización del sistema
   * Útil después de cambios en configuración o permisos
   */
  async reinitialize(): Promise<void> {
    this.isInitialized = false;
    await this.initialize();
  }
}

export const notificationInitService = new NotificationInitService();
