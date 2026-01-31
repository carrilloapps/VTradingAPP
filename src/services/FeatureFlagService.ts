import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { mmkvStorage } from './StorageService';
import { fcmService } from './firebase/FCMService';
import { authService } from './firebase/AuthService';
import compare from 'semver-compare';

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
     * Compare semantic versions
     * Returns true if v1 >= v2
     */
    private isVersionAtLeast(v1: string, v2: string): boolean {
        // semver-compare returns:
        //  0 if v1 == v2
        //  1 if v1 > v2
        // -1 if v1 < v2
        return compare(v1, v2) >= 0;
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
            const rolloutId = this.getRolloutId();
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
    async evaluate(featureName: string, config: RemoteConfigSchema | null, defaultValue = false): Promise<boolean> {
        if (!config || !config.features) return defaultValue;

        const feature = config.features.find(f => f.name === featureName);
        if (!feature) {
            // Feature not defined in config, use default
            return defaultValue;
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
