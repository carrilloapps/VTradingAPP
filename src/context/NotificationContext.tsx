import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storageService, StoredNotification } from '../services/StorageService';
import { fcmService } from '../services/firebase/FCMService';
import { navigationRef } from '../navigation/NavigationRef';
import { observabilityService } from '../services/ObservabilityService';

interface NotificationContextType {
  notifications: StoredNotification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (notification: StoredNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  archiveNotification: (id: string) => void;
  deleteNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isLoading: true,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  archiveNotification: () => {},
  deleteNotification: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const stored = await storageService.getNotifications();
        // If empty, use mock data? Or just empty. Let's use empty to be clean.
        // Or if we want to preserve the mock data from NotificationsScreen for demo purposes:
        if (stored.length === 0) {
            // Optional: Inject mock data if desired, but better to start clean or migrate mocks here.
            // For this task, I'll stick to what's in storage or empty.
            setNotifications([]); 
        } else {
            setNotifications(stored);
        }
      } catch (e) {
        observabilityService.captureError(e);
        // Error loading notifications
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  // Persist notifications when they change
  useEffect(() => {
    if (!isLoading) {
      storageService.saveNotifications(notifications);
    }
  }, [notifications, isLoading]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = useCallback((notification: StoredNotification) => {
    setNotifications(prev => [notification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const archiveNotification = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isArchived: true, isRead: true } : n));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // FCM Logic
  useEffect(() => {
    // 1. Initial Notification (Quit State)
    fcmService.getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        // Notification caused app to open from quit state
        // Navigate to Notifications Screen
        setTimeout(() => {
             if (navigationRef.isReady()) {
                 try {
                     navigationRef.navigate('Notifications');
                 } catch (e) {
                     observabilityService.captureError(e);
                     // Navigation failed
                 }
             }
        }, 1000);
      }
    });

    // 2. Background State
    const unsubscribeOpened = fcmService.onNotificationOpenedApp(_remoteMessage => {
       // Navigate to Notifications Screen
       if (navigationRef.isReady()) {
           try {
               navigationRef.navigate('Notifications');
           } catch (e) {
               observabilityService.captureError(e);
               // Navigation to Notifications failed
           }
       }
    });

    // 3. Foreground State
    const unsubscribeMessage = fcmService.onMessage(async (remoteMessage) => {
      
      // Add to list
      if (remoteMessage.notification || remoteMessage.data) {
        // Extract content with fallbacks
        const dataTitle = (remoteMessage.data?.title as string);
        const notifTitle = (remoteMessage.notification?.title as string);
        const dataBody = (remoteMessage.data?.message as string) || (remoteMessage.data?.body as string);
        const notifBody = (remoteMessage.notification?.body as string);

        // Prioritize data title if notification title is generic "Notificación" or missing
        let finalTitle = notifTitle || dataTitle || 'Notificación';
        let finalBody = notifBody || dataBody || '';

        // Special handling for Price Alerts (symbol + price in data)
        let highlightedVal;
        let trendVal: 'up' | 'down' | undefined;
        let shouldAdd = true; // Default to true for standard messages

        if (remoteMessage.data?.symbol && remoteMessage.data?.price) {
           const symbol = remoteMessage.data.symbol as string;
           const price = parseFloat(remoteMessage.data.price as string);
           
           const formatPrice = (val: number) => val < 0.01 ? val : val.toFixed(2);
           highlightedVal = `${formatPrice(price)}`; 

           if (!isNaN(price)) {
               // Check if this price matches any active alert
               // We need to fetch alerts to know if this is UP or DOWN
               try {
                   const alerts = await storageService.getAlerts();
                   const matchingAlerts = alerts.filter(a => 
                       a.isActive && 
                       a.symbol === symbol &&
                       (
                           (a.condition === 'above' && price >= parseFloat(a.target)) ||
                           (a.condition === 'below' && price <= parseFloat(a.target))
                       )
                   );

                   if (matchingAlerts.length > 0) {
                       // Use the first matching alert to define the message context
                       const alert = matchingAlerts[0];
                       const isUp = alert.condition === 'above';
                       
                       trendVal = isUp ? 'up' : 'down';
                       const directionText = isUp ? 'subida' : 'bajada';
                       const actionVerb = isUp ? 'subió' : 'bajó';
                       const targetPrice = parseFloat(alert.target);
                       const formatPrice = (val: number) => val < 0.01 ? val : val.toFixed(2);
                       const currentPriceFormatted = formatPrice(price);
                       const targetPriceFormatted = formatPrice(targetPrice);
                       
                       // Unified title and body
                       finalTitle = `Alerta de ${directionText}: ${symbol} a ${currentPriceFormatted}`;
                       finalBody = `El precio ${actionVerb} de los ${targetPriceFormatted}`;
                   } else {
                       // Price update received but no alert condition met -> Ignore it
                       shouldAdd = false;
                   }
               } catch (e) {
                   observabilityService.captureError(e);
                   // Error checking alerts in NotificationContext
                   // Fallback: If error checking alerts, add it anyway but try to infer trend
                   // (Keep existing fallback logic if needed, or better safe to not spam?)
                   // Let's keep it but with neutral text if possible.
               }
           }
        }

        if (shouldAdd) {
            const newNotif: StoredNotification = {
            id: remoteMessage.messageId || Date.now().toString(),
            type: (remoteMessage.data?.type as any) || (remoteMessage.data?.symbol ? 'price_alert' : 'system'),
            title: finalTitle,
            message: finalBody,
            timestamp: new Date().toISOString(),
            isRead: false,
            trend: trendVal,
            highlightedValue: highlightedVal,
            data: remoteMessage.data,
            };
            addNotification(newNotif);
        }
      }
    });

    return () => {
      unsubscribeOpened();
      unsubscribeMessage();
    };
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isLoading,
      addNotification,
      markAsRead,
      markAllAsRead,
      archiveNotification,
      deleteNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
