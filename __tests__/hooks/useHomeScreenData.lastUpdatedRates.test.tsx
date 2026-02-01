import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useHomeScreenData } from '../../src/hooks/useHomeScreenData';

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  const lastUpdated = '2024-01-01T05:30:00Z';
  const initialRate = {
    id: 'x1',
    code: 'USD',
    name: 'US Dollar',
    value: 1,
    changePercent: 0,
    type: 'fiat',
    lastUpdated,
  };

  const isDataState = (
    value: unknown,
  ): value is {
    rates: unknown[];
    featuredRates: unknown[];
    lastRefreshTime: unknown;
  } => {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return 'rates' in record && 'featuredRates' in record && 'lastRefreshTime' in record;
  };

  return {
    ...actual,
    useEffect: () => {},
    useState: (initial: unknown) => {
      if (isDataState(initial)) {
        return actual.useState({
          ...(initial as object),
          rates: [initialRate],
          lastRefreshTime: null,
        });
      }
      return actual.useState(initial);
    },
  };
});

jest.mock('@/services/CurrencyService', () => ({
  CurrencyService: {
    subscribe: jest.fn(),
    getRates: jest.fn(),
  },
}));

jest.mock('@/services/StocksService', () => ({
  StocksService: {
    subscribe: jest.fn(),
    getStocks: jest.fn(),
    isMarketOpen: jest.fn(),
  },
}));

jest.mock('@/stores/toastStore', () => ({
  useToastStore: (selector: (state: { showToast: jest.Mock }) => unknown) =>
    selector({ showToast: jest.fn() }),
}));

jest.mock('@/services/ObservabilityService', () => ({
  observabilityService: {
    captureError: jest.fn(),
  },
}));

jest.mock('@/services/firebase/AnalyticsService', () => ({
  analyticsService: {
    logDataRefresh: jest.fn(() => Promise.resolve()),
  },
}));

describe('useHomeScreenData lastUpdated fallback', () => {
  it('uses rates lastUpdated when last refresh time is missing', () => {
    const lastUpdated = '2024-01-01T05:30:00Z';
    const LastUpdatedProbe = () => {
      const { lastUpdated: value } = useHomeScreenData();
      return <Text testID="last-updated">{value}</Text>;
    };

    const { getByTestId } = render(<LastUpdatedProbe />);

    const expected = new Date(lastUpdated).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    expect(getByTestId('last-updated').props.children).toBe(expected);
  });
});
