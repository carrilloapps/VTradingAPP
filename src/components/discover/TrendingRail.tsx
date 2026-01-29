import React from 'react';
import { View, StyleSheet, FlatList, Image } from 'react-native';
import { Text, TouchableRipple, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { FormattedPost } from '../../services/WordPressService';

interface TrendingRailProps {
    items: FormattedPost[];
    title?: string;
}

const TrendingRail = ({ items, title = 'Tendencias' }: TrendingRailProps) => {
    const theme = useTheme();
    const navigation = useNavigation<any>();

    const renderItem = ({ item }: { item: FormattedPost }) => (
        <TouchableRipple 
            onPress={() => navigation.navigate('ArticleDetail', { article: item })}
            style={[styles.card, { borderRadius: theme.roundness * 2, marginRight: 12 }]}
            borderless
        >
            <View>
                <Image source={{ uri: item.image }} style={[styles.image, { borderRadius: theme.roundness * 2 }]} />
                <View style={styles.cardContent}>
                    {item.categories && item.categories.length > 0 && (
                        <Text style={[styles.category, { color: theme.colors.primary }]}>
                            {item.categories[0].name.toUpperCase()}
                        </Text>
                    )}
                    <Text variant="titleSmall" style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={2}>
                        {item.title}
                    </Text>
                     <Text variant="labelSmall" style={{ color: theme.colors.outline, marginTop: 4 }}>
                        {item.time}
                    </Text>
                </View>
            </View>
        </TouchableRipple>
    );

    if (!items.length) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text variant="titleLarge" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                    {title}
                </Text>
                {/* <Text variant="labelLarge" style={{ color: theme.colors.primary }}>Ver todo</Text> */} 
                {/* Optional view all */}
            </View>
            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => `trending-${item.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    headerTitle: {
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: 20,
    },
    card: {
        width: 160,
        backgroundColor: 'transparent',
    },
    image: {
        width: 160,
        height: 100,
        backgroundColor: '#f0f0f0',
        marginBottom: 8,
    },
    cardContent: {
        paddingHorizontal: 4,
    },
    category: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    title: {
        fontWeight: 'bold',
        lineHeight: 18,
    },
});

export default TrendingRail;
