import React from 'react';
import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';
import { WidgetItem } from './types';

interface VTradingWidgetProps {
  items: WidgetItem[];
  widgetTitle: string;
  isTransparent: boolean;
  isWidgetDarkMode: boolean;
  isWallpaperDark: boolean;
  showGraph: boolean;
  lastUpdated?: string;
}

export default function VTradingWidget({
  items,
  widgetTitle,
  isTransparent,
  isWidgetDarkMode,
  isWallpaperDark,
  showGraph,
  lastUpdated
}: VTradingWidgetProps) {
  const backgroundColor = isTransparent
    ? isWallpaperDark
      ? 'rgba(33, 33, 33, 0.8)'
      : 'rgba(255, 255, 255, 0.85)'
    : undefined;

  const gradientFrom = isWidgetDarkMode ? '#212121' : '#FFFFFF';
  const gradientTo = isWidgetDarkMode ? '#2C2C2C' : '#F2F4F6';

  const textColor = isWidgetDarkMode ? '#FFFFFF' : '#1A2C3E';
  const subTextColor = isWidgetDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#64748B';
  const dividerColor = isWidgetDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const refreshColor = isWidgetDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)';
  const borderColor = isWidgetDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';

  const limitedItems = items.slice(0, 4);
  const logoImage = require('../assets/images/logo.png');

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        backgroundColor,
        backgroundGradient: !isTransparent
          ? {
              from: gradientFrom,
              to: gradientTo,
              orientation: 'TL_BR'
            }
          : undefined,
        width: 'match_parent',
        height: 'match_parent',
        padding: 16,
        marginVertical: 10,
        marginHorizontal: 10,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor,
        flexDirection: 'column',
        justifyContent: 'flex-start'
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'flex-start', flexGap: 8 }}>
          <ImageWidget image={logoImage} imageWidth={30} imageHeight={15} />
          <TextWidget
            text={widgetTitle}
            style={{ fontSize: 14, fontWeight: '600', color: textColor, adjustsFontSizeToFit: true }}
            maxLines={1}
            truncate="END"
          />
        </FlexWidget>
        <TextWidget text="↻" style={{ fontSize: 28, color: refreshColor }} clickAction="REFRESH_WIDGET" />
      </FlexWidget>

      {limitedItems.length === 0 ? (
        <FlexWidget style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <TextWidget text="Sin datos" style={{ fontSize: 12, color: subTextColor }} />
        </FlexWidget>
      ) : (
        <FlexWidget style={{ flexDirection: 'column', width: 'match_parent', flex: 1, justifyContent: 'space-between' }}>
          {limitedItems.map((item, index) => (
            <FlexWidget
              key={item.id}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 8,
                borderBottomWidth: index < limitedItems.length - 1 ? 1 : 0,
                borderBottomColor: dividerColor,
                width: 'match_parent'
              }}
            >
              <FlexWidget style={{ flexDirection: 'column', flex: 1, paddingRight: 8 }}>
                <TextWidget
                  text={item.label}
                  style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 2, adjustsFontSizeToFit: true }}
                  maxLines={1}
                  truncate="END"
                />
                <TextWidget
                  text={item.value + ' ' + item.currency}
                  style={{ fontSize: 14, fontWeight: '700', color: textColor, adjustsFontSizeToFit: true }}
                  maxLines={1}
                  truncate="END"
                />
              </FlexWidget>
              <FlexWidget style={{ backgroundColor: item.trendBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, flexDirection: 'row', alignItems: 'center', flexGap: 2 }}>
                <TextWidget
                  text={
                    (item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '−') + 
                    (showGraph ? ' ' + item.trendValue : '')
                  }
                  style={{ fontSize: 11, fontWeight: '700', color: item.trendColor, adjustsFontSizeToFit: true }}
                  maxLines={1}
                  truncate="END"
                />
              </FlexWidget>
            </FlexWidget>
          ))}
        </FlexWidget>
      )}

      <FlexWidget style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', width: 'match_parent' }}>
        <TextWidget text={lastUpdated ? 'Actualizado: ' + lastUpdated : 'Actualizado: hace poco'} style={{ fontSize: 10, color: subTextColor }} />
      </FlexWidget>
    </FlexWidget>
  );
}

