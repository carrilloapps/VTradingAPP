import React from 'react';
import VTradingWidget from '../../src/widget/VTradingWidget';

jest.mock('react-native-android-widget', () => {
  const ReactLocal = require('react');
  return {
    FlexWidget: ({ children, ...props }: { children?: React.ReactNode }) =>
      ReactLocal.createElement('FlexWidget', props, children),
    TextWidget: ({ text, ...props }: { text?: string }) =>
      ReactLocal.createElement('TextWidget', { ...props, text }),
    ImageWidget: (props: Record<string, unknown>) => ReactLocal.createElement('ImageWidget', props),
  };
});

jest.mock('../../src/assets/images/logo.png', () => 1);
jest.mock('../../src/assets/images/logo-white.png', () => 2);

describe('VTradingWidget', () => {
  const baseProps = {
    widgetTitle: 'VTrading',
    isTransparent: false,
    isWidgetDarkMode: true,
    isWallpaperDark: true,
    showGraph: true,
  };

  const collectByType = (node: any, type: string, results: any[] = []) => {
    if (!node) return results;
    const nodeType = typeof node.type === 'string' ? node.type : node.type?.name;
    if (nodeType === type) {
      results.push(node);
    }
    const children = Array.isArray(node.props?.children)
      ? node.props.children
      : node.props?.children
        ? [node.props.children]
        : [];
    children.forEach((child: any) => collectByType(child, type, results));
    return results;
  };

  it('renders empty state when there are no items', () => {
    const element = VTradingWidget({ ...baseProps, items: [] });
    const textNodes = collectByType(element, 'TextWidget');
    const emptyText = textNodes.filter((node: any) => node.props.text === 'Sin datos');

    expect(emptyText).toHaveLength(1);
  });

  it('renders limited items and hides graph when disabled', () => {
    const items = Array.from({ length: 5 }).map((_, index) => ({
      id: `id-${index}`,
      label: `Label ${index}`,
      value: String(index),
      currency: 'Bs',
      trend: 'neutral' as const,
      trendValue: `${index}%`,
      trendColor: '#fff' as any,
      trendBg: '#000' as any,
    }));

    const element = VTradingWidget({
      ...baseProps,
      isWidgetDarkMode: false,
      showGraph: false,
      items,
    });

    const textNodes = collectByType(element, 'TextWidget');
    const labels = textNodes.filter((node: any) => String(node.props.text).startsWith('Label'));

    expect(labels).toHaveLength(4);
    expect(labels.some(node => node.props.text === 'Label 4')).toBe(false);

    const trendValues = textNodes.filter((node: any) => String(node.props.text).includes('%'));

    expect(trendValues).toHaveLength(0);

    const neutralIcon = textNodes.filter(
      (node: any) => node.props.text === String.fromCodePoint(0xf0534),
    );

    expect(neutralIcon).toHaveLength(4);
  });

  it('applies transparent background when enabled', () => {
    const element = VTradingWidget({
      ...baseProps,
      isTransparent: true,
      isWallpaperDark: false,
      items: [],
    });

    const rootContainer = collectByType(element, 'FlexWidget')[0];

    expect(rootContainer.props.style.backgroundColor).toBe('rgba(255, 255, 255, 0.85)');
  });
});
