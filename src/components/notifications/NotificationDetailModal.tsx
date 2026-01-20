import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/theme';
import { NotificationData } from './NotificationCard';
import NotificationIcon, { getNotificationIconConfig } from './NotificationIcon';
import { formatTimeAgo } from '../../utils/dateUtils';

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
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  if (!notification) return null;

  const iconConfig = getNotificationIconConfig(notification, theme);
  const formattedTime = formatTimeAgo(notification.timestamp);
  const displayTitle = notification.title === 'Notificación' ? iconConfig.fallbackTitle : notification.title;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onDismiss}
        />
        
        <View style={[
          styles.container, 
          { 
            backgroundColor: theme.colors.elevation.level3,
            borderColor: theme.colors.outline,
          }
        ]}>
          {/* Drag Handle Indicator */}
          <View style={styles.dragHandleContainer}>
            <View style={[styles.dragHandle, { backgroundColor: theme.colors.outline }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
               <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                {displayTitle}
               </Text>
               <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                 {formattedTime}
               </Text>
            </View>
            <TouchableOpacity 
              onPress={onDismiss}
              style={[
                styles.closeButton, 
                { 
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.buttonBorder 
                }
              ]}
            >
              <IconButton
                icon="close"
                iconColor={theme.colors.onSurface}
                size={20}
                style={{ margin: 0 }}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 0 }}>
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
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              onPress={() => {
                onArchive(notification.id);
                onDismiss();
              }}
              style={[
                  styles.actionButton, 
                  { 
                      backgroundColor: 'transparent', 
                      borderWidth: 1, 
                      borderColor: theme.colors.primary 
                  }
              ]}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>ARCHIVAR</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => {
                onDelete(notification.id);
                onDismiss();
              }}
              style={[
                  styles.actionButton, 
                  { backgroundColor: theme.colors.error }
              ]}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionButtonText, { color: theme.colors.onError }]}>ELIMINAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  container: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  content: {
    paddingHorizontal: 24,
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
  divider: {
    height: 1,
    marginVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
    paddingHorizontal: 24,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default NotificationDetailModal;
