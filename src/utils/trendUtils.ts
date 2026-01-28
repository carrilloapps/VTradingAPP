import { MD3Theme } from 'react-native-paper';

export type StandardTrend = 'up' | 'down' | 'neutral';

/**
 * Determines the trend based on a numeric or string change value.
 * - > 0: 'up'
 * - < 0: 'down'
 * - 0: 'neutral'
 */
export const getTrend = (change: number | string | undefined | null): StandardTrend => {
    if (change === undefined || change === null) return 'neutral';

    let numVal = 0;
    if (typeof change === 'number') {
        numVal = change;
    } else {
        // Handle "0,00%" or "0.00%" string formats
        // Remove % and replace comma
        const cleaned = change.replace('%', '').replace(',', '.');
        numVal = parseFloat(cleaned);
    }

    if (isNaN(numVal)) return 'neutral';
    // Use a small epsilon for float comparison if needed, but usually 0 is 0
    if (numVal === 0) return 'neutral';
    return numVal > 0 ? 'up' : 'down';
};

/**
 * Returns the appropriate color for the trend.
 */
export const getTrendColor = (trend: StandardTrend, theme: MD3Theme): string => {
    switch (trend) {
        case 'up':
            return (theme.colors as any).success || '#6EE7B7'; // Green
        case 'down':
            return (theme.colors as any).error || '#F87171';   // Red
        case 'neutral':
        default:
            return theme.colors.onSurfaceVariant;               // Gray
    }
};

/**
 * Returns the appropriate icon name for the trend.
 */
export const getTrendIcon = (trend: StandardTrend): string => {
    switch (trend) {
        case 'up':
            return 'trending-up';
        case 'down':
            return 'trending-down';
        case 'neutral':
        default:
            return 'minus'; // Or 'trending-neutral' if available, usually 'minus' is clearer
    }
};
