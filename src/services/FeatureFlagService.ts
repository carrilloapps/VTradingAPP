import { Platform, NativeModules } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { mmkvStorage } from '@/services/StorageService';
import { fcmService } from '@/services/firebase/FCMService';
import { authService } from '@/services/firebase/AuthService';

import SafeLogger from '@/utils/safeLogger';

/**
 * @description FeatureFlagService
 *
 * @param featureName
 * @param config
 * @returns
 */

/**
 * @description FeatureCondition
 *
 * @param platform
 * @param minBuild
 * @param maxBuild
 * @param minVersion
 * @param userIds
 * @param fcmTokens
 * @param models
 * @param notificationsEnabled
 * @param rolloutPercentage
 * @returns
 */

/**
 * @description FeatureRule
 *
 * @param action
 * @param priority
 * @param conditions
 * @returns
 */

/**
 * @description FeatureDefinition
 *
 * @param name
 * @param enabled
 * @param rules
 * @returns
 */

/**
 * @description FeatureCondition
 *
 * @param platform
 * @param minBuild
 * @param maxBuild
 * @param minVersion
 * @param userIds
 * @param fcmTokens
 * @param models
 * @param notificationsEnabled
 * @param rolloutPercentage
 * @returns
 */

export interface FeatureCondition {
  platform?: 'android' | 'ios';
  minBuild?: number;
  maxBuild?: number;
  minVersion?: string;
  userIds?: string[];
  fcmTokens?: string[];
  models?: string[]; // e.g. "Pixel", "Samsung" (contains check)
  notificationsEnabled?: boolean;
  rolloutPercentage?: number; // 0-100

  // User-based filters
  emails?: string[]; // Filter by email address (case-insensitive)
  authProviders?: ('password' | 'google.com' | 'apple.com')[]; // Auth provider (password = email/password)
  planTypes?: ('free' | 'premium')[]; // User plan type

  // Location & Language
  countryCodes?: string[]; // ISO country codes (VE, US, CO, etc.)
  deviceLanguages?: string[]; // Device language codes (en, es, pt, etc.)

  // Engagement filters
  minDaysSinceInstall?: number; // Minimum days since first install
  maxDaysSinceInstall?: number; // Maximum days since first install
  isFirstTimeUser?: boolean; // Target first-time users (no previous sessions)

  // Registration date filters
  minRegistrationDate?: string; // Minimum registration date (ISO format: YYYY-MM-DD)
  maxRegistrationDate?: string; // Maximum registration date (ISO format: YYYY-MM-DD)
}

export interface FeatureRule {
  action: 'enable' | 'disable';
  priority?: number; // Higher number = higher priority
  conditions?: FeatureCondition;
}

export interface FeatureDefinition {
  name: string;
  enabled: boolean;
  rules?: FeatureRule[];
}

export interface RemoteConfigSchema {
  features: FeatureDefinition[];
}

class FeatureFlagService {
  private rolloutId: number | null = null;

  /**
   * Get device locale (language-country format: en-US, es-VE, etc.)
   */
  private getDeviceLocale(): string {
    try {
      if (Platform.OS === 'ios') {
        return (
          NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
          'en-US'
        );
      } else {
        return NativeModules.I18nManager?.localeIdentifier || 'en-US';
      }
    } catch (e) {
      SafeLogger.error('[FeatureFlag] Error getting device locale', e);
      return 'en-US';
    }
  }

  /**
   * Get a persistent random number (0-99) for this device for percentage rollouts
   */
  private getRolloutId(): number {
    if (this.rolloutId !== null) return this.rolloutId;

    const stored = mmkvStorage.getString('vtrading_rollout_id');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 99) {
        this.rolloutId = parsed;
      }
    }

    if (this.rolloutId === null) {
      // Generate persistent random ID between 0 and 99
      this.rolloutId = Math.floor(Math.random() * 100);
      mmkvStorage.set('vtrading_rollout_id', this.rolloutId.toString());
    }
    return this.rolloutId;
  }

  /**
   * Compare semantic versions manually to avoid external deps
   * Returns true if v1 >= v2
   */
  private isVersionAtLeast(v1: string, v2: string): boolean {
    if (!v1 || !v2) return false;

    const v1Parts = v1.split('.').map(p => parseInt(p, 10) || 0);
    const v2Parts = v2.split('.').map(p => parseInt(p, 10) || 0);

    const maxLength = Math.max(v1Parts.length, v2Parts.length);

    for (let i = 0; i < maxLength; i++) {
      const p1 = v1Parts[i] || 0;
      const p2 = v2Parts[i] || 0;

      if (p1 > p2) return true;
      if (p1 < p2) return false;
    }

    // Equal
    return true;
  }

  /**
   * Evaluate a single condition set against current context
   */
  private async evaluateConditions(conditions: FeatureCondition): Promise<boolean> {
    // 1. Platform
    if (conditions.platform && conditions.platform !== Platform.OS) {
      SafeLogger.log(
        `[FeatureFlag] Denied by platform: Current=${Platform.OS} != Target=${conditions.platform}`,
      );
      return false;
    }

    // 2. Build Number
    const currentBuild = parseInt(DeviceInfo.getBuildNumber(), 10);
    if (conditions.minBuild !== undefined) {
      if (currentBuild < conditions.minBuild) {
        SafeLogger.log(
          `[FeatureFlag] Denied by minBuild: Current=${currentBuild} < Min=${conditions.minBuild}`,
        );
        return false;
      }
    }
    if (conditions.maxBuild !== undefined) {
      if (currentBuild > conditions.maxBuild) {
        SafeLogger.log(
          `[FeatureFlag] Denied by maxBuild: Current=${currentBuild} > Max=${conditions.maxBuild}`,
        );
        return false;
      }
    }

    // 3. App Version
    if (conditions.minVersion) {
      const currentVersion = DeviceInfo.getVersion();
      if (!this.isVersionAtLeast(currentVersion, conditions.minVersion)) {
        SafeLogger.log(
          `[FeatureFlag] Denied by minVersion: Current=${currentVersion} < Min=${conditions.minVersion}`,
        );
        return false;
      }
    }

    // 4. Device Model
    if (conditions.models && conditions.models.length > 0) {
      const model = DeviceInfo.getModel();
      const brand = DeviceInfo.getBrand();
      const deviceName = `${brand} ${model}`; // e.g. "Google sdk_gphone64_x86_64"
      const matches = conditions.models.some(m =>
        deviceName.toLowerCase().includes(m.toLowerCase()),
      );
      if (!matches) return false;
    }

    // 5. User IDs
    if (conditions.userIds && conditions.userIds.length > 0) {
      const user = authService.getCurrentUser();
      if (!user || !conditions.userIds.includes(user.uid)) {
        return false;
      }
    }

    // 6. FCM Tokens (Targeting specific devices)
    if (conditions.fcmTokens && conditions.fcmTokens.length > 0) {
      const token = await fcmService.getFCMToken();
      if (!token || !conditions.fcmTokens.includes(token)) {
        return false;
      }
    }

    // 7. Notifications Enabled
    if (conditions.notificationsEnabled !== undefined) {
      const hasPermission = await fcmService.checkPermission();
      if (hasPermission !== conditions.notificationsEnabled) {
        return false;
      }
    }

    // 8. Rollout Percentage
    if (conditions.rolloutPercentage !== undefined) {
      const rolloutId = this.getRolloutId();
      // If rollout is 10%, we include IDs 0-9
      if (rolloutId >= conditions.rolloutPercentage) {
        return false;
      }
    }

    // 9. Email Filter
    if (conditions.emails && conditions.emails.length > 0) {
      const user = authService.getCurrentUser();
      if (!user?.email) {
        SafeLogger.log('[FeatureFlag] Denied: No email found');
        return false;
      }
      const normalizedUserEmail = user.email.toLowerCase();
      const matches = conditions.emails.some(email => email.toLowerCase() === normalizedUserEmail);
      if (!matches) {
        SafeLogger.log(`[FeatureFlag] Denied by email: ${user.email} not in whitelist`);
        return false;
      }
    }

    // 10. Auth Provider Filter
    if (conditions.authProviders && conditions.authProviders.length > 0) {
      const user = authService.getCurrentUser();
      if (!user) {
        SafeLogger.log('[FeatureFlag] Denied: No authenticated user');
        return false;
      }

      // Get provider from user's providerData
      const userProviders = user.providerData.map(p => p.providerId);
      const matches = conditions.authProviders.some(provider => userProviders.includes(provider));

      if (!matches) {
        SafeLogger.log(
          `[FeatureFlag] Denied by authProvider: User providers=[${userProviders.join(', ')}], Required=[${conditions.authProviders.join(', ')}]`,
        );
        return false;
      }
    }

    // 11. Plan Type Filter
    if (conditions.planTypes && conditions.planTypes.length > 0) {
      // Check user plan from storage (assuming a key 'user_plan_type')
      const userPlan = (mmkvStorage.getString('user_plan_type') || 'free') as 'free' | 'premium';
      if (!conditions.planTypes.includes(userPlan)) {
        SafeLogger.log(
          `[FeatureFlag] Denied by planType: User=${userPlan}, Required=[${conditions.planTypes.join(', ')}]`,
        );
        return false;
      }
    }

    // 12. Country Code Filter (from device locale)
    if (conditions.countryCodes && conditions.countryCodes.length > 0) {
      // Get country from device locale
      let countryCode = 'US'; // Default fallback
      try {
        const locales = this.getDeviceLocale();
        // Locale format is usually "en-US" or "es-VE"
        if (locales && locales.includes('-')) {
          countryCode = locales.split('-')[1].toUpperCase();
        } else if (locales && locales.includes('_')) {
          // Some devices use underscore: en_US
          countryCode = locales.split('_')[1].toUpperCase();
        }
      } catch (e) {
        SafeLogger.error('[FeatureFlag] Error getting country code', e);
      }

      const normalizedCodes = conditions.countryCodes.map(c => c.toUpperCase());
      if (!normalizedCodes.includes(countryCode)) {
        SafeLogger.log(
          `[FeatureFlag] Denied by countryCode: Device=${countryCode}, Required=[${conditions.countryCodes.join(', ')}]`,
        );
        return false;
      }
    }

    // 13. Device Language Filter
    if (conditions.deviceLanguages && conditions.deviceLanguages.length > 0) {
      // Get language code from device ("en", "es", "pt", etc.)
      let languageCode = 'en'; // Default fallback
      try {
        const locales = this.getDeviceLocale();
        if (locales) {
          // Extract language code (first part before '-' or '_')
          const separator = locales.includes('-') ? '-' : '_';
          languageCode = locales.split(separator)[0].toLowerCase();
        }
      } catch (e) {
        SafeLogger.error('[FeatureFlag] Error getting device language', e);
      }

      const normalizedLangs = conditions.deviceLanguages.map(l => l.toLowerCase());
      if (!normalizedLangs.includes(languageCode)) {
        SafeLogger.log(
          `[FeatureFlag] Denied by deviceLanguage: Device=${languageCode}, Required=[${conditions.deviceLanguages.join(', ')}]`,
        );
        return false;
      }
    }

    // 14. Days Since Install Filter
    if (
      conditions.minDaysSinceInstall !== undefined ||
      conditions.maxDaysSinceInstall !== undefined
    ) {
      const firstInstallTimeMs = await DeviceInfo.getFirstInstallTime();
      const daysSinceInstall = Math.floor(
        (Date.now() - firstInstallTimeMs) / (1000 * 60 * 60 * 24),
      );

      if (conditions.minDaysSinceInstall !== undefined) {
        if (daysSinceInstall < conditions.minDaysSinceInstall) {
          SafeLogger.log(
            `[FeatureFlag] Denied by minDaysSinceInstall: Current=${daysSinceInstall}, Min=${conditions.minDaysSinceInstall}`,
          );
          return false;
        }
      }

      if (conditions.maxDaysSinceInstall !== undefined) {
        if (daysSinceInstall > conditions.maxDaysSinceInstall) {
          SafeLogger.log(
            `[FeatureFlag] Denied by maxDaysSinceInstall: Current=${daysSinceInstall}, Max=${conditions.maxDaysSinceInstall}`,
          );
          return false;
        }
      }
    }

    // 15. First Time User Filter
    if (conditions.isFirstTimeUser !== undefined) {
      // Check if user has completed onboarding or has session count
      const hasCompletedOnboarding = mmkvStorage.getBoolean('has_completed_onboarding') || false;
      const sessionCount = parseInt(mmkvStorage.getString('session_count') || '0', 10);

      const isFirstTime = !hasCompletedOnboarding && sessionCount <= 1;

      if (conditions.isFirstTimeUser !== isFirstTime) {
        SafeLogger.log(
          `[FeatureFlag] Denied by isFirstTimeUser: User=${isFirstTime}, Required=${conditions.isFirstTimeUser}`,
        );
        return false;
      }
    }

    // 16. Registration Date Filter
    if (conditions.minRegistrationDate || conditions.maxRegistrationDate) {
      const user = authService.getCurrentUser();
      if (!user || !user.metadata?.creationTime) {
        SafeLogger.log('[FeatureFlag] Denied by registrationDate: No user or creation time');
        return false;
      }

      // Parse user registration date (Firebase returns ISO string)
      const userRegistrationDate = new Date(user.metadata.creationTime);
      // Get timestamp at start of day in UTC
      const userDateTimestamp = Date.UTC(
        userRegistrationDate.getUTCFullYear(),
        userRegistrationDate.getUTCMonth(),
        userRegistrationDate.getUTCDate(),
      );

      if (conditions.minRegistrationDate) {
        const minDateParts = conditions.minRegistrationDate.split('-').map(Number);
        const minDateTimestamp = Date.UTC(minDateParts[0], minDateParts[1] - 1, minDateParts[2]);

        if (userDateTimestamp < minDateTimestamp) {
          SafeLogger.log(
            `[FeatureFlag] Denied by minRegistrationDate: User=${new Date(userDateTimestamp).toISOString().split('T')[0]}, Min=${conditions.minRegistrationDate}`,
          );
          return false;
        }
      }

      if (conditions.maxRegistrationDate) {
        const maxDateParts = conditions.maxRegistrationDate.split('-').map(Number);
        const maxDateTimestamp = Date.UTC(maxDateParts[0], maxDateParts[1] - 1, maxDateParts[2]);

        if (userDateTimestamp > maxDateTimestamp) {
          SafeLogger.log(
            `[FeatureFlag] Denied by maxRegistrationDate: User=${new Date(userDateTimestamp).toISOString().split('T')[0]}, Max=${conditions.maxRegistrationDate}`,
          );
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Evaluate a feature against the config and local context
   */
  async evaluate(
    featureName: string,
    config: RemoteConfigSchema | null,
    defaultValue = false,
  ): Promise<boolean> {
    if (!config || !config.features) return defaultValue;

    const feature = config.features.find(f => f.name === featureName);
    if (!feature) {
      // Feature not defined in config, use default
      return defaultValue;
    }

    // 1. Master Kill Switch
    // "enabled" acts as a definitive switch. If false, feature is dead.
    if (!feature.enabled) {
      SafeLogger.log(`[FeatureFlag] ${featureName} disabled globally (Master Switch)`);
      return false;
    }

    // 2. Rules Evaluation (Whitelist Mode)
    // If enabled is true AND rules exist, we default to FALSE (Implicit Deny),
    // and only return TRUE if a matching rule explicitly enables it.
    if (feature.rules && feature.rules.length > 0) {
      // Sort rules by priority (descending)
      const rules = [...feature.rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

      for (const rule of rules) {
        if (rule.conditions) {
          const match = await this.evaluateConditions(rule.conditions);
          if (match) {
            SafeLogger.log(`[FeatureFlag] Rule Match for ${featureName}: Action=${rule.action}`);
            return rule.action === 'enable';
          }
        } else {
          // Rule without conditions applies immediately (Catch-all)
          SafeLogger.log(`[FeatureFlag] Rule Force for ${featureName}: Action=${rule.action}`);
          return rule.action === 'enable';
        }
      }

      // If rules exist but none matched -> Disable (Implicit Deny / Whitelist Mode)
      SafeLogger.log(`[FeatureFlag] ${featureName} has rules but none matched -> Denying`);
      return false;
    }

    // 3. Global Enable (No rules)
    // If enabled is true and no rules are defined, it's enabled for everyone.
    return true;
  }
}

export const featureFlagService = new FeatureFlagService();
