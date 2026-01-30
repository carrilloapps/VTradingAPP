import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TouchableRipple, Icon } from 'react-native-paper';
import { useAppTheme } from '../../theme/theme';

interface SectionHeaderProps {
    title: string;
    showViewAll?: boolean;
    onViewAll?: () => void;
    paddingHorizontal?: number;
    variant?: 'primary' | 'secondary';
    center?: boolean;
    hideAccent?: boolean;
}

const SectionHeader = ({
    title,
    showViewAll,
    onViewAll,
    paddingHorizontal = 16,
    variant = 'primary',
    center = false,
    hideAccent = false
}: SectionHeaderProps) => {
    const theme = useAppTheme();
    return (
        <View style={[
            styles.listHeader,
            { paddingHorizontal },
            center && { justifyContent: 'center' }
        ]}>
            <View style={styles.titleWrapper}>
                {(variant === 'primary' && !center && !hideAccent) && (
                    <View style={[styles.accent, { backgroundColor: theme.colors.primary }]} />
                )}
                <Text
                    variant={variant === 'primary' ? 'headlineSmall' : 'labelMedium'}
                    style={[
                        styles.sectionTitle,
                        {
                            color: variant === 'primary' ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
                            fontWeight: '900',
                            textTransform: variant === 'secondary' ? 'uppercase' : 'none',
                            letterSpacing: variant === 'secondary' ? 2 : -0.75,
                            opacity: variant === 'secondary' ? 0.7 : 1,
                            flex: center ? 1 : undefined,
                            textAlign: center ? 'center' : 'left',
                        }
                    ]}
                >
                    {title}
                </Text>
            </View>

            {showViewAll && (
                <TouchableRipple
                    onPress={onViewAll}
                    borderless
                    style={{ borderRadius: 12 }}
                >
                    <View style={styles.actionRow}>
                        <Text
                            variant="labelLarge"
                            style={{
                                color: theme.colors.primary,
                                fontWeight: '700'
                            }}
                        >
                            Ver todo
                        </Text>
                        <Icon source="chevron-right" size={20} color={theme.colors.primary} />
                    </View>
                </TouchableRipple>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 12,
    },
    sectionTitle: {
        // fontWeight handled in component to allow for variant switching
    },
    titleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    accent: {
        width: 4,
        height: 18,
        borderRadius: 2,
        marginRight: 10,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingVertical: 4,
        paddingLeft: 8,
    },
});

export default React.memo(SectionHeader);
