import React, { useEffect } from 'react';
import { fcmService } from '../../services/firebase/FCMService';
import { useToast } from '../../context/ToastContext';
import { storageService } from '../../services/StorageService';

/**
 * Controller to handle foreground FCM messages and display UI feedback
 * Must be placed inside ToastProvider
 */
const NotificationController: React.FC = () => {
  const { showToast } = useToast();

  useEffect(() => {
    // Foreground listener
    const unsubscribe = fcmService.onMessage(async (remoteMessage: any) => {
      console.log('Foreground Message:', remoteMessage);

      // Case 1: Standard Notification (with visual payload)
      if (remoteMessage.notification) {
        showToast(remoteMessage.notification.body || 'Nueva notificación', {
          title: remoteMessage.notification.title || 'VTradingAPP',
          position: 'top',
          type: 'info'
        });
        return;
      }

      // Case 2: Data Message (Price Alert Logic in Foreground)
      // Logic mirrors NotificationLogic.ts but for foreground UI
      if (remoteMessage.data) {
        const { symbol, price } = remoteMessage.data;
        if (!symbol || !price) return;

        const currentPrice = parseFloat(price);
        if (isNaN(currentPrice)) return;

        // Check local alerts
        const alerts = await storageService.getAlerts();
        const activeAlerts = alerts.filter((a: any) => a.isActive && a.symbol === symbol);

        activeAlerts.forEach((alert: any) => {
          const targetPrice = parseFloat(alert.target);
          let triggered = false;

          if (alert.condition === 'above' && currentPrice >= targetPrice) {
            triggered = true;
          } else if (alert.condition === 'below' && currentPrice <= targetPrice) {
            triggered = true;
          }

          if (triggered) {
             const isUp = alert.condition === 'above';
             const actionVerb = isUp ? 'subió' : 'bajó';
             const emoji = isUp ? '📈' : '📉';
             
             showToast(`El precio ${actionVerb} a ${currentPrice} (Objetivo: ${targetPrice})`, {
                 title: `Alerta: ${symbol} ${emoji}`,
                 type: isUp ? 'trendUp' : 'trendDown',
                 position: 'top',
                 duration: 6000
             });
          }
        });
      }
    });

    return unsubscribe;
  }, [showToast]);

  return null;
};

export default NotificationController;
