import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { fcmService } from '../../services/firebase/FCMService';
import { useToastStore } from '../../stores/toastStore';
import { storageService } from '../../services/StorageService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * Controller to handle foreground FCM messages and display UI feedback
 * Must be placed inside ToastProvider
 */
const NotificationController: React.FC = () => {
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    // Foreground listener
    const unsubscribe = fcmService.onMessage(async (remoteMessage: any) => {
      // Foreground Message received

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
             // Format: COP/VES -> COP por VES
             const readableSymbol = symbol.replace('/', ' por ');
             
             // Smart formatting: 2 decimals for standard values, preserve precision for small crypto
             const formatPrice = (val: number) => val < 0.01 ? val : val.toFixed(2);
             const displayCurrent = formatPrice(currentPrice);
             const displayTarget = formatPrice(targetPrice);

             // Construct rich message with inline icon
             const richMessage = (
               <Text>
                 El precio {actionVerb} a {displayCurrent} {readableSymbol}, según tu objetivo de{' '}
                 <MaterialCommunityIcons 
                    name={isUp ? 'trending-up' : 'trending-down'} 
                    size={14} 
                 />
                 {' '}{displayTarget} {readableSymbol}
               </Text>
             );
             
             showToast(richMessage, {
                 title: `${isUp ? 'Subida' : 'Bajada'} para ${symbol}`,
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
