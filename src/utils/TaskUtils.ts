import { InteractionManager } from 'react-native';

/**
 * Executes a task when the JavaScript thread is idle.
 * Prefers requestIdleCallback (New Architecture) and falls back to
 * InteractionManager.runAfterInteractions (Legacy Architecture).
 */
export const runAfterInteractions = (task: () => void): { cancel: () => void } => {
  // Use requestIdleCallback if available
  if (typeof (globalThis as any).requestIdleCallback !== 'undefined') {
    const handle = (globalThis as any).requestIdleCallback(task);
    return {
      cancel: () => {
        if (typeof (globalThis as any).cancelIdleCallback !== 'undefined') {
          (globalThis as any).cancelIdleCallback(handle);
        }
      },
    };
  }

  // Fallback to InteractionManager
  const promise = InteractionManager.runAfterInteractions(task);
  return {
    cancel: () => promise.cancel(),
  };
};
