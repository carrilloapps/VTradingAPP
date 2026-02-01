import { useToastStore } from '../../src/stores/toastStore';

let nowSpy: jest.SpyInstance<number, []>;
let randomSpy: jest.SpyInstance<number, []>;

describe('useToastStore', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useToastStore.setState({ toasts: [] });
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    nowSpy.mockRestore();
    randomSpy.mockRestore();
  });

  it('shows and auto-hides a toast when duration is positive', () => {
    useToastStore.getState().showToast('Hola', 'success', 1000);

    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0]).toMatchObject({
      message: 'Hola',
      type: 'success',
      position: 'bottom',
      duration: 1000,
    });

    jest.advanceTimersByTime(1000);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('respects options and keeps toast when duration is negative', () => {
    const action = { label: 'Ver', onPress: jest.fn() };

    useToastStore.getState().showToast('Aviso', {
      type: 'warning',
      position: 'top',
      duration: -1,
      title: 'Titulo',
      action,
    });

    const [toast] = useToastStore.getState().toasts;

    expect(toast).toMatchObject({
      message: 'Aviso',
      type: 'warning',
      position: 'top',
      duration: -1,
      title: 'Titulo',
      action,
    });

    useToastStore.getState().hideToast(toast.id);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
