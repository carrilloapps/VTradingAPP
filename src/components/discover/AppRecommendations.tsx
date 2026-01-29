import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppCard from './AppCard';

export interface RecommendedApp {
  id: number;
  name: string;
  description: string;
  icon: string;
  url: string;
  color: string;
}

interface AppRecommendationsProps {
  apps?: RecommendedApp[];
  columns?: number;
}

const DEFAULT_APPS: RecommendedApp[] = [
  {
      id: 1, name: 'TradingView', icon: 'chart-line', color: '#fff',
      description: '',
      url: ''
  },
  {
      id: 2, name: 'MetaMask', icon: 'wallet', color: '#F6851B',
      description: '',
      url: ''
  },
  {
      id: 3, name: 'Binance', icon: 'bitcoin', color: '#F0B90B',
      description: '',
      url: ''
  },
  {
      id: 4, name: 'CoinGecko', icon: 'trending-up', color: '#8DC647',
      description: '',
      url: ''
  },
];

const AppRecommendations = ({ apps = DEFAULT_APPS, columns = 2 }: AppRecommendationsProps) => {
  return (
    <View style={styles.container}>
      {apps.map((app) => (
        <View key={app.id} style={styles.cardWrapper}>
          <AppCard app={app} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8, // Reduced from 12 to fit 4 cards
    paddingHorizontal: 12,
  },
  cardWrapper: {
    flexBasis: '23%', // 4 columns: 4 * 23% = 92% + gaps = ~100%
    flexGrow: 0,
    flexShrink: 0,
  },
});

export default React.memo(AppRecommendations);
