import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { mmkvStorage } from './StorageService';
import { fcmService } from './firebase/FCMService';
import { authService } from './firebase/AuthService';

import SafeLogger from '../utils/safeLogger';

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
            SafeLogger.log(`[FeatureFlag] Denied by platform: Current=${Platform.OS} != Target=${conditions.platform}`);
            return false;
        }

        // 2. Build Number
        const currentBuild = parseInt(DeviceInfo.getBuildNumber(), 10);
        if (conditions.minBuild !== undefined) {
            if (currentBuild < conditions.minBuild) {
                SafeLogger.log(`[FeatureFlag] Denied by minBuild: Current=${currentBuild} < Min=${conditions.minBuild}`);
                return false;
            }
        }
        if (conditions.maxBuild !== undefined) {
            if (currentBuild > conditions.maxBuild) {
                SafeLogger.log(`[FeatureFlag] Denied by maxBuild: Current=${currentBuild} > Max=${conditions.maxBuild}`);
                return false;
            }
        }

        // 3. App Version
        if (conditions.minVersion) {
            const currentVersion = DeviceInfo.getVersion();
            if (!this.isVersionAtLeast(currentVersion, conditions.minVersion)) {
                SafeLogger.log(`[FeatureFlag] Denied by minVersion: Current=${currentVersion} < Min=${conditions.minVersion}`);
                return false;
            }
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
