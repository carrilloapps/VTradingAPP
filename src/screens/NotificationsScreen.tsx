import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, FlatList, StatusBar, TouchableOpacity } from 'react-native';
import { Text, IconButton, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

import UnifiedHeader from '../components/ui/UnifiedHeader';
import { useAppTheme } from '../theme/useAppTheme';
import SearchBar from '../components/ui/SearchBar';
import FilterSection, { FilterOption } from '../components/ui/FilterSection';
import NotificationCard, { NotificationData } from '../components/notifications/NotificationCard';
import { useNotifications } from '../context/NotificationContext';

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
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  // State
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Filter Logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // 1. Tab Filter (Read/Unread)
      const matchesTab = activeTab === 'unread' ? !n.isRead : n.isRead;
      
      // 2. Category Filter
      const matchesCategory = activeFilter === 'all' || n.type === activeFilter;

      // 3. Search Filter
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            n.message.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesCategory && matchesSearch;
    });
  }, [notifications, activeTab, activeFilter, searchQuery]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Actions
  const handleArchive = (id: string) => {
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        backgroundColor="transparent"
        translucent
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
      />

      {/* Unified Header + Search + Filter */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.outline,
          borderBottomWidth: 1,
        }
      ]}>
        <UnifiedHeader 
          variant="simple" 
          title="Notificaciones" 
          onBackPress={() => navigation.goBack()}
          onActionPress={() => { /* Navigate to Archive? */ }}
          rightActionIcon="archive"
          showNotification={false}
          style={{ paddingHorizontal: 0, paddingTop: insets.top }}
        />

        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar notificaciones..."
          />
        </View>

        <FilterSection
          options={FILTER_OPTIONS}
          selectedValue={activeFilter}
          onSelect={setActiveFilter}
          style={{ marginBottom: 12 }}
        />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Tabs */}
        <View style={[styles.tabsRow, { borderBottomColor: theme.colors.outline }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'unread' && { borderBottomColor: theme.colors.primary }]}
            onPress={() => setActiveTab('unread')}
          >
            <Text 
              style={[
                styles.tabText, 
                { color: activeTab === 'unread' ? theme.colors.onSurface : theme.colors.onSurfaceVariant }
              ]}
            >
              No leídas ({unreadCount})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'read' && { borderBottomColor: theme.colors.primary }]}
            onPress={() => setActiveTab('read')}
          >
            <Text 
              style={[
                styles.tabText, 
                { color: activeTab === 'read' ? theme.colors.onSurface : theme.colors.onSurfaceVariant }
              ]}
            >
              Leídas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Row */}
        {activeTab === 'unread' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              onPress={handleMarkAllRead}
              style={styles.markReadButton}
            >
              <MaterialIcons name="done-all" size={16} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase', marginLeft: 4 }}>
                Limpiar Todo
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={() => handleNotificationPress(item.id)}
              onArchive={() => handleArchive(item.id)}
            />
          )}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <MaterialIcons name="notifications-off" size={48} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
              <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
                No hay notificaciones
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  searchContainer: {
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontWeight: 'bold',
    fontSize: 14,
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
});

export default NotificationsScreen;
