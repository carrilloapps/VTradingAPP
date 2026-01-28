import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
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
            <View style={styles.headerTitleGroup}>
                <View style={[styles.sectionAccent, { backgroundColor: theme.colors.primary }]} />
                <Text 
                    variant="displaySmall" 
                    style={[
                        styles.sectionTitle, 
                        { 
                            color: theme.colors.onSurface,
                            fontSize: 28, 
                            fontWeight: '900',
                            letterSpacing: -1.2,
                            textTransform: 'uppercase'
                        }
                    ]}
                >
                    {title}
                </Text>
            </View>
            {showViewAll && (
                <Button 
                    mode="elevated" 
                    onPress={onViewAll}
                    style={styles.viewAllButton}
                    labelStyle={{ fontWeight: '900', letterSpacing: 0.5, fontSize: 11 }}
                    contentStyle={{ height: 32 }}
                >
                    VER TODO
                </Button>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginTop: 40, // Increased for a more "breathable" layout
        marginBottom: 16,
    },
    headerTitleGroup: {
        gap: 8,
    },
    sectionAccent: {
        width: 32,
        height: 4,
        borderRadius: 2,
    },
    sectionTitle: {
        marginBottom: 0,
        lineHeight: 32,
    },
    viewAllButton: {
        borderRadius: 8,
    },
});

export default React.memo(SectionHeader);
