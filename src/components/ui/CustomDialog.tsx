import React from 'react';
import { Dialog, Portal, Text, useTheme } from 'react-native-paper';
import CustomButton, { ButtonVariant } from './CustomButton';

interface CustomDialogProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  content?: string;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  showCancel?: boolean;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  cancelMode?: 'text' | 'outlined' | 'contained'; // Legacy prop mapping
  fullWidthActions?: boolean;
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  visible,
  onDismiss,
  title,
  content,
  onConfirm,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  isDestructive = false,
  showCancel = true,
  actions,
  children,
  confirmLoading = false,
  confirmDisabled = false,
  cancelMode = 'text',
  fullWidthActions = false,
}) => {
  const theme = useTheme();

  // Map legacy cancelMode to CustomButton variant
  const getCancelVariant = (): ButtonVariant => {
    switch (cancelMode) {
      case 'outlined': return 'outlined';
      case 'contained': return 'secondary'; // Map to secondary for contained cancel
      default: return 'ghost';
    }
  };

  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss} 
        style={{ 
          backgroundColor: theme.colors.elevation.level3, 
          borderRadius: 28, // Material 3 standard
          borderColor: theme.colors.outline,
          borderWidth: 1,
          elevation: 0, // Flat style requested
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
        }}
      >
        <Dialog.Title style={{ 
          color: theme.colors.onSurface,
          textAlign: 'center',
          fontSize: 24,
        }}>
          {title}
        </Dialog.Title>
        <Dialog.Content>
          {content ? (
            <Text 
              variant="bodyMedium" 
              style={{ 
                color: theme.colors.onSurfaceVariant,
                textAlign: 'center',
                marginBottom: children ? 16 : 0,
              }}
            >
              {content}
            </Text>
          ) : null}
          {children}
        </Dialog.Content>
        <Dialog.Actions style={[
          { paddingBottom: 16 },
          fullWidthActions 
            ? { flexDirection: 'row', paddingHorizontal: 16, gap: 12 } 
            : { justifyContent: 'space-around', flexWrap: 'wrap' }
        ]}>
          {showCancel && (
            <CustomButton 
              variant={getCancelVariant()}
              label={cancelLabel}
              onPress={onDismiss}
              style={fullWidthActions ? { flex: 1 } : undefined}
            />
          )}
          {actions}
          <CustomButton 
            variant={isDestructive ? 'destructive' : 'primary'}
            label={confirmLabel}
            onPress={onConfirm || (() => {})}
            loading={confirmLoading}
            disabled={confirmDisabled}
            style={fullWidthActions ? { flex: 1 } : { paddingHorizontal: 16 }}
          />
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default CustomDialog;
