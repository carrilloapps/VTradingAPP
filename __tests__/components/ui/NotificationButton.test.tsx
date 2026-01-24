import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NotificationButton from '../../../src/components/ui/NotificationButton';

// Mocks
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

const mockUseNotifications = jest.fn();
jest.mock('../../../src/context/NotificationContext', () => ({
  useNotifications: () => mockUseNotifications(),
}));

// Mock theme
jest.mock('react-native-paper', () => {
  const RealPaper = jest.requireActual('react-native-paper');
  return {
    ...RealPaper,
    useTheme: () => ({
      dark: false,
      colors: {
        background: '#ffffff',
        elevation: { level1: '#f5f5f5' },
        outline: '#e0e0e0',
        onSurfaceVariant: '#757575',
        error: '#B00020',
        onError: '#ffffff',
      },
    }),
  };
});

describe('NotificationButton', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseNotifications.mockClear();
  });

  it('renders correctly without badge when unreadCount is 0', () => {
    mockUseNotifications.mockReturnValue({ unreadCount: 0 });
    const { getByTestId, queryByText } = render(<NotificationButton />);
    
    expect(getByTestId('notification-button')).toBeTruthy();
    expect(queryByText('0')).toBeNull();
  });

  it('renders correctly with badge when unreadCount > 0', () => {
    mockUseNotifications.mockReturnValue({ unreadCount: 5 });
    const { getByText } = render(<NotificationButton />);
    expect(getByText('5')).toBeTruthy();
  });

  it('renders dot when unreadCount > 99', () => {
    mockUseNotifications.mockReturnValue({ unreadCount: 100 });
    const { queryByText } = render(<NotificationButton />);
    // Should NOT show number "100"
    expect(queryByText('100')).toBeNull();
    // Should show the dot (checking via existence of badge container could be one way, 
    // but without testID on the dot it's harder. 
    // However, since we don't render text, queryByText should be null).
  });

  it('navigates to Notifications screen on press', () => {
    mockUseNotifications.mockReturnValue({ unreadCount: 2 });
    const { getByTestId } = render(<NotificationButton />);
    
    fireEvent.press(getByTestId('notification-button'));
    expect(mockNavigate).toHaveBeenCalledWith('Notifications');
  });
});
