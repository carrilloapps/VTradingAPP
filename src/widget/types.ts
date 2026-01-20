import type { ColorProp } from 'react-native-android-widget';

export interface WidgetItem {
  id: string;
  label: string;
  value: string;
  currency: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  trendColor: ColorProp;
  trendBg: ColorProp;
}
