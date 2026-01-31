import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import Share from 'react-native-share';
import { captureRef } from 'react-native-view-shot';
import { useTheme, Text } from 'react-native-paper';

import UnifiedHeader from '../components/ui/UnifiedHeader';
import MarketStatus from '../components/ui/MarketStatus';
import Calculator from '../components/dashboard/Calculator';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import { useToastStore } from '../stores/toastStore';
import { observabilityService } from '../services/ObservabilityService';
import { analyticsService } from '../services/firebase/AnalyticsService';
import ShareGraphic from '../components/dashboard/ShareGraphic';
import CustomDialog from '../components/ui/CustomDialog';
import CustomButton from '../components/ui/CustomButton';
import { useAuthStore } from '../stores/authStore';
import { useHomeScreenData } from '../hooks/useHomeScreenData';
import RatesSection from '../components/dashboard/RatesSection';
import MarketsSection from '../components/dashboard/MarketsSection';
import AdvancedCalculatorCTA from '../components/dashboard/AdvancedCalculatorCTA';

const HomeScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);

  const {
    loading,
    refreshing,
    rates,
    featuredRates,
    spread,
    stocks,
    lastUpdated,
    isMarketOpen,
    onRefresh
  } = useHomeScreenData();

  const [shareFormat, setShareFormat] = useState<'1:1' | '16:9'>('1:1');
  const [isShareDialogVisible, setShareDialogVisible] = useState(false);
  const [_sharing, setSharing] = useState(false);
  const viewShotRef = React.useRef<any>(null);

  const generateShareImage = async (format: '1:1' | '16:9') => {
    setShareDialogVisible(false);
    setShareFormat(format);
    setSharing(true);

    showToast('Generando imagen para compartir...', 'info');
    await new Promise(resolve => setTimeout(() => resolve(null), 300));

    if (viewShotRef.current) {
      try {
        const uri = await captureRef(viewShotRef.current, {
          format: 'jpg',
          quality: 1.0,
          result: 'tmpfile',
          width: 1080,
          height: format === '1:1' ? 1080 : 1920,
        });

        if (!uri) throw new Error("Failed to capture image");
        const sharePath = uri.startsWith('file://') ? uri : `file://${uri}`;

        await Share.open({
          url: sharePath,
          type: 'image/jpeg',
          message: `Tasas actualizadas en VTrading (${format})`,
        });

        analyticsService.logShare('dashboard_report', 'all', format === '1:1' ? 'image_square' : 'image_story');
      } catch (e) {
        if (e && (e as any).message !== 'User did not share' && (e as any).message !== 'CANCELLED') {
          observabilityService.captureError(e, { context: 'HomeScreen_generateShareImage' });
          showToast('Error al compartir imagen', 'error');
        }
      } finally {
        setSharing(false);
      }
    }
  };

  const handleShareText = useCallback(async () => {
    setShareDialogVisible(false);
    try {
      const bcv = rates.find(r => r.code === 'USD');
      const p2p = rates.find(r => r.code === 'USDT');

      // Safe access to values to prevent crashes if rates are missing
      const bcvVal = bcv?.value ? Number(bcv.value).toFixed(2) : 'N/A';
      const p2pVal = p2p?.value ? Number(p2p.value).toFixed(2) : 'N/A';

      const message = `📊 *VTrading - Reporte Diario*\n\n` +
        (bcv ? `💵 *USD BCV:* ${bcvVal} Bs\n` : '') +
        (p2p ? `🔶 *USDT P2P:* ${p2pVal} Bs\n` : '') +
        (spread ? `⚖️ *Spread:* ${spread.toFixed(2)}%\n` : '') +
        `⏱️ _Act: ${lastUpdated}_\n\n` +
        `🌐 vtrading.app`;

      await Share.open({ message });
      analyticsService.logShare('dashboard_report', 'all', 'text');
    } catch (e) {
      if (e && (e as any).message !== 'User did not share' && (e as any).message !== 'CANCELLED') {
        showToast('Error al compartir texto', 'error');
      }
    }
  }, [rates, spread, lastUpdated, showToast]);

  const handleShareImage = useCallback(() => {
    setShareDialogVisible(true);
  }, []);



  const userData = useMemo(() => ({
    name: user?.displayName || user?.email?.split('@')[0] || 'Invitado',
    avatarUrl: user?.photoURL,
    email: user?.email,
    notificationCount: 3,
    isPremium: !!(user && !user.isAnonymous)
  }), [user]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar backgroundColor="transparent" translucent barStyle={theme.dark ? 'light-content' : 'dark-content'} />
        <DashboardSkeleton />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor="transparent" translucent barStyle={theme.dark ? 'light-content' : 'dark-content'} />

      <UnifiedHeader
        variant="profile"
        userName={userData.name}
        avatarUrl={userData.avatarUrl}
        email={userData.email}
        notificationCount={userData.notificationCount}
        isPremium={userData.isPremium}
        onProfilePress={() => navigation.navigate('Settings')}
        onNotificationPress={() => navigation.navigate('Notifications')}
        showSecondaryAction
        onSecondaryActionPress={handleShareImage}
        secondaryActionIcon="share-variant"
      />

      <ShareGraphic
        viewShotRef={viewShotRef}
        featuredRates={featuredRates}
        spread={spread}
        lastUpdated={lastUpdated}
        isPremium={userData.isPremium}
        aspectRatio={shareFormat}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              progressBackgroundColor={theme.colors.elevation.level3}
            />
          }
        >
          <MarketStatus
            style={styles.marketStatus}
            isOpen={isMarketOpen}
            updatedAt={lastUpdated}
            onRefresh={onRefresh}
          />

          <RatesSection
            rates={rates}
            navigation={navigation}
          />

          <AdvancedCalculatorCTA spread={spread} />

          <MarketsSection
            stocks={stocks}
            navigation={navigation}
          />

          <View style={styles.section}>
            <Calculator />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomDialog
        visible={isShareDialogVisible}
        onDismiss={() => setShareDialogVisible(false)}
        title="Compartir reporte"
        showCancel={false}
        confirmLabel="Cerrar"
        onConfirm={() => setShareDialogVisible(false)}
      >
        <Text variant="bodyMedium" style={styles.dialogDescription}>
          Selecciona el formato ideal para compartir en tus redes sociales
        </Text>

        <View style={styles.dialogButtonsContainer}>
          <CustomButton
            variant="primary"
            label="Imagen cuadrada"
            icon="view-grid-outline"
            onPress={() => generateShareImage('1:1')}
            fullWidth
          />
          <CustomButton
            variant="secondary"
            label="Imagen vertical"
            icon="cellphone"
            onPress={() => generateShareImage('16:9')}
            fullWidth
          />
          <CustomButton
            variant="outlined"
            label="Solo texto"
            icon="text-short"
            onPress={handleShareText}
            fullWidth
          />
        </View>
      </CustomDialog>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  section: { paddingHorizontal: 20, marginBottom: 8 },
  flex1: { flex: 1 },
  marketStatus: { paddingHorizontal: 22, paddingTop: 15, paddingBottom: 20 },
  dialogDescription: { textAlign: 'center', marginBottom: 20 },
  dialogButtonsContainer: { gap: 12 }
});

export default HomeScreen;