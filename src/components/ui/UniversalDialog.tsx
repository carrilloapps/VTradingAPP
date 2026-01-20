import React from 'react';
import { View, StyleSheet, Modal as RNModal, TouchableOpacity, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, IconButton, Surface } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/theme';

interface UniversalDialogProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * UniversalDialog
 * 
 * A reusable dialog component that follows the "Universal Flat Card Design" and
 * matches the aesthetic of the provided HTML reference (Clean, Flat, Dark, Rounded).
 * 
 * Design Specs:
 * - Elevation: 0 (Flat)
 * - Border: 1px solid theme.colors.outline (or subtle white/5 in dark mode)
 * - Radius: 24px (rounded-2xl)
 * - Header: Title + Close Button
 */
const UniversalDialog: React.FC<UniversalDialogProps> = ({ 
  visible, 
  onDismiss, 
  title, 
  children, 
  actions 
}) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
           style={StyleSheet.absoluteFill} 
           activeOpacity={1} 
           onPress={onDismiss}
        />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          pointerEvents="box-none"
        >
            <Surface 
              style={[
                styles.container, 
                { 
                  backgroundColor: theme.colors.elevation.level3,
                  borderColor: theme.colors.outline,
                  borderRadius: 24, // theme.roundness * 6
                }
              ]}
              elevation={0} // Force flat design
            >
                {/* Header */}
                <View style={styles.header}>
                  {title && (
                    <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
                      {title}
                    </Text>
                  )}
                  <TouchableOpacity 
                    onPress={onDismiss}
                    style={[
                      styles.closeButton, 
                      { 
                        backgroundColor: theme.colors.surfaceVariant, // or white/5 equivalent
                        borderColor: theme.colors.buttonBorder 
                      }
                    ]}
                  >
                    <IconButton 
                      icon="close" 
                      size={20} 
                      iconColor={theme.colors.onSurface}
                      style={{ margin: 0 }}
                    />
                  </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.content}>
                  {children}
                </View>

                {/* Actions */}
                {actions && (
                  <View style={styles.actions}>
                    {actions}
                  </View>
                )}
              </Surface>
          </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // dim background
    justifyContent: 'center',
    padding: 20,
  },
  keyboardView: {
    justifyContent: 'center',
    width: '100%',
  },
  container: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    borderWidth: 1,
    // overflow: 'hidden', // Removed to allow dropdowns to overflow if needed, though they are usually inside.
    // If we remove overflow hidden, we need to ensure border radius is respected by children if they have backgrounds.
    // But for dropdowns, it's better to NOT clip.
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0, // Simplified for flat look
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    gap: 12,
  },
});

export default UniversalDialog;
