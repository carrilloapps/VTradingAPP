import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme/theme';
import ArticleSkeleton from './ArticleSkeleton';

const ArticleDetailSkeleton = () => {
    const theme = useAppTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const containerStyle = [
        styles.container,
        { backgroundColor: theme.colors.background }
    ];

    const headerStyle = [
        styles.header,
        { paddingTop: insets.top }
    ];

    return (
        <View style={containerStyle}>
            <View style={headerStyle}>
                <IconButton 
                    icon="chevron-left" 
                    onPress={() => navigation.goBack()} 
                    size={24}
                />
            </View>
            <ArticleSkeleton variant="detail" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 56,
        paddingHorizontal: 4,
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
});

export default ArticleDetailSkeleton;
