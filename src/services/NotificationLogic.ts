import notifee, { AndroidImportance } from '@notifee/react-native';
import { storageService } from './StorageService';

// Configuración visual compartida para todas las notificaciones
const ANDROID_NOTIFICATION_DEFAULTS = {
    smallIcon: 'ic_notification', // Icono blanco transparente para barra de estado
    largeIcon: 'ic_launcher', // Muestra el logo a color a la derecha (estilo moderno)
    // color: '#0e4981', // REMOVIDO: Se deja que Android use el default del Manifiesto (@color/notification_color) para soportar Dark Mode
    pressAction: {
        id: 'default',
    },
};

/**
 * Procesa los mensajes en segundo plano (Data Messages)
 * Verifica si el precio recibido cumple alguna alerta configurada localmente.
 * También maneja notificaciones generales enviadas como Data Messages.
 */
export const handleBackgroundMessage = async (remoteMessage: any) => {
    if (!remoteMessage.data) return;

    const { symbol, price, title, body } = remoteMessage.data;

    // ---------------------------------------------------------
    // CASO 1: Alerta de Precio (Payload: { symbol, price })
    // ---------------------------------------------------------
    if (symbol && price) {
        const currentPrice = parseFloat(price);
        if (isNaN(currentPrice)) return;

        // Obtenemos las alertas guardadas
        const alerts = await storageService.getAlerts();

        // Filtramos alertas activas para este símbolo
        const activeAlerts = alerts.filter((a: any) =>
            a.isActive &&
            a.symbol === symbol
        );

        if (activeAlerts.length > 0) {
            await notifee.createChannel({
                id: 'price_alerts',
                name: 'Alertas de Precio',
                importance: AndroidImportance.HIGH,
                sound: 'default',
            });

            // Trigger widget update to show latest data
            const { requestWidgetUpdate } = require('react-native-android-widget');
            const { buildWidgetElement } = require('../widget/widgetTaskHandler');

            requestWidgetUpdate({
                widgetName: 'VTradingWidget',
                renderWidget: buildWidgetElement,
            });
        }

        for (const alert of activeAlerts) {
            const targetPrice = parseFloat(alert.target);
            let triggered = false;

            if (alert.condition === 'above' && currentPrice >= targetPrice) {
                triggered = true;
            } else if (alert.condition === 'below' && currentPrice <= targetPrice) {
                triggered = true;
            }

            if (triggered) {
                const isUp = alert.condition === 'above';
                const actionVerb = isUp ? 'subió' : 'bajó';
                const directionText = isUp ? 'Subida' : 'Bajada';

                const formatPrice = (val: number) => val < 0.01 ? val : val.toFixed(2);
                const currentPriceFormatted = formatPrice(currentPrice);
                const targetPriceFormatted = formatPrice(targetPrice);

                const notificationId = `price_${symbol}_${Date.now()}`;
                const finalTitle = `${directionText}: ${symbol} a ${currentPriceFormatted}`;
                const finalBody = `El precio ${actionVerb} de los ${targetPriceFormatted}`;

                await notifee.displayNotification({
                    id: notificationId,
                    title: finalTitle,
                    body: finalBody,
                    android: {
                        channelId: 'price_alerts',
                        ...ANDROID_NOTIFICATION_DEFAULTS,
                    },
                });

                // Persist notification for the UI
                try {
                    const stored = await storageService.getNotifications();
                    const newNotif = {
                        id: notificationId,
                        type: 'price_alert' as const,
                        title: finalTitle,
                        message: finalBody,
                        timestamp: new Date().toISOString(),
                        isRead: false,
                        trend: (isUp ? 'up' : 'down') as 'up' | 'down',
                        highlightedValue: currentPriceFormatted.toString(),
                        data: { symbol, price: currentPrice }
                    };
                    await storageService.saveNotifications([newNotif, ...stored]);
                } catch (e) {
                    // Fail silently
                }
            }
        }
        return; // Detener procesamiento aquí si era una alerta de precio
    }

    // ---------------------------------------------------------
    // CASO 2: Notificación General (Payload: { title, body })
    // ---------------------------------------------------------
    if (title && body) {
        await notifee.createChannel({
            id: 'general',
            name: 'General',
            importance: AndroidImportance.DEFAULT,
        });

        const notificationId = `gen_${Date.now()}`;

        await notifee.displayNotification({
            id: notificationId,
            title,
            body,
            android: {
                channelId: 'general',
                ...ANDROID_NOTIFICATION_DEFAULTS,
            },
        });

        // Persist notification for the UI
        try {
            const stored = await storageService.getNotifications();
            const newNotif = {
                id: notificationId,
                type: (remoteMessage.data?.type as any) || 'system',
                title,
                message: body,
                timestamp: new Date().toISOString(),
                isRead: false,
                data: remoteMessage.data
            };
            await storageService.saveNotifications([newNotif, ...stored]);
        } catch (e) {
            // Fail silently
        }
    }
};
