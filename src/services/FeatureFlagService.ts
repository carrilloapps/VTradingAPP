import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fcmService } from './firebase/FCMService';
import { authService } from './firebase/AuthService';

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
     * Get a persistent random number (0-99) for this device for percentage rollouts
     */
    private async getRolloutId(): Promise<number> {
        if (this.rolloutId !== null) return this.rolloutId;

        const stored = await AsyncStorage.getItem('vtrading_rollout_id');
        if (stored) {
            this.rolloutId = parseInt(stored, 10);
        } else {
            // Generate persistent random ID between 0 and 99
            this.rolloutId = Math.floor(Math.random() * 100);
            await AsyncStorage.setItem('vtrading_rollout_id', this.rolloutId.toString());
        }
        return this.rolloutId;
    }

    /**
     * Compare semantic versions (simple implementation)
     * Returns true if v1 >= v2
     */
    private isVersionAtLeast(v1: string, v2: string): boolean {
        const v1Parts = v1.split('.').map(Number);
        const v2Parts = v2.split('.').map(Number);

        for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
            const p1 = v1Parts[i] || 0;
            const p2 = v2Parts[i] || 0;
            if (p1 > p2) return true;
            if (p1 < p2) return false;
        }
        return true; // Equal
    }

    /**
     * Evaluate a single condition set against current context
     */
    private async evaluateConditions(conditions: FeatureCondition): Promise<boolean> {
        // 1. Platform
        if (conditions.platform && conditions.platform !== Platform.OS) {
            return false;
        }

        // 2. Build Number
        const currentBuild = parseInt(DeviceInfo.getBuildNumber(), 10);
        if (conditions.minBuild !== undefined && currentBuild < conditions.minBuild) {
            return false;
        }
        if (conditions.maxBuild !== undefined && currentBuild > conditions.maxBuild) {
            return false;
        }

        // 3. App Version
        if (conditions.minVersion && !this.isVersionAtLeast(DeviceInfo.getVersion(), conditions.minVersion)) {
            return false;
        }

        // 4. Device Model
        if (conditions.models && conditions.models.length > 0) {
            const model = DeviceInfo.getModel();
            const brand = DeviceInfo.getBrand();
            const deviceName = `${brand} ${model}`; // e.g. "Google sdk_gphone64_x86_64"
            const matches = conditions.models.some(m =>
                deviceName.toLowerCase().includes(m.toLowerCase())
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
            const rolloutId = await this.getRolloutId();
            // If rollout is 10%, we include IDs 0-9
            if (rolloutId >= conditions.rolloutPercentage) {
                return false;
            }
        }

        return true;
    }

    /**
     * Evaluate a feature against the config and local context
     */
    async evaluate(featureName: string, config: RemoteConfigSchema | null): Promise<boolean> {
        if (!config || !config.features) return false;

        const feature = config.features.find(f => f.name === featureName);
        if (!feature) {
            // Feature not defined in config, default to false (safe) or maybe true if we want?
            // Given we are controlling access, safe default is usually false.
            return false;
        }

        let isEnabled = feature.enabled;

        if (feature.rules && feature.rules.length > 0) {
            // Sort rules by priority (descending)
            const rules = [...feature.rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

            for (const rule of rules) {
                if (rule.conditions) {
                    const match = await this.evaluateConditions(rule.conditions);
                    if (match) {
                        isEnabled = rule.action === 'enable';
                        break; // First match wins strategy
                    }
                } else {
                    // Rule without conditions applies immediately
                    isEnabled = rule.action === 'enable';
                    break;
                }
            }
        }

        return isEnabled;
    }
}

export const featureFlagService = new FeatureFlagService();
