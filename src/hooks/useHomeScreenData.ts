import { useState, useEffect, useCallback } from 'react';
import { CurrencyService, CurrencyRate } from '../services/CurrencyService';
import { StocksService, StockData } from '../services/StocksService';
import { useToastStore } from '../stores/toastStore';
import { observabilityService } from '../services/ObservabilityService';
import { analyticsService } from '../services/firebase/AnalyticsService';
import { AppConfig } from '../constants/AppConfig';
import { ExchangeCardProps } from '../components/dashboard/ExchangeCard';

export const useHomeScreenData = () => {
    const showToast = useToastStore((state) => state.showToast);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [rates, setRates] = useState<CurrencyRate[]>([]);
    const [spread, setSpread] = useState<number | null>(null);
    const [stocks, setStocks] = useState<StockData[]>([]);
    const [featuredRates, setFeaturedRates] = useState<ExchangeCardProps[]>([]);
    const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
    const [isMarketOpen, setIsMarketOpen] = useState(false);

    const calculateSpread = useCallback((data: CurrencyRate[]) => {
        const usdRates = data.filter(r => (r.code === 'USD' || r.code === 'USDT') && r.value > 0);
        let spreadVal: number | null = null;

        if (usdRates.length >= 2) {
            const values = usdRates.map(r => r.value);
            const min = Math.min(...values);
            const max = Math.max(...values);
            if (min > 0) {
                spreadVal = ((max - min) / min) * 100;
            }
        }
        setSpread(spreadVal);
    }, []);

    const processFeaturedRates = useCallback((data: CurrencyRate[]) => {
        const homeRates = data.filter(r => r.code === 'USD' || r.code === 'USDT');

        return homeRates.map(rate => {
            let displayValue = '0,00';
            if (rate.value && !isNaN(Number(rate.value))) {
                displayValue = Number(rate.value).toLocaleString(AppConfig.DEFAULT_LOCALE, {
                    minimumFractionDigits: AppConfig.DECIMAL_PLACES,
                    maximumFractionDigits: AppConfig.DECIMAL_PLACES
                });
            }

            const getPath = (percent: number | null | undefined) => {
                if (percent === null || percent === undefined || Math.abs(percent) < 0.001) return 'M0 20 L 100 20';
                const center = 20;
                const amplitude = 3 + (15 * Math.min(Math.abs(percent) * 200, 1.0));
                return percent > 0
                    ? `M0 ${center + amplitude} C 40 ${center + amplitude}, 60 ${center - amplitude}, 100 ${center - amplitude}`
                    : `M0 ${center - amplitude} C 40 ${center - amplitude}, 60 ${center + amplitude}, 100 ${center + amplitude}`;
            };

            return {
                title: rate.name,
                code: rate.code,
                value: displayValue,
                currency: 'Bs',
                changePercent: rate.changePercent !== null ? `${rate.changePercent.toFixed(2)}%` : '0.00%',
                isPositive: rate.changePercent !== null ? rate.changePercent >= 0 : true,
                chartPath: getPath(rate.changePercent),
                buyValue: rate.buyValue ? Number(rate.buyValue).toLocaleString(AppConfig.DEFAULT_LOCALE, { minimumFractionDigits: 2 }) : undefined,
                sellValue: rate.sellValue ? Number(rate.sellValue).toLocaleString(AppConfig.DEFAULT_LOCALE, { minimumFractionDigits: 2 }) : undefined,
            } as ExchangeCardProps;
        });
    }, []);

    const loadData = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const [ratesData, stocksData] = await Promise.all([
                CurrencyService.getRates(isManualRefresh),
                StocksService.getStocks(isManualRefresh)
            ]);

            setRates(ratesData);
            setFeaturedRates(processFeaturedRates(ratesData));
            setStocks(stocksData.slice(0, 3));
            setIsMarketOpen(StocksService.isMarketOpen());
            calculateSpread(ratesData);
            setLastRefreshTime(new Date());

            if (isManualRefresh) {
                showToast('Datos actualizados', 'success');
                await analyticsService.logDataRefresh('dashboard', true);
            }
        } catch (e) {
            observabilityService.captureError(e, {
                context: 'useHomeScreenData.loadData',
                isManualRefresh
            });
            showToast('Error al actualizar datos', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [calculateSpread, showToast, processFeaturedRates]);

    useEffect(() => {
        const unsubscribeRates = CurrencyService.subscribe((data) => {
            setRates(data);
            setFeaturedRates(processFeaturedRates(data));
            calculateSpread(data);
            setLoading(false);
            setLastRefreshTime(new Date());
        });

        const unsubscribeStocks = StocksService.subscribe((data) => {
            setStocks(data.slice(0, 3));
            setIsMarketOpen(StocksService.isMarketOpen());
        });

        loadData();

        return () => {
            unsubscribeRates();
            unsubscribeStocks();
        };
    }, [calculateSpread, loadData, processFeaturedRates]);

    return {
        loading,
        refreshing,
        rates,
        featuredRates,
        spread,
        stocks,
        isMarketOpen,
        lastUpdated: lastRefreshTime ? lastRefreshTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
            (rates.length > 0 ? new Date(rates[0].lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'),
        onRefresh: () => loadData(true),
    };
};
