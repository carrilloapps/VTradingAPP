import React, { useState, useMemo, useRef } from 'react';
import { View, StyleSheet, FlatList, StatusBar, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import PagerView from 'react-native-pager-view';
import LottieView from 'lottie-react-native';

import UnifiedHeader from '../components/ui/UnifiedHeader';
import { useAppTheme } from '../theme/useAppTheme';
import SearchBar from '../components/ui/SearchBar';
import FilterSection, { FilterOption } from '../components/ui/FilterSection';
import NotificationCard, { NotificationData } from '../components/notifications/NotificationCard';
import NotificationsSkeleton from '../components/notifications/NotificationsSkeleton';
import { useNotifications } from '../context/NotificationContext';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const FILTER_OPTIONS: FilterOption[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Tasas', value: 'price_alert' },
  { label: 'Acciones', value: 'market_news' },
  { label: 'Generales', value: 'system' },
];

const NotificationsScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { notifications, markAsRead, markAllAsRead, deleteNotification, archiveNotification, isLoading } = useNotifications();
  const pagerRef = useRef<PagerView>(null);

  // State
  const [activeTab, setActiveTab] = useState<'unread' | 'read' | 'archived'>('unread');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter Logic Helper
  const filterNotifications = (items: NotificationData[]) => {
    return items.filter(n => {
      // Category Filter
      const matchesCategory = activeFilter === 'all' || n.type === activeFilter;
      // Search Filter
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            n.message.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  const unreadNotifications = useMemo(() => 
    filterNotifications(notifications.filter(n => !n.isRead && !n.isArchived)), 
  [notifications, activeFilter, searchQuery]);

  const readNotifications = useMemo(() => 
    filterNotifications(notifications.filter(n => n.isRead && !n.isArchived)), 
  [notifications, activeFilter, searchQuery]);

  const archivedNotifications = useMemo(() => 
    filterNotifications(notifications.filter(n => n.isArchived)), 
  [notifications, activeFilter, searchQuery]);

  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;

  // Actions
  const handleArchive = (id: string) => {
    archiveNotification(id);
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleNotificationPress = (id: string) => {
    markAsRead(id);
    // Future: Navigate to specific detail based on type
    // e.g., if (type === 'price_alert') navigation.navigate('Details', { ... })
  };

  const handlePageSelected = (e: any) => {
    const page = e.nativeEvent.position;
    let newTab: 'unread' | 'read' | 'archived' = 'unread';
    if (page === 1) newTab = 'read';
    if (page === 2) newTab = 'archived';
    
    if (activeTab !== newTab) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveTab(newTab);
    }
  };

  const renderEmptyState = (title: string, subtitle: string) => (
    <View style={styles.emptyContainer}>
      <LottieView
        source={require('../assets/animations/splash.json')}
        autoPlay
        loop
        style={styles.lottie}
        resizeMode="contain"
      />
      <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
        {subtitle}
      </Text>
    </View>
  );

  const renderList = (data: NotificationData[], emptyTitle: string, emptySubtitle: string) => (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <NotificationCard
          notification={item}
          onPress={() => handleNotificationPress(item.id)}
          onArchive={() => handleArchive(item.id)}
          onDelete={() => handleDelete(item.id)}
        />
      )}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20, flexGrow: 1 }}
      ListEmptyComponent={renderEmptyState(emptyTitle, emptySubtitle)}
      showsVerticalScrollIndicator={false}
    />
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          backgroundColor="transparent"
          translucent
          barStyle={theme.dark ? 'light-content' : 'dark-content'}
        />
        <NotificationsSkeleton />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        backgroundColor="transparent"
        translucent
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
      />

      {/* Unified Header + Search */}
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.background }]}>
        <UnifiedHeader 
          variant="section" 
          title="Notificaciones" 
          subtitle="Tus alertas y avisos recientes"
          onBackPress={() => navigation.goBack()}
          onActionPress={() => { /* Navigate to Archive? */ }}
          rightActionIcon="archive"
          showNotification={false}
          style={styles.headerStyle}
        />

        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar notificaciones..."
            onFilterPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowFilters(!showFilters);
            }}
          />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.controlsContainer}>
          {/* Collapsible Filters */}
          {showFilters && (
            <FilterSection
              options={FILTER_OPTIONS}
              selectedValue={activeFilter}
              onSelect={(val) => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setActiveFilter(val);
              }}
              style={{ marginTop: 0, marginBottom: 12 }}
            />
          )}

          {/* Segmented Tabs (Read/Unread/Archived) */}
          <View style={[styles.segmentedContainer, { backgroundColor: theme.colors.elevation.level1 }]}>
            <TouchableOpacity 
              style={[
                styles.segment, 
                activeTab === 'unread' && { backgroundColor: theme.colors.secondaryContainer }
              ]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setActiveTab('unread');
                pagerRef.current?.setPage(0);
              }}
              activeOpacity={0.7}
            >
              <Text 
                style={[
                  styles.segmentText, 
                  { color: activeTab === 'unread' ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant }
                ]}
              >
                No leídas {unreadCount > 0 && `(${unreadCount})`}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.segment, 
                activeTab === 'read' && { backgroundColor: theme.colors.secondaryContainer }
              ]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setActiveTab('read');
                pagerRef.current?.setPage(1);
              }}
              activeOpacity={0.7}
            >
              <Text 
                style={[
                  styles.segmentText, 
                  { color: activeTab === 'read' ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant }
                ]}
              >
                Leídas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.segment, 
                activeTab === 'archived' && { backgroundColor: theme.colors.secondaryContainer }
              ]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setActiveTab('archived');
                pagerRef.current?.setPage(2);
              }}
              activeOpacity={0.7}
            >
              <Text 
                style={[
                  styles.segmentText, 
                  { color: activeTab === 'archived' ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant }
                ]}
              >
                Archivadas
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Row */}
        {activeTab === 'unread' && unreadCount > 0 && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              onPress={handleMarkAllRead}
              style={styles.markReadButton}
            >
              <MaterialIcons name="done-all" size={16} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase', marginLeft: 4 }}>
                Marcar todo como leído
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pager Content */}
        <PagerView
          ref={pagerRef}
          style={styles.pagerView}
          initialPage={0}
          onPageSelected={handlePageSelected}
        >
          <View key="unread" style={styles.page}>
            {renderList(unreadNotifications, 'No tienes notificaciones nuevas', '¡Estás al día! No hay nuevas notificaciones.')}
          </View>
          <View key="read" style={styles.page}>
            {renderList(readNotifications, 'No hay notificaciones leídas', 'Tu historial de notificaciones leídas está vacío.')}
          </View>
          <View key="archived" style={styles.page}>
            {renderList(archivedNotifications, 'No hay notificaciones archivadas', 'Las notificaciones que archives aparecerán aquí.')}
          </View>
        </PagerView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingBottom: 8,
    // Removed borderBottomWidth/Color here as UnifiedHeader handles visual separation or we rely on content separation
  },
  headerStyle: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
  },
  segmentText: {
    fontWeight: '600',
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 300,
  },
  lottie: {
    width: 300,
    height: 300,
  },
  emptyTitle: {
    marginTop: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtitle: {
    textAlign: 'center',
    maxWidth: '80%',
    opacity: 0.7,
  },
});

export default NotificationsScreen;
