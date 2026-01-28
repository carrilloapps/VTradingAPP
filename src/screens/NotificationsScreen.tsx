import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, StyleSheet, StatusBar, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text, Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import PagerView from 'react-native-pager-view';

import UnifiedHeader from '../components/ui/UnifiedHeader';
import { useAppTheme } from '../theme/theme';
import SearchBar from '../components/ui/SearchBar';
import FilterSection, { FilterOption } from '../components/ui/FilterSection';
import NotificationCard, { NotificationData } from '../components/notifications/NotificationCard';
import NotificationDetailModal from '../components/notifications/NotificationDetailModal';
import NotificationsSkeleton from '../components/notifications/NotificationsSkeleton';
import { useNotifications } from '../context/NotificationContext';

const isFabricEnabled = !!(globalThis as any).nativeFabricUIManager;

if (Platform.OS === 'android' && !isFabricEnabled) {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const NotificationsScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { notifications, markAsRead, markAllAsRead, deleteNotification, archiveNotification, isLoading } = useNotifications();
  const pagerRef = useRef<PagerView>(null);

  // Filter Options with Theme Colors
  const FILTER_OPTIONS: FilterOption[] = [
    { label: 'Todas', value: 'all', icon: 'filter-variant' },
    { label: 'Tasas', value: 'price_alert', icon: 'cash-multiple', color: theme.colors.tertiary },
    { label: 'Acciones', value: 'market_news', icon: 'chart-line', color: theme.colors.primary },
    { label: 'Generales', value: 'system', icon: 'wrench', color: theme.colors.warning },
  ];

  // State
  const [activeTab, setActiveTab] = useState<'unread' | 'read' | 'archived'>('unread');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);

  // Filter Logic Helper
  const filterNotifications = useCallback((items: NotificationData[]) => {
    return items.filter(n => {
      // Category Filter
      const matchesCategory = activeFilter === 'all' || n.type === activeFilter;
      // Search Filter
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            n.message.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeFilter, searchQuery]);

  const unreadNotifications = useMemo(() => 
    filterNotifications(notifications.filter(n => !n.isRead && !n.isArchived)), 
  [notifications, filterNotifications]);

  const readNotifications = useMemo(() => 
    filterNotifications(notifications.filter(n => n.isRead && !n.isArchived)), 
  [notifications, filterNotifications]);

  const archivedNotifications = useMemo(() => 
    filterNotifications(notifications.filter(n => n.isArchived)), 
  [notifications, filterNotifications]);

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
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      setSelectedNotification(notification);
    }
  };

  const handleModalDismiss = () => {
    if (selectedNotification && !selectedNotification.isRead) {
      markAsRead(selectedNotification.id);
    }
    setSelectedNotification(null);
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
      <Icon
        source="bell-off-outline"
        size={80}
        color={theme.colors.onSurfaceVariant}
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
    <FlashList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <NotificationCard
          notification={item}
          onPress={() => handleNotificationPress(item.id)}
          onArchive={() => handleArchive(item.id)}
          onDelete={() => handleDelete(item.id)}
          showSwipeHint={index === 0}
        />
      )}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}
      ListEmptyComponent={renderEmptyState(emptyTitle, emptySubtitle)}
      showsVerticalScrollIndicator={false}
    />
  );
  
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
          onActionPress={() => (navigation.navigate as any)('Main', { screen: 'Settings' })}
          rightActionIcon="cog"
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
              <Icon source="check-all" size={16} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase', marginLeft: 4 }}>
                Marcar todo como leído
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pager Content */}
        {isLoading ? (
           <View style={{ flex: 1 }}>
             <NotificationsSkeleton />
           </View>
        ) : (
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
        )}
      </View>

      <NotificationDetailModal 
        visible={!!selectedNotification}
        notification={selectedNotification}
        onDismiss={handleModalDismiss}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />
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
