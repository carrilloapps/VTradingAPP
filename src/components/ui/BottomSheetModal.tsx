import React, { useRef } from 'react';
import { 
    Modal, 
    View, 
    StyleSheet, 
    TouchableOpacity, 
    KeyboardAvoidingView, 
    Platform,
    ViewStyle,
    PanResponder,
    Animated,
    Dimensions
} from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    const insets = useSafeAreaInsets();
    const panY = useRef(new Animated.Value(0)).current;
    const screenHeight = Dimensions.get('window').height;

    // Reset position when visible changes
    React.useEffect(() => {
        if (visible) {
            panY.setValue(0);
        }
    }, [panY, visible]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only enable swipe down if moving explicitly downwards
                return gestureState.dy > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                // Only allow dragging down (positive Y)
                if (gestureState.dy > 0) {
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // If dragged down more than 100px or with high velocity, close
                if (gestureState.dy > 100 || gestureState.vy > 0.5) {
                    // Animate off screen then close
                    Animated.timing(panY, {
                        toValue: screenHeight,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(onClose);
                } else {
                    // Spring back to top
                    Animated.spring(panY, {
                        toValue: 0,
                        bounciness: 4,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const themeStyles = React.useMemo(() => ({
        container: {
            backgroundColor: theme.colors.elevation.level2,
            borderColor: theme.colors.outline,
            borderWidth: 1, 
            height: height as any,
            paddingBottom: insets.bottom, // Respect safe area
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
    }), [theme, height, insets.bottom]);

    // Only apply flex: 1 if height is NOT auto
    const contentStyle = height === 'auto' ? {} : { flex: 1 };

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
                
                {/* Modal Content - Animated Wrapper */}
                <Animated.View 
                    style={[
                        styles.containerWrapper,
                        { transform: [{ translateY: panY }] }
                    ]}
                >
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={[
                            styles.container, 
                            themeStyles.container,
                            style
                        ]}
                    >
                        {/* Drag Handle Area - Apply PanResponder here */}
                        <View 
                            style={styles.handleArea}
                            {...panResponder.panHandlers}
                        >
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
                        </View>

                        {/* Content */}
                        <View style={[styles.content, contentStyle]}>
                            {children}
                        </View>
                    </KeyboardAvoidingView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)', // Fallback if theme backdrop not set
        justifyContent: 'flex-end',
    },
    containerWrapper: {
        width: '100%',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 0,
        overflow: 'hidden',
        borderWidth: 1,
    },
    handleArea: {
        width: '100%',
        backgroundColor: 'transparent',
    },
    closeButton: {
        margin: 0,
    },
    handleContainer: {
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 8,
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
        paddingBottom: 16,
    },
    content: {
        // flex: 1 removed from default styles
    }
});
