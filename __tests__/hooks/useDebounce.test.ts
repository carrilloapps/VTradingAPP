import { renderHook, act } from '@testing-library/react-native';
import { useDebounce } from '../../src/hooks/useDebounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));
    expect(result.current).toBe('test');
  });

  it('should debounce the value after the specified delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } },
    );

    expect(result.current).toBe('initial');

    // Update the value
    rerender({ value: 'updated', delay: 500 });

    // Value should still be 'initial' before the delay
    expect(result.current).toBe('initial');

    // Fast-forward time by 500ms
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now the value should be updated
    expect(result.current).toBe('updated');
  });

  it('should reset the timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 500),
      { initialProps: { value: 'first' } },
    );

    expect(result.current).toBe('first');

    // Rapidly change values
    rerender({ value: 'second' });
    act(() => jest.advanceTimersByTime(200));

    rerender({ value: 'third' });
    act(() => jest.advanceTimersByTime(200));

    rerender({ value: 'fourth' });

    // Value should still be 'first'
    expect(result.current).toBe('first');

    // Now advance by full 500ms
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should have the latest value
    expect(result.current).toBe('fourth');
  });

  it('should handle different delay times', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      { initialProps: { value: 'test', delay: 1000 } },
    );

    rerender({ value: 'new', delay: 1000 });

    // Should not update after 500ms
    act(() => jest.advanceTimersByTime(500));
    expect(result.current).toBe('test');

    // Should update after 1000ms total
    act(() => jest.advanceTimersByTime(500));
    expect(result.current).toBe('new');
  });

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout');

    const { unmount } = renderHook(() => useDebounce('test', 500));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
