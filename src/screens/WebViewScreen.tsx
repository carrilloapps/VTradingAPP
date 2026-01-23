import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { useTheme } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import UnifiedHeader from '../components/ui/UnifiedHeader';

type RootStackParamList = {
  WebView: { url: string; title?: string };
};

type WebViewScreenRouteProp = RouteProp<RootStackParamList, 'WebView'>;

const WebViewScreen = () => {
  const theme = useTheme();
  const route = useRoute<WebViewScreenRouteProp>();
  const navigation = useNavigation();
  const { url, title } = route.params;
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        backgroundColor="transparent" 
        translucent 
        barStyle={theme.dark ? 'light-content' : 'dark-content'} 
      />
      
      <UnifiedHeader 
        title={title || 'Navegador'} 
        variant="simple" 
        showNotification={false}
        showAd={false}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.webViewContainer}>
        <WebView
          source={{ uri: url }}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          style={{ flex: 1, backgroundColor: theme.colors.background }}
          containerStyle={{ backgroundColor: theme.colors.background }}
        />
        
        {isLoading && (
          <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WebViewScreen;
