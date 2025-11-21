import { useState, useCallback } from 'react';
import { BacktestResult, HistoricalDataPoint } from '../types';
import { runBacktest, runSingleSymbolBacktest } from '../services/backtester';
import { useSettingsStore } from '../stores/settingsStore';
import { fetchHistoricalData } from '../services/dataFetcher';
import { SP500_SYMBOLS } from '../utils/constants';

export function useBacktest() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { strategyConfig } = useSettingsStore();

  const runFullBacktest = useCallback(async (initialCapital: number = 100000) => {
    setIsRunning(true);
    setError(null);

    try {
      // Fetch historical data for a subset of symbols
      const symbols = SP500_SYMBOLS.slice(0, 10);
      const symbolsData = new Map<string, HistoricalDataPoint[]>();

      for (const symbol of symbols) {
        try {
          const historical = await fetchHistoricalData(symbol, 365);
          if (historical.length > 200) {
            symbolsData.set(symbol, historical);
          }
        } catch (err) {
          console.warn(`Failed to fetch historical data for ${symbol}:`, err);
        }
      }

      if (symbolsData.size === 0) {
        throw new Error('No historical data available for backtesting');
      }

      const result = await runBacktest(symbolsData, initialCapital, strategyConfig);
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backtest failed');
    } finally {
      setIsRunning(false);
    }
  }, [strategyConfig]);

  const runSymbolBacktest = useCallback(async (
    symbol: string,
    initialCapital: number = 10000
  ) => {
    setIsRunning(true);
    setError(null);

    try {
      const historical = await fetchHistoricalData(symbol, 365);

      if (historical.length < 200) {
        throw new Error('Insufficient historical data for backtesting');
      }

      const result = await runSingleSymbolBacktest(
        symbol,
        historical,
        initialCapital,
        strategyConfig
      );
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backtest failed');
    } finally {
      setIsRunning(false);
    }
  }, [strategyConfig]);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return {
    isRunning,
    results,
    error,
    runFullBacktest,
    runSymbolBacktest,
    clearResults,
  };
}
