import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TouchableRipple, Icon } from 'react-native-paper';
import { useAppTheme } from '../../theme/theme';

interface SectionHeaderProps {
    title: string;
    showViewAll?: boolean;
    onViewAll?: () => void;
}

const SectionHeader = ({ title, showViewAll, onViewAll }: SectionHeaderProps) => {
    const theme = useAppTheme();
    return (
        <View style={styles.listHeader}>
            <Text 
                variant="headlineSmall" 
                style={[
                    styles.sectionTitle, 
                    { 
                        color: theme.colors.onSurface,
                        fontWeight: '800',
                    }
                ]}
            >
                {title}
            </Text>
            
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
        paddingHorizontal: 20,
        marginTop: 24,
        marginBottom: 12,
    },
    sectionTitle: {
        letterSpacing: -0.5,
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
