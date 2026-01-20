import React from 'react';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';

interface CustomDialogProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  content: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  showCancel?: boolean;
  actions?: React.ReactNode;
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
}) => {
  const theme = useTheme();

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
          <Text 
            variant="bodyMedium" 
            style={{ 
              color: theme.colors.onSurfaceVariant,
              textAlign: 'center',
            }}
          >
            {content}
          </Text>
        </Dialog.Content>
        <Dialog.Actions style={{ justifyContent: 'space-around', paddingBottom: 16, flexWrap: 'wrap' }}>
          {showCancel && (
            <Button 
              mode="text" 
              onPress={onDismiss} 
              textColor={theme.colors.onSurfaceVariant}
            >
              {cancelLabel}
            </Button>
          )}
          {actions}
          <Button 
            mode="contained" 
            onPress={onConfirm} 
            buttonColor={isDestructive ? theme.colors.error : theme.colors.primary}
            textColor={isDestructive ? theme.colors.onError : theme.colors.onPrimary}
            style={{ paddingHorizontal: 16 }}
          >
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default CustomDialog;
