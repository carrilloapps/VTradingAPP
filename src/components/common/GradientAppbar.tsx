import React from 'react';
import { StyleSheet, View } from 'react-native';
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
    const HEADER_HEIGHT = 56;

    return (
        <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
            style={[styles.appbarGradient, { height: insets.top + HEADER_HEIGHT }]}
        >
            <View style={[styles.contentContainer, { marginTop: insets.top, height: HEADER_HEIGHT }]}>
                <Appbar.BackAction onPress={onBack} color="#FFF" />
                <Appbar.Content title={title || ''} titleStyle={styles.appbarTitle} />
                {onShare && (
                    <Appbar.Action icon="share-variant" onPress={onShare} color="#FFF" />
                )}
            </View>
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
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    appbarTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
});

export default GradientAppbar;
