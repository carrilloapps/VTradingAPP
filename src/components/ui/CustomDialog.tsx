import React from 'react';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';

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
  cancelMode?: 'text' | 'outlined' | 'contained';
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
            <Button 
              mode={cancelMode} 
              onPress={onDismiss} 
              textColor={cancelMode === 'outlined' ? theme.colors.primary : theme.colors.onSurfaceVariant}
              style={[
                fullWidthActions && { flex: 1 },
                cancelMode === 'outlined' && { borderColor: theme.colors.primary }
              ]}
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
            style={[
              { paddingHorizontal: 16 },
              fullWidthActions && { flex: 1 }
            ]}
            loading={confirmLoading}
            disabled={confirmDisabled || confirmLoading}
          >
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default CustomDialog;
