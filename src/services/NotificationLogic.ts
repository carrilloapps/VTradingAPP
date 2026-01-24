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
                const actionVerb = alert.condition === 'above' ? 'subió' : 'bajó';
                const emoji = alert.condition === 'above' ? '📈' : '📉';
                
                await notifee.displayNotification({
                    title: `Alerta: ${alert.symbol} ${emoji} a ${currentPrice}`,
                    body: `El precio ${actionVerb} de los ${targetPrice}`,
                    android: {
                        channelId: 'price_alerts',
                        ...ANDROID_NOTIFICATION_DEFAULTS,
                    },
                });
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

        await notifee.displayNotification({
            title,
            body,
            android: {
                channelId: 'general',
                ...ANDROID_NOTIFICATION_DEFAULTS,
            },
        });
    }
};
