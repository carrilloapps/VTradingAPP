import React from 'react';
import { StyleSheet } from 'react-native';
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
      case 'outlined':
        return 'outlined';
      case 'contained':
        return 'secondary'; // Map to secondary for contained cancel
      default:
        return 'ghost';
    }
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={[
          styles.dialog,
          {
            backgroundColor: theme.colors.elevation.level3,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        <Dialog.Title
          style={[styles.dialogTitle, { color: theme.colors.onSurface }]}
        >
          {title}
        </Dialog.Title>
        <Dialog.Content>
          {content ? (
            <Text
              variant="bodyMedium"
              style={[
                styles.dialogContent,
                {
                  color: theme.colors.onSurfaceVariant,
                },
                children ? styles.contentWithChildren : undefined,
              ]}
            >
              {content}
            </Text>
          ) : null}
          {children}
        </Dialog.Content>
        <Dialog.Actions
          style={[
            styles.dialogActions,
            fullWidthActions ? styles.fullWidthActions : styles.wrappedActions,
          ]}
        >
          {showCancel && (
            <CustomButton
              variant={getCancelVariant()}
              label={cancelLabel}
              onPress={onDismiss}
              style={fullWidthActions ? styles.flexButton : undefined}
            />
          )}
          {actions}
          <CustomButton
            variant={isDestructive ? 'destructive' : 'primary'}
            label={confirmLabel}
            onPress={onConfirm || (() => {})}
            loading={confirmLoading}
            disabled={confirmDisabled}
            style={fullWidthActions ? styles.flexButton : styles.paddedButton}
          />
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 28,
    borderWidth: 1,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  dialogTitle: {
    textAlign: 'center',
    fontSize: 24,
  },
  dialogContent: {
    textAlign: 'center',
  },
  contentWithChildren: {
    marginBottom: 16,
  },
  dialogActions: {
    paddingBottom: 16,
  },
  fullWidthActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  wrappedActions: {
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  flexButton: {
    flex: 1,
  },
  paddedButton: {
    paddingHorizontal: 16,
  },
});

export default CustomDialog;
