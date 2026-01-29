import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, IconButton, Surface, ActivityIndicator } from 'react-native-paper';
import { useAppTheme } from '../../theme/theme';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPrevious: () => void;
    onNext: () => void;
    loading?: boolean;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
    currentPage,
    totalPages,
    onPrevious,
    onNext,
    loading = false,
}) => {
    const theme = useAppTheme();

    if (totalPages <= 1) return null;

    return (
        <Surface
            style={[styles.container, { backgroundColor: theme.colors.elevation.level1 }]}
            elevation={1}
        >
            <View style={styles.content}>
                <IconButton
                    icon="chevron-left"
                    size={24}
                    disabled={currentPage <= 1 || loading}
                    onPress={onPrevious}
                    iconColor={theme.colors.primary}
                />

                <View style={styles.pageIndicator}>
                    {loading ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                        <Text variant="labelLarge" style={styles.text}>
                            Página <Text style={[styles.text, { color: theme.colors.primary, fontWeight: 'bold' }]}>{currentPage}</Text> de {totalPages}
                        </Text>
                    )}
                </View>

                <IconButton
                    icon="chevron-right"
                    size={24}
                    disabled={currentPage >= totalPages || loading}
                    onPress={onNext}
                    iconColor={theme.colors.primary}
                />
            </View>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 20,
        borderRadius: 16,
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pageIndicator: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        letterSpacing: 0.5,
    },
});

export default React.memo(PaginationControls);
