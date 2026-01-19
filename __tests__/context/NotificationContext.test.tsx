import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { NotificationProvider, useNotifications } from '../../src/context/NotificationContext';
import { storageService, StoredNotification } from '../../src/services/StorageService';
import { fcmService } from '../../src/services/firebase/FCMService';

// Mock Services
jest.mock('../../src/services/StorageService', () => ({
  storageService: {
    getNotifications: jest.fn().mockResolvedValue([]),
    saveNotifications: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../src/services/firebase/FCMService', () => ({
  fcmService: {
    getInitialNotification: jest.fn().mockResolvedValue(null),
    onNotificationOpenedApp: jest.fn().mockReturnValue(() => {}),
    onMessage: jest.fn().mockReturnValue(() => {}),
  },
}));

jest.mock('../../src/navigation/NavigationRef', () => ({
  navigationRef: {
    isReady: jest.fn().mockReturnValue(true),
    navigate: jest.fn(),
  },
}));

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides initial state', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: NotificationProvider,
    });

    // Wait for initial load
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('adds a notification', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: NotificationProvider,
    });
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const newNotification: StoredNotification = {
      id: '1',
      title: 'Test',
      message: 'Body',
      timestamp: '2024-01-01',
      type: 'system',
      isRead: false,
    };

    act(() => {
      result.current.addNotification(newNotification);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toEqual(newNotification);
    expect(result.current.unreadCount).toBe(1);
  });

  it('marks notification as read', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: NotificationProvider,
    });
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const notification: StoredNotification = {
      id: '1',
      title: 'Test',
      message: 'Body',
      timestamp: '2024-01-01',
      type: 'system',
      isRead: false,
    };

    act(() => {
      result.current.addNotification(notification);
    });

    act(() => {
      result.current.markAsRead('1');
    });

    expect(result.current.notifications[0].isRead).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('deletes a notification', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: NotificationProvider,
    });
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const notification: StoredNotification = {
      id: '1',
      title: 'Test',
      message: 'Body',
      timestamp: '2024-01-01',
      type: 'system',
      isRead: false,
    };

    act(() => {
      result.current.addNotification(notification);
    });

    act(() => {
      result.current.deleteNotification('1');
    });

    expect(result.current.notifications).toHaveLength(0);
  });
});
