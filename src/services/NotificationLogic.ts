import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { storageService } from './StorageService';

/**
 * Procesa los mensajes en segundo plano (Data Messages)
 * Verifica si el precio recibido cumple alguna alerta configurada localmente.
 */
export const handleBackgroundMessage = async (remoteMessage: any) => {
    console.log('Background Message Received:', remoteMessage);

    if (!remoteMessage.data) return;

    // Estructura esperada del payload: { symbol: 'USD/VES', price: '205.5' }
    // El backend debe enviar esto al topic 'ticker_usd_ves'
    const { symbol, price } = remoteMessage.data;

    if (!symbol || !price) return;

    const currentPrice = parseFloat(price);
    if (isNaN(currentPrice)) return;

    // Obtenemos las alertas guardadas (AsyncStorage funciona en background)
    const alerts = await storageService.getAlerts();

    // Filtramos alertas activas para este símbolo
    const activeAlerts = alerts.filter(a => 
        a.isActive && 
        a.symbol === symbol
    );

    // Si hay alertas activas, aseguramos que el canal de notificaciones exista
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
            // ¡Alerta Disparada!
            console.log(`[ALERTA TRIGGERED] ${alert.symbol} llegó a ${currentPrice} (Condición: ${alert.condition} ${targetPrice})`);
            
            // Mostrar Notificación Local
            await notifee.displayNotification({
                title: `🔔 Alerta: ${alert.symbol}`,
                body: `El precio alcanzó ${currentPrice} (Objetivo: ${targetPrice})`,
                android: {
                    channelId: 'price_alerts',
                    pressAction: {
                        id: 'default',
                    },
                },
            });
        }
    }
};
