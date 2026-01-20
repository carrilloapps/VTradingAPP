export interface WidgetItem {
  id: string;
  label: string;
  value: string;
  currency: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  trendColor: string;
  trendBg: string;
}
