import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/theme';
import { analyticsService } from '../../services/firebase/AnalyticsService';
import { NotificationData } from './NotificationCard';
import NotificationIcon, {
  getNotificationIconConfig,
} from './NotificationIcon';
import { formatTimeAgo } from '../../utils/dateUtils';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import CustomButton from '../ui/CustomButton';

interface NotificationDetailModalProps {
  visible: boolean;
  notification: NotificationData | null;
  onDismiss: () => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  visible,
  notification,
  onDismiss,
  onArchive,
}) => {
  const theme = useAppTheme();

  React.useEffect(() => {
    if (visible && notification) {
      analyticsService.logInteraction('dialog_opened', {
        dialog_type: 'notification_detail',
        notification_id: notification.id,
        notification_title: notification.title,
      });
    }
  }, [visible, notification]);

  if (!notification) return null;

  const iconConfig = getNotificationIconConfig(notification, theme);
  const formattedTime = formatTimeAgo(notification.timestamp);
  const displayTitle =
    notification.title === 'Notificación'
      ? iconConfig.fallbackTitle
      : notification.title;

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return val;
    return num < 0.01 ? num : num.toFixed(2);
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onDismiss}
      title={displayTitle}
      height="auto"
      style={styles.modal}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text
          variant="bodySmall"
          style={[styles.timeText, { color: theme.colors.onSurfaceVariant }]}
        >
          {formattedTime}
        </Text>

        {/* Main Icon Centered */}
        <View style={styles.iconWrapper}>
          <NotificationIcon notification={notification} size={48} />
        </View>

        {/* Message */}
        <Text
          variant="bodyLarge"
          style={[styles.messageText, { color: theme.colors.onSurface }]}
        >
          {notification.message}
        </Text>

        {/* Extra Data (Symbol/Price) */}
        {notification.data &&
          (notification.data.symbol || notification.data.price) && (
            <View
              style={[
                styles.dataContainer,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              {notification.data.symbol && (
                <View style={styles.dataRow}>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Divisa
                  </Text>
                  <Text
                    variant="titleMedium"
                    style={[styles.boldText, { color: theme.colors.onSurface }]}
                  >
                    {notification.data.symbol}
                  </Text>
                </View>
              )}
              {notification.data.symbol && notification.data.price && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.colors.outlineVariant },
                  ]}
                />
              )}
              {notification.data.price && (
                <View style={styles.dataRow}>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Precio
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text
                      variant="titleMedium"
                      style={[
                        styles.boldText,
                        {
                          color:
                            notification.trend === 'up'
                              ? theme.colors.success
                              : notification.trend === 'down'
                                ? theme.colors.error
                                : theme.colors.onSurface,
                        },
                      ]}
                    >
                      Bs. {formatPrice(notification.data.price)}
                    </Text>
                    {notification.trend && (
                      <MaterialCommunityIcons
                        name={
                          notification.trend === 'up'
                            ? 'trending-up'
                            : 'trending-down'
                        }
                        size={20}
                        color={
                          notification.trend === 'up'
                            ? theme.colors.success
                            : theme.colors.error
                        }
                        style={styles.trendIcon}
                      />
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

        {/* Actions - Standardized with CustomButton */}
        <View style={styles.actionsContainer}>
          <CustomButton
            variant="outlined"
            label="CERRAR"
            onPress={onDismiss}
            style={styles.button}
          />

          <CustomButton
            variant="primary"
            label="ARCHIVAR"
            onPress={() => {
              onArchive(notification.id);
              onDismiss();
            }}
            icon="archive-arrow-down-outline"
            style={styles.button}
          />
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  modal: {
    maxHeight: '90%',
  },
  scrollContent: {
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  timeText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  messageText: {
    textAlign: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  dataContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  boldText: {
    fontWeight: 'bold',
  },
  trendIcon: {
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
});

export default NotificationDetailModal;
