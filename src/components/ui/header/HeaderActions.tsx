import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import NotificationButton from '../NotificationButton';

interface HeaderActionsProps {
    onActionPress?: () => void;
    onSecondaryActionPress?: () => void;
    rightActionIcon?: string;
    secondaryActionIcon?: string;
    showNotification?: boolean;
    showSecondaryAction?: boolean;
    notificationIcon?: string;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({
    onActionPress,
    onSecondaryActionPress,
    rightActionIcon = 'refresh',
    secondaryActionIcon = 'share-variant',
    showNotification = true,
    showSecondaryAction = false,
    notificationIcon = 'bell-outline',
}) => {
    const theme = useTheme();

    const buttonBgColor = theme.colors.elevation.level1;
    const commonButtonStyle = {
        backgroundColor: buttonBgColor,
        borderWidth: 1,
        borderColor: theme.dark ? 'transparent' : theme.colors.outline,
    };

    return (
        <View style={styles.rightContent}>
            {onActionPress && (
                <TouchableRipple
                    onPress={onActionPress}
                    style={[styles.iconButton, commonButtonStyle]}
                    borderless
                    rippleColor="rgba(0, 0, 0, .1)"
                    accessibilityRole="button"
                    accessibilityLabel={rightActionIcon === 'refresh' ? "Actualizar datos" : "Más opciones"}
                    accessibilityHint={rightActionIcon === 'refresh' ? "Refrescar el contenido de la pantalla" : "Mostrar menú de acciones adicionales"}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    {rightActionIcon ? (
                        <MaterialCommunityIcons
                            name={rightActionIcon}
                            size={24}
                            color={theme.colors.onSurface}
                        />
                    ) : (
                        <MaterialCommunityIcons
                            name="dots-vertical"
                            size={24}
                            color={theme.colors.onSurfaceVariant}
                        />
                    )}
                </TouchableRipple>
            )}

            {showSecondaryAction && onSecondaryActionPress && (
                <TouchableRipple
                    onPress={onSecondaryActionPress}
                    style={[styles.iconButton, commonButtonStyle]}
                    borderless
                    rippleColor="rgba(0, 0, 0, .1)"
                    accessibilityRole="button"
                    accessibilityLabel={secondaryActionIcon === 'share-variant' ? "Compartir" : "Acción secundaria"}
                    accessibilityHint={secondaryActionIcon === 'share-variant' ? "Compartir este contenido" : ""}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialCommunityIcons
                        name={secondaryActionIcon}
                        size={24}
                        color={theme.colors.onSurface}
                    />
                </TouchableRipple>
            )}

            {showNotification && (
                <NotificationButton
                    icon={notificationIcon}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
});

export default React.memo(HeaderActions);
