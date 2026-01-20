import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storageService, StoredNotification } from '../services/StorageService';
import { fcmService } from '../services/firebase/FCMService';
import { navigationRef } from '../navigation/NavigationRef';

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
        console.error('Error loading notifications', e);
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
        console.log('Notification caused app to open from quit state:', remoteMessage);
        // Navigate to Notifications Screen
        setTimeout(() => {
             if (navigationRef.isReady()) {
                 try {
                     navigationRef.navigate('Notifications');
                 } catch (e) {
                     console.log('Navigation to Notifications failed (possibly unauthenticated)', e);
                 }
             }
        }, 1000);
      }
    });

    // 2. Background State
    const unsubscribeOpened = fcmService.onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage);
       // Navigate to Notifications Screen
       if (navigationRef.isReady()) {
           try {
               navigationRef.navigate('Notifications');
           } catch (e) {
               console.log('Navigation to Notifications failed', e);
           }
       }
    });

    // 3. Foreground State
    const unsubscribeMessage = fcmService.onMessage(async (remoteMessage) => {
      console.log('Foreground Message in Context:', remoteMessage);
      
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
        let highlightedVal = undefined;
        let trendVal: 'up' | 'down' | undefined = undefined;
        
        if (remoteMessage.data?.symbol && remoteMessage.data?.price) {
           const symbol = remoteMessage.data.symbol;
           const price = remoteMessage.data.price;
           highlightedVal = `${price}`; // e.g. "36.24"
           
           // If title is generic, make it specific
           if (finalTitle === 'Notificación') {
             finalTitle = `Alerta de Precio: ${symbol}`;
           }
           
           // If body is empty, construct it
           if (!finalBody) {
             finalBody = `La tasa oficial ha subido a ${price} Bs.`;
           }
           
           // Try to determine trend from body or data if available
           if (remoteMessage.data?.trend) {
              trendVal = remoteMessage.data.trend as 'up' | 'down';
           } else {
              // Infer from keywords if missing
              const textContent = (finalTitle + ' ' + finalBody).toLowerCase();
              if (textContent.includes('baja') || textContent.includes('down') || textContent.includes('cae') || textContent.includes('disminuye')) {
                trendVal = 'down';
              } else {
                trendVal = 'up'; // Default to up if no negative keywords found
              }
           }
        }

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
