import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useTheme, ActivityIndicator } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import UnifiedHeader from '@/components/ui/UnifiedHeader';
import { analyticsService } from '@/services/firebase/AnalyticsService';
import SafeLogger from '@/utils/safeLogger';

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

  React.useEffect(() => {
    analyticsService.logScreenView('WebView', 'WebViewScreen');
    analyticsService.logFeatureUsage('webview', { url, title });
  }, [url, title]);

  if (!url) {
    SafeLogger.warn('WebViewScreen: No URL provided');
    navigation.goBack();
    return null;
  }

  // Script para ocultar header, footer y breadcrumbs en vtrading.app
  const hideElementsScript = `
    (function() {
      try {
        if (window.location.hostname.includes('vtrading.app')) {
          const style = document.createElement('style');
          style.innerHTML = \`
            header, .header, #header, .site-header, .main-header,
            footer, .footer, #footer, .site-footer, .main-footer,
            .breadcrumbs, .breadcrumb, .breadcrumb-container, nav[aria-label="breadcrumb"], .yoast-breadcrumbs {
               display: none !important;
             }
             
             /* Ajuste de márgenes superiores para acercar el contenido */
             body, #page, .site, .site-content, .content-area, main, article {
               margin-top: 10px !important;
               padding-top: 0 !important;
             }
             
             .entry-content, .entry-header {
               margin-top: 10px !important;
               padding-top: 0 !important;
             }
           \`;
           document.head.appendChild(style);
        }
      } catch (e) {
        // Silent error - observability not available in WebView context
        console.warn('[WebView] CSS injection failed:', e);
      }
    })();
    true;
  `;

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
          injectedJavaScript={hideElementsScript}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          style={[styles.webView, { backgroundColor: theme.colors.background }]}
          containerStyle={{ backgroundColor: theme.colors.background }}
        />

        {isLoading && (
          <View style={[styles.loadingContainer, { backgroundColor: theme.colors.backdrop }]}>
            <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
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
  webView: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WebViewScreen;
