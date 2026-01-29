import React from 'react';
import { StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GradientAppbarProps {
    title: string;
    onBack: () => void;
    onShare?: () => void;
}

const GradientAppbar: React.FC<GradientAppbarProps> = ({ title, onBack, onShare }) => {
    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
            style={styles.appbarGradient}
        >
            <Appbar.Header style={[styles.appbar, { paddingTop: insets.top }]} elevated={false} statusBarHeight={0}>
                <Appbar.BackAction onPress={onBack} color="#FFF" />
                <Appbar.Content title={title || ''} titleStyle={styles.appbarTitle} />
                {onShare && (
                    <Appbar.Action icon="share-variant" onPress={onShare} color="#FFF" />
                )}
            </Appbar.Header>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    appbarGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    appbar: {
        backgroundColor: 'transparent',
        elevation: 0,
    },
    appbarTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
});

export default GradientAppbar;
