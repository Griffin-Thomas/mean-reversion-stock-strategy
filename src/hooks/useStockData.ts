import { useEffect, useRef } from 'react';
import { useMarketStore } from '../stores/marketStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useSettingsStore } from '../stores/settingsStore';

export function useStockData() {
  const stocks = useMarketStore(state => state.stocks);
  const signals = useMarketStore(state => state.signals);
  const selectedSymbol = useMarketStore(state => state.selectedSymbol);
  const isLoading = useMarketStore(state => state.isLoading);
  const error = useMarketStore(state => state.error);
  const lastUpdated = useMarketStore(state => state.lastUpdated);
  const setSelectedSymbol = useMarketStore(state => state.setSelectedSymbol);
  const fetchStock = useMarketStore(state => state.fetchStock);
  const fetchAllStocks = useMarketStore(state => state.fetchAllStocks);
  const scanForSignals = useMarketStore(state => state.scanForSignals);
  const refreshData = useMarketStore(state => state.refreshData);

  const updatePrices = usePortfolioStore(state => state.updatePrices);
  const updateInterval = useSettingsStore(state => state.updateInterval);

  const initialFetchDone = useRef(false);

  // Initial data fetch
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchAllStocks();
    }
  }, [fetchAllStocks]);

  // Update portfolio prices when stocks update
  useEffect(() => {
    if (stocks.size > 0) {
      updatePrices(stocks);
      scanForSignals();
    }
  }, [stocks]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh at interval
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, refreshData]);

  return {
    stocks,
    signals,
    selectedSymbol,
    isLoading,
    error,
    lastUpdated,
    setSelectedSymbol,
    fetchStock,
    refreshData,
  };
}

export function useSelectedStock() {
  const { stocks, selectedSymbol } = useMarketStore();

  if (!selectedSymbol) return null;
  return stocks.get(selectedSymbol) || null;
}
