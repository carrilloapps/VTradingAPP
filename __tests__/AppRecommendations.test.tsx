import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { Platform } from 'react-native';
import AppRecommendations from '../src/components/discover/AppRecommendations';
import { LightTheme } from '../src/theme/theme';

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

jest.mock('react-native-svg', () => {
  const MockReact = require('react');
  return {
    SvgUri: ({ uri }: { uri: string }) =>
      MockReact.createElement('svg-uri', { uri }),
  };
});

jest.mock('../src/services/firebase/RemoteConfigService', () => ({
  remoteConfigService: {
    getJson: jest.fn(),
    fetchAndActivate: jest.fn(),
  },
}));

jest.mock('../src/services/ObservabilityService', () => ({
  observabilityService: {
    captureError: jest.fn(),
  },
}));

const { remoteConfigService } =
  require('../src/services/firebase/RemoteConfigService') as {
    remoteConfigService: {
      getJson: jest.Mock;
      fetchAndActivate: jest.Mock;
    };
  };

const renderComponent = () =>
  render(
    <PaperProvider theme={LightTheme}>
      <AppRecommendations />
    </PaperProvider>,
  );

const setPlatform = (value: string) => {
  Object.defineProperty(Platform, 'OS', {
    value,
    configurable: true,
    writable: true,
  });
};

describe('AppRecommendations', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    setPlatform(originalPlatform);
  });

  afterAll(() => {
    setPlatform(originalPlatform);
  });

  it('shows skeleton and then renders remote config apps when available', async () => {
    remoteConfigService.getJson.mockReturnValue({
      apps: [
        {
          title: 'TradingView Remote',
          logo: 'https://example.com/logo.svg',
          os: ['all'],
          useTint: true,
        },
      ],
    });
    remoteConfigService.fetchAndActivate.mockResolvedValue(false);

    const { getByTestId, getByText, queryByTestId } = renderComponent();

    expect(getByTestId('app-recommendations-skeleton')).toBeTruthy();

    await waitFor(() => {
      expect(getByText('TradingView Remote')).toBeTruthy();
    });

    expect(queryByTestId('app-recommendations-skeleton')).toBeNull();
    expect(remoteConfigService.fetchAndActivate).not.toHaveBeenCalled();
  });

  it('renders nothing when remote config payload is empty', async () => {
    remoteConfigService.getJson.mockReturnValue(null);
    remoteConfigService.fetchAndActivate.mockResolvedValue(false);

    const { queryByTestId } = renderComponent();

    expect(queryByTestId('app-recommendations-skeleton')).toBeTruthy();

    await waitFor(() => {
      expect(queryByTestId('app-recommendations-skeleton')).toBeNull();
    });

    expect(queryByTestId('app-recommendations-container')).toBeNull();
    expect(remoteConfigService.fetchAndActivate).toHaveBeenCalledTimes(1);
  });

  it('filters recommendations by platform', async () => {
    setPlatform('android');

    remoteConfigService.getJson.mockReturnValue({
      apps: [
        {
          title: 'Android App',
          logo: 'https://example.com/android.svg',
          os: ['android'],
        },
        {
          title: 'iOS App',
          logo: 'https://example.com/ios.svg',
          os: ['ios'],
        },
      ],
    });
    remoteConfigService.fetchAndActivate.mockResolvedValue(false);

    const { findByText, queryByText, queryByTestId } = renderComponent();

    await waitFor(() => {
      expect(queryByTestId('app-recommendations-skeleton')).toBeNull();
    });

    expect(await findByText('Android App')).toBeTruthy();
    expect(queryByText('iOS App')).toBeNull();
  });
});
