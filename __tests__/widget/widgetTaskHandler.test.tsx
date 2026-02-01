import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

const mockVTradingWidget = jest.fn((..._args: any[]) => null);

jest.mock('../../src/widget/VTradingWidget', () => mockVTradingWidget);

const mockCaptureError = jest.fn();
const mockLog = jest.fn();
const mockWarn = jest.fn();
const mockError = jest.fn();

const mockGetWidgetConfig = jest.fn();
const mockGetWidgetRefreshMeta = jest.fn();
const mockSaveWidgetRefreshMeta = jest.fn();

const mockGetRates = jest.fn();

const mockLogEvent = jest.fn();
const mockSetUserProperty = jest.fn();
const mockLogError = jest.fn();

jest.mock('@/services/ObservabilityService', () => ({
  observabilityService: {
    captureError: (...args: unknown[]) => mockCaptureError(...args),
  },
}));

jest.mock('@/utils/safeLogger', () => ({
  __esModule: true,
  default: {
    log: (...args: unknown[]) => mockLog(...args),
    warn: (...args: unknown[]) => mockWarn(...args),
    error: (...args: unknown[]) => mockError(...args),
  },
}));

jest.mock('@/services/StorageService', () => ({
  storageService: {
    getWidgetConfig: () => mockGetWidgetConfig(),
    getWidgetRefreshMeta: () => mockGetWidgetRefreshMeta(),
    saveWidgetRefreshMeta: (meta: { lastRefreshAt: number }) => mockSaveWidgetRefreshMeta(meta),
  },
}));

jest.mock('@/services/CurrencyService', () => ({
  CurrencyService: {
    getRates: (fresh?: boolean) => mockGetRates(fresh),
  },
}));

jest.mock('@/utils/trendUtils', () => ({
  getTrend: (value: number) => (value > 0 ? 'up' : value < 0 ? 'down' : 'neutral'),
}));

jest.mock('@/services/firebase/AnalyticsService', () => ({
  ANALYTICS_EVENTS: {
    WIDGET_ADDED: 'widget_added',
    WIDGET_DELETED: 'widget_deleted',
    WIDGET_REFRESH: 'widget_refresh_manual',
  },
  analyticsService: {
    logEvent: (...args: unknown[]) => mockLogEvent(...args),
    setUserProperty: (...args: unknown[]) => mockSetUserProperty(...args),
    logError: (...args: unknown[]) => mockLogError(...args),
  },
}));

describe('widgetTaskHandler', () => {
  const renderWidget = jest.fn().mockResolvedValue(undefined);
  const baseProps: WidgetTaskHandlerProps = {
    widgetInfo: {
      widgetId: 'widget-1',
      widgetName: 'vtrading',
    } as unknown as WidgetTaskHandlerProps['widgetInfo'],
    widgetAction: 'WIDGET_UPDATE',
    clickAction: undefined,
    renderWidget,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWidgetConfig.mockResolvedValue({
      title: 'Widget',
      refreshInterval: '1',
      selectedCurrencyIds: ['usd_bcv'],
      isWallpaperDark: true,
      isTransparent: false,
      showGraph: true,
      isWidgetDarkMode: true,
    });
    mockGetWidgetRefreshMeta.mockResolvedValue({ lastRefreshAt: 0 });
    mockGetRates.mockResolvedValue([
      {
        id: 'usd_bcv',
        code: 'usd_bcv',
        name: 'USD BCV',
        value: 40,
        changePercent: 1.23,
        lastUpdated: 1710000000000,
      },
    ]);
  });

  const loadModule = () => {
    let module: typeof import('../../src/widget/widgetTaskHandler');
    jest.isolateModules(() => {
      module = require('../../src/widget/widgetTaskHandler');
    });
    return module!;
  };

  it('builds widget element with refreshed data and saves metadata', async () => {
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1710000001000);

    const { buildWidgetElement } = loadModule();
    const element = (await buildWidgetElement(baseProps.widgetInfo, false)) as React.ReactElement;
    const props = element.props as { items: Array<{ id: string }>; lastUpdated?: string };

    expect(element).toBeTruthy();
    expect(props.items).toHaveLength(1);
    expect(mockGetRates).toHaveBeenCalledWith(true);
    expect(mockSaveWidgetRefreshMeta).toHaveBeenCalledWith({ lastRefreshAt: 1710000001000 });

    dateSpy.mockRestore();
  });

  it('uses stored last refresh time for label', async () => {
    mockGetWidgetRefreshMeta.mockResolvedValue({ lastRefreshAt: 1710000000000 });

    const { buildWidgetElement } = loadModule();
    const element = (await buildWidgetElement(baseProps.widgetInfo, false)) as React.ReactElement;
    const props = element.props as { lastUpdated?: string };

    expect(props.lastUpdated).toBeTruthy();
  });

  it('falls back to rate lastUpdated when no refresh meta is available', async () => {
    mockGetWidgetRefreshMeta.mockResolvedValue({ lastRefreshAt: 0 });

    const { buildWidgetElement } = loadModule();
    const element = (await buildWidgetElement(baseProps.widgetInfo, false)) as React.ReactElement;
    const props = element.props as { lastUpdated?: string };

    expect(props.lastUpdated).toBeTruthy();
  });

  it('recovers from rate fetch errors and logs them', async () => {
    mockGetRates
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce([
        { id: 'usd_bcv', code: 'usd_bcv', name: 'USD', value: 40, changePercent: 0 },
      ]);

    const { buildWidgetElement } = loadModule();
    await buildWidgetElement(baseProps.widgetInfo, true);

    expect(mockCaptureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'widgetTaskHandler.fetchRates' }),
    );
    expect(mockGetRates).toHaveBeenCalledWith(false);
  });

  it('uses fallback format when locale formatting fails', async () => {
    const localeSpy = jest.spyOn(Number.prototype, 'toLocaleString').mockImplementation(() => {
      throw new Error('locale');
    });

    const { buildWidgetElement } = loadModule();
    const element = (await buildWidgetElement(baseProps.widgetInfo, false)) as React.ReactElement;
    const props = element.props as { items: Array<{ value: string }> };

    expect(props.items[0].value).toContain('.');
    expect(mockWarn).toHaveBeenCalled();
    expect(mockCaptureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'widgetTaskHandler.formatCurrency' }),
    );

    localeSpy.mockRestore();
  });

  it('uses default rates when selected IDs return no entries', async () => {
    mockGetWidgetConfig.mockResolvedValue({
      title: 'Widget',
      refreshInterval: '1',
      selectedCurrencyIds: ['base_only'],
      isWallpaperDark: true,
      isTransparent: false,
      showGraph: true,
      isWidgetDarkMode: true,
    });
    mockGetRates.mockResolvedValue([
      { id: 'base_only', code: 'base_only', name: 'Base', value: 1, changePercent: 0 },
      { id: 'usd_bcv', code: 'usd_bcv', name: 'USD', value: 40, changePercent: 0.2 },
    ]);

    const { buildWidgetElement } = loadModule();
    const element = (await buildWidgetElement(baseProps.widgetInfo, false)) as React.ReactElement;
    const props = element.props as { items: Array<{ id: string }> };

    expect(props.items).toHaveLength(1);
    expect(props.items[0].id).toBe('usd_bcv');
  });

  it('uses emergency data when no rates are available', async () => {
    mockGetRates.mockResolvedValue([]);

    const { buildWidgetElement } = loadModule();
    const element = (await buildWidgetElement(baseProps.widgetInfo, false)) as React.ReactElement;
    const props = element.props as { items: Array<{ id: string }> };

    expect(props.items).toHaveLength(2);
  });

  it('handles widget actions: added', async () => {
    const { widgetTaskHandler } = loadModule();
    await widgetTaskHandler({
      ...baseProps,
      widgetAction: 'WIDGET_ADDED',
    });

    expect(mockSaveWidgetRefreshMeta).toHaveBeenCalled();
    expect(mockLogEvent).toHaveBeenCalledWith('widget_added', { widgetId: 'widget-1' });
    expect(mockSetUserProperty).toHaveBeenCalledWith('has_widget', 'true');
  });

  it('handles widget actions: deleted', async () => {
    const { widgetTaskHandler } = loadModule();
    await widgetTaskHandler({
      ...baseProps,
      widgetAction: 'WIDGET_DELETED',
    });

    expect(mockSaveWidgetRefreshMeta).toHaveBeenCalledWith({ lastRefreshAt: 0 });
    expect(mockLogEvent).toHaveBeenCalledWith('widget_deleted', { widgetId: 'widget-1' });
    expect(mockSetUserProperty).toHaveBeenCalledWith('has_widget', 'false');
    expect(renderWidget).not.toHaveBeenCalled();
  });

  it('handles widget refresh click action', async () => {
    const module = loadModule();

    await module.widgetTaskHandler({
      ...baseProps,
      widgetAction: 'WIDGET_CLICK',
      clickAction: 'REFRESH_WIDGET',
    });

    expect(mockLogEvent).toHaveBeenCalledWith('widget_refresh_manual', { widgetId: 'widget-1' });
    expect(renderWidget).toHaveBeenCalled();
    expect(mockGetRates).toHaveBeenCalledWith(true);
  });

  it('renders widget for default action', async () => {
    const { widgetTaskHandler } = loadModule();
    await widgetTaskHandler(baseProps);

    expect(renderWidget).toHaveBeenCalled();
  });

  it('captures errors in widgetTaskHandler', async () => {
    const module = loadModule();
    const failingRender = jest.fn().mockRejectedValueOnce(new Error('boom'));

    await module.widgetTaskHandler({ ...baseProps, renderWidget: failingRender });

    expect(mockCaptureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'widgetTaskHandler.main' }),
    );
    expect(mockLogError).toHaveBeenCalledWith('widget', { action: 'WIDGET_UPDATE' });
  });
});
