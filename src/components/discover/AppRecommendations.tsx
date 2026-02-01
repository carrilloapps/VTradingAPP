import React, { useEffect, useMemo, useState } from 'react';
import { DimensionValue, Platform, StyleSheet, View } from 'react-native';

import AppCard, { RecommendedApp } from '@/components/discover/AppCard';
import AppRecommendationsSkeleton from '@/components/discover/AppRecommendationsSkeleton';
import { remoteConfigService } from '@/services/firebase/RemoteConfigService';
import { observabilityService } from '@/services/ObservabilityService';
import { analyticsService } from '@/services/firebase/AnalyticsService';

interface AppRecommendationsProps {
  apps?: RecommendedApp[];
  columns?: number;
}

type SupportedPlatform = 'android' | 'ios' | 'web' | 'all';

interface RemoteConfigRecommendation {
  id?: string;
  title?: string;
  description?: string;
  logo?: string;
  icon?: string;
  color?: string;
  url?: string;
  androidUrl?: string;
  iosUrl?: string;
  webUrl?: string;
  os?: SupportedPlatform[];
  useTint?: boolean;
}

interface AppRecommendationsRemoteConfig {
  apps?: RemoteConfigRecommendation[];
}

const DEFAULT_COLUMNS = 4;

const slugify = (value: string, fallback: string): string => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || fallback;
};

const isPlatformSupported = (platforms?: SupportedPlatform[]): boolean => {
  if (!platforms || platforms.length === 0) {
    return true;
  }

  const current = Platform.OS as SupportedPlatform;
  const normalized = platforms.map(platform => platform.toLowerCase() as SupportedPlatform);
  return normalized.includes('all') || normalized.includes(current);
};

const resolveUrl = (recommendation: RemoteConfigRecommendation): string | undefined => {
  const urls = [
    recommendation.androidUrl,
    recommendation.iosUrl,
    recommendation.webUrl,
    recommendation.url,
  ];

  const platformUrl = Platform.select<string | undefined>({
    android: recommendation.androidUrl || recommendation.url,
    ios: recommendation.iosUrl || recommendation.url,
    default: recommendation.webUrl || recommendation.url,
  });

  const resolved = platformUrl || urls.find(candidate => !!candidate);
  return resolved?.trim() || undefined;
};

const mapRemoteRecommendation = (
  recommendation: RemoteConfigRecommendation,
  index: number,
): RecommendedApp | null => {
  if (!recommendation?.title) {
    return null;
  }

  if (!isPlatformSupported(recommendation.os)) {
    return null;
  }

  const idBase = recommendation.id || recommendation.title;
  const generatedId = slugify(idBase, `recommended-app-${index}`);

  return {
    id: generatedId,
    name: recommendation.title.trim(),
    description: recommendation.description?.trim(),
    icon: recommendation.icon?.trim() || undefined,
    color: recommendation.color?.trim() || undefined,
    url: resolveUrl(recommendation),
    logoUri: recommendation.logo?.trim() || undefined,
    useTint: recommendation.useTint ?? false,
  };
};

const normalizeRemoteConfig = (
  config: AppRecommendationsRemoteConfig | null | undefined,
): RecommendedApp[] => {
  if (!config || !Array.isArray(config.apps)) {
    return [];
  }

  return config.apps
    .map((recommendation, index) => mapRemoteRecommendation(recommendation, index))
    .filter((recommendation): recommendation is RecommendedApp => recommendation !== null);
};

const AppRecommendations: React.FC<AppRecommendationsProps> = ({
  apps: providedApps,
  columns = DEFAULT_COLUMNS,
}) => {
  const [recommendations, setRecommendations] = useState<RecommendedApp[]>(providedApps ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(!providedApps);

  useEffect(() => {
    let isMounted = true;

    if (providedApps) {
      setRecommendations(providedApps);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      setRecommendations([]);

      const loadRecommendations = async () => {
        try {
          const initialConfig =
            remoteConfigService.getJson<AppRecommendationsRemoteConfig>('app_recommendations');
          let normalized = normalizeRemoteConfig(initialConfig);

          if (normalized.length === 0) {
            const fetched = await remoteConfigService.fetchAndActivate();
            if (fetched) {
              const refreshedConfig =
                remoteConfigService.getJson<AppRecommendationsRemoteConfig>('app_recommendations');
              normalized = normalizeRemoteConfig(refreshedConfig);
            }
          }

          await Promise.resolve();

          if (isMounted) {
            setRecommendations(normalized);
            setIsLoading(false);
          }
        } catch (e) {
          observabilityService.captureError(e, {
            context: 'AppRecommendations.loadRecommendations',
            action: 'load_app_recommendations',
            providedApps: !!providedApps,
          });
          await analyticsService.logError('load_app_recommendations');

          await Promise.resolve();

          if (isMounted) {
            setRecommendations([]);
            setIsLoading(false);
          }
        }
      };

      loadRecommendations();
    }

    return () => {
      isMounted = false;
    };
  }, [providedApps]);

  const effectiveColumns = useMemo(() => Math.max(1, Math.floor(columns)), [columns]);

  // We avoid returning a plain object to prevent inland-style linting
  const columnWidth = useMemo<DimensionValue>(
    () => `${100 / effectiveColumns}%` as DimensionValue,
    [effectiveColumns],
  );

  if (isLoading) {
    return <AppRecommendationsSkeleton columns={columns} />;
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID="app-recommendations-container">
      {recommendations.map(app => (
        <View key={app.id} style={[styles.cardWrapper, { width: columnWidth }]}>
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
    gap: 8,
    paddingHorizontal: 12,
  },
  cardWrapper: {
    paddingHorizontal: 4,
    marginBottom: 12,
  },
});

export default React.memo(AppRecommendations);
