import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import React from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'trendUp' | 'trendDown';

export interface ToastAction {
    label: string;
    onPress: () => void;
}

export interface ToastOptions {
    title?: string;
    position?: 'top' | 'bottom';
    type?: ToastType;
    duration?: number;
    action?: ToastAction;
}

interface Toast {
    id: string;
    message: string | React.ReactNode;
    type: ToastType;
    title?: string;
    position?: 'top' | 'bottom';
    duration?: number;
    action?: ToastAction;
}

interface ToastState {
    toasts: Toast[];
    showToast: (message: string | React.ReactNode, typeOrOptions: ToastType | ToastOptions, duration?: number) => void;
    hideToast: (id: string) => void;
}

export const useToastStore = create<ToastState>()(
    devtools(
        (set) => ({
            toasts: [],

            showToast: (message, typeOrOptions, duration = 3000) => {
                const id = `${Date.now()}-${Math.random()}`;

                let type: ToastType = 'info';
                let options: ToastOptions = {};

                if (typeof typeOrOptions === 'string') {
                    type = typeOrOptions as ToastType;
                } else {
                    options = typeOrOptions;
                    type = options.type || 'info';
                    duration = options.duration || duration;
                }

                const toast: Toast = {
                    id,
                    message,
                    type,
                    title: options.title,
                    position: options.position || 'bottom',
                    duration,
                    action: options.action
                };

                set((state) => ({
                    toasts: [...state.toasts, toast],
                }));

                // Auto-hide after duration
                if (duration > 0) {
                    setTimeout(() => {
                        set((state) => ({
                            toasts: state.toasts.filter((t) => t.id !== id),
                        }));
                    }, duration);
                }
            },

            hideToast: (id) => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            },
        }),
        { name: 'ToastStore' }
    )
);
