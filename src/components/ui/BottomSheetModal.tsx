import React from 'react';
import { 
    Modal, 
    View, 
    StyleSheet, 
    TouchableOpacity, 
    KeyboardAvoidingView, 
    Platform,
    ViewStyle
} from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';

interface BottomSheetModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    height?: string | number;
    style?: ViewStyle;
}

export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({ 
    visible, 
    onClose, 
    title, 
    children, 
    height = '80%',
    style
}) => {
    const theme = useTheme();

    const themeStyles = React.useMemo(() => ({
        container: {
            backgroundColor: theme.colors.elevation.level2,
            borderColor: theme.colors.outline,
            borderWidth: 1, // Ensure border
            height: height as any,
            // Flat style
            shadowColor: 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
            elevation: 0,
        },
        handleBar: {
            backgroundColor: theme.colors.outline,
        },
        title: {
            fontWeight: 'bold' as const,
            color: theme.colors.onSurface,
        }
    }), [theme, height]);

    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            transparent={true} 
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Backdrop - Tap to close */}
                <TouchableOpacity 
                    style={StyleSheet.absoluteFill} 
                    onPress={onClose} 
                    activeOpacity={1}
                />
                
                {/* Modal Content */}
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={[
                        styles.container, 
                        themeStyles.container,
                        style
                    ]}
                >
                    {/* Handle Bar */}
                    <View style={styles.handleContainer}>
                        <View style={[styles.handleBar, themeStyles.handleBar]} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        {title && (
                            <Text variant="headlineSmall" style={themeStyles.title}>
                                {title}
                            </Text>
                        )}
                        <IconButton 
                            icon="close" 
                            size={24} 
                            iconColor={theme.colors.onSurfaceVariant}
                            onPress={onClose} 
                            style={styles.closeButton}
                        />
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {children}
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        // backgroundColor handled via theme
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 8,
        paddingBottom: 0,
        overflow: 'hidden', // Ensure content doesn't bleed out of rounded corners
        borderWidth: 1, // Added borderWidth since borderColor was present but no width
    },
    closeButton: {
        margin: 0,
    },
    handleContainer: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    handleBar: {
        width: 32,
        height: 4,
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    content: {
        flex: 1,
        // Removed default horizontal padding to allow full-width lists
    }
});
