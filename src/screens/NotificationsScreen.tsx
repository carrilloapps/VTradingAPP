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

// Mock Data
const MOCK_NOTIFICATIONS: NotificationData[] = [
  {
    id: '1',
    type: 'price_alert',
    title: 'Alerta de Precio: USD BCV',
    message: 'La tasa oficial ha subido a 36.24 Bs (+0.12% hoy).',
    timestamp: '9:41 AM',
    isRead: false,
    trend: 'up',
  },
  {
    id: '2',
    type: 'market_news',
    title: 'Mercado de Valores',
    message: 'Las acciones de Banco Provincial han superado el volumen promedio de hoy.',
    timestamp: 'Hace 2h',
    isRead: false,
    trend: 'up',
  },
  {
    id: '3',
    type: 'system',
    title: 'Mantenimiento de Red',
    message: 'Se realizarán ajustes técnicos en la plataforma entre las 2:00 AM y 4:00 AM.',
    timestamp: '8:15 AM',
    isRead: false,
  },
  {
    id: '4',
    type: 'price_alert',
    title: 'Alerta de Precio: USDT Paralelo',
    message: 'La tasa de Binance ha bajado a 37.50 Bs (-0.05% hoy).',
    timestamp: 'Ayer',
    isRead: true,
    trend: 'down',
  },
];

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

  // State
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState<NotificationData[]>(MOCK_NOTIFICATIONS);

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
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    // In a real app, this might move to a separate "Archived" list or delete it
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleNotificationPress = (id: string) => {
    // Mark as read and navigate?
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
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
