import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { NotificationData } from './NotificationCard';
import NotificationIcon, { getNotificationIconConfig } from './NotificationIcon';
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
  onDelete,
}) => {
  const theme = useTheme();

  if (!notification) return null;

  const iconConfig = getNotificationIconConfig(notification, theme);
  const formattedTime = formatTimeAgo(notification.timestamp);
  const displayTitle = notification.title === 'Notificación' ? iconConfig.fallbackTitle : notification.title;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onDismiss}
      title={displayTitle}
      height="auto"
      style={{ maxHeight: '90%' }}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 48, paddingHorizontal: 24 }}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 16 }}>
          {formattedTime}
        </Text>

        {/* Main Icon Centered */}
        <View style={styles.iconWrapper}>
           <NotificationIcon notification={notification} size={48} />
        </View>

        {/* Message */}
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, textAlign: 'center', marginBottom: 24 }}>
          {notification.message}
        </Text>

        {/* Extra Data (Symbol/Price) */}
        {notification.data && (notification.data.symbol || notification.data.price) && (
          <View style={[styles.dataContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
             {notification.data.symbol && (
               <View style={styles.dataRow}>
                 <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Divisa</Text>
                 <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>{notification.data.symbol}</Text>
               </View>
             )}
             {notification.data.symbol && notification.data.price && (
               <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
             )}
             {notification.data.price && (
               <View style={styles.dataRow}>
                 <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Precio</Text>
                 <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>Bs. {notification.data.price}</Text>
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
  divider: {
    height: 1,
    marginVertical: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  }
});

export default NotificationDetailModal;
