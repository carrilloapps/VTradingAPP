import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useHomeScreenData } from '../../src/hooks/useHomeScreenData';

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useEffect: () => {},
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

describe('useHomeScreenData lastUpdated empty state', () => {
  it('returns "--:--" when there is no last refresh time or rates', () => {
    const LastUpdatedProbe = () => {
      const { lastUpdated } = useHomeScreenData();
      return <Text testID="last-updated">{lastUpdated}</Text>;
    };

    const { getByTestId } = render(<LastUpdatedProbe />);

    expect(getByTestId('last-updated').props.children).toBe('--:--');
  });
});
