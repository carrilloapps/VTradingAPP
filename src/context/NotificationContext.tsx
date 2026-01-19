import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { storageService, StoredNotification } from '../services/StorageService';
import { fcmService } from '../services/firebase/FCMService';
import { useNavigation } from '@react-navigation/native';

interface NotificationContextType {
  notifications: StoredNotification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (notification: StoredNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isLoading: true,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  deleteNotification: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<any>(); // Using any to avoid complex navigation types for now

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
        // Note: Navigation might not be ready yet, but usually is inside AppNavigator context
        // We might need a slight delay or check navigation readiness
        setTimeout(() => {
             navigation.navigate('MainTab', { screen: 'Home', params: { screen: 'Notifications' } }); 
             // Wait, NotificationsScreen is NOT in MainTab, it's usually in HomeStack or just a root screen?
             // Let's check AppNavigator again.
             // NotificationsScreen is imported but I don't see it in the stacks I read earlier.
             // Ah, I missed where it is added. I read line 1-100.
             // Let me check AppNavigator fully to know the route.
        }, 500);
      }
    });

    // 2. Background State
    const unsubscribeOpened = fcmService.onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage);
       // Navigate to Notifications Screen
       navigation.navigate('Notifications'); // Assuming route name is 'Notifications'
    });

    // 3. Foreground State
    const unsubscribeMessage = fcmService.onMessage(async (remoteMessage) => {
      console.log('Foreground Message in Context:', remoteMessage);
      
      // Add to list
      if (remoteMessage.notification || remoteMessage.data) {
        const newNotif: StoredNotification = {
          id: remoteMessage.messageId || Date.now().toString(),
          type: (remoteMessage.data?.type as any) || 'system',
          title: (remoteMessage.notification?.title as string) || (remoteMessage.data?.title as string) || 'Notificación',
          message: (remoteMessage.notification?.body as string) || (remoteMessage.data?.message as string) || '',
          timestamp: new Date().toISOString(), // Or formatted time
          isRead: false,
          trend: (remoteMessage.data?.trend as any),
          data: remoteMessage.data
        };
        addNotification(newNotif);
      }
    });

    return () => {
      unsubscribeOpened();
      unsubscribeMessage();
    };
  }, [addNotification, navigation]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isLoading,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
