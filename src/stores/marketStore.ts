import { create } from 'zustand';
import { StockData, TradingSignal } from '../types';
import { fetchMultipleStocks, fetchStockData } from '../services/dataFetcher';
import { scanForOpportunities } from '../services/strategyEngine';
import { SP500_SYMBOLS } from '../utils/constants';

interface MarketState {
  stocks: Map<string, StockData>;
  signals: TradingSignal[];
  selectedSymbol: string | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
  setSelectedSymbol: (symbol: string | null) => void;
  fetchStock: (symbol: string) => Promise<void>;
  fetchAllStocks: () => Promise<void>;
  scanForSignals: () => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  stocks: new Map(),
  signals: [],
  selectedSymbol: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  setSelectedSymbol: (symbol) => {
    set({ selectedSymbol: symbol });
  },

  fetchStock: async (symbol) => {
    try {
      const stockData = await fetchStockData(symbol);
      set(state => {
        const newStocks = new Map(state.stocks);
        newStocks.set(symbol, stockData);
        return { stocks: newStocks, error: null };
      });
    } catch (error) {
      set({ error: `Failed to fetch ${symbol}: ${error}` });
    }
  },

  fetchAllStocks: async () => {
    set({ isLoading: true, error: null });

    try {
      // Fetch a subset for demo/live (limit to reduce upstream rate-limit issues)
      const baseList = SP500_SYMBOLS.slice(0, 25);
      const symbolsToFetch = Array.from(new Set([...baseList, 'AMD']));
      const stocks = await fetchMultipleStocks(symbolsToFetch);

      set({
        stocks,
        isLoading: false,
        lastUpdated: new Date(),
      });
    } catch (error) {
      set({
        isLoading: false,
        error: `Failed to fetch market data: ${error}`,
      });
    }
  },

  scanForSignals: async () => {
    const { stocks } = get();

    try {
      const signals = await scanForOpportunities(stocks);
      set({ signals });
    } catch (error) {
      set({ error: `Failed to scan for signals: ${error}` });
    }
  },

  refreshData: async () => {
    const { fetchAllStocks, scanForSignals } = get();
    await fetchAllStocks();
    await scanForSignals();
  },
}));
