import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Configuration
 * Provides optimized defaults for caching, stale time, and retry logic
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Stale time: data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,

            // Cache time: unused data is garbage collected after 30 minutes
            gcTime: 30 * 60 * 1000,

            // Retry failed requests 3 times with exponential backoff
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

            // Don't refetch on window focus in development
            refetchOnWindowFocus: !__DEV__,

            // Refetch on reconnect
            refetchOnReconnect: true,

            // Don't refetch on mount if data is still fresh
            refetchOnMount: false,
        },
        mutations: {
            // Retry mutations once
            retry: 1,
        },
    },
});
