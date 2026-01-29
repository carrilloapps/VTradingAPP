import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DiscoverHeaderProps {
    onSearchPress: () => void;
    title?: string;
}

const DiscoverHeader = ({ onSearchPress, title = 'VTrading' }: DiscoverHeaderProps) => {
    const insets = useSafeAreaInsets();
    const theme = useTheme();

    return (
        <View style={[styles.container, { height: insets.top + 60 }]}>
            <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'transparent']}
                style={StyleSheet.absoluteFillObject}
            />
            <View style={[styles.content, { marginTop: insets.top }]}>
                {/* Logo or Title Area */}
                <View style={styles.leftContainer}>
                    <Image 
                        source={require('../../assets/images/logotipo.png')}
                        style={[styles.logo, { tintColor: theme.colors.onBackground }]}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.rightContainer}>
                    <IconButton
                        icon="magnify"
                        iconColor={theme.colors.onBackground}
                        size={26}
                        onPress={onSearchPress}
                        style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
        paddingBottom: 4, 
    },
    logo: {
        height: 28,
        width: 120, 
        tintColor: 'white', 
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        margin: 0,
        backgroundColor: 'rgba(255,255,255,0.15)', // Glass effect
        borderRadius: 12,
    },
});

export default DiscoverHeader;
