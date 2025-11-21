import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StrategyConfig } from '../types';
import { DEFAULT_STRATEGY_CONFIG } from '../utils/constants';

interface SettingsState {
  strategyConfig: StrategyConfig;
  watchlist: string[];
  updateInterval: number; // milliseconds
  darkMode: boolean;

  // Actions
  updateStrategyConfig: (config: Partial<StrategyConfig>) => void;
  resetStrategyConfig: () => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  setUpdateInterval: (interval: number) => void;
  toggleDarkMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      strategyConfig: DEFAULT_STRATEGY_CONFIG,
      watchlist: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'],
      updateInterval: 60000, // 1 minute
      darkMode: false,

      updateStrategyConfig: (config) => {
        set(state => ({
          strategyConfig: {
            ...state.strategyConfig,
            ...config,
            qualityFilters: {
              ...state.strategyConfig.qualityFilters,
              ...config.qualityFilters,
            },
            allocation: {
              ...state.strategyConfig.allocation,
              ...config.allocation,
            },
          },
        }));
      },

      resetStrategyConfig: () => {
        set({ strategyConfig: DEFAULT_STRATEGY_CONFIG });
      },

      addToWatchlist: (symbol) => {
        const { watchlist } = get();
        if (!watchlist.includes(symbol)) {
          set({ watchlist: [...watchlist, symbol] });
        }
      },

      removeFromWatchlist: (symbol) => {
        const { watchlist } = get();
        set({ watchlist: watchlist.filter(s => s !== symbol) });
      },

      setUpdateInterval: (interval) => {
        set({ updateInterval: interval });
      },

      toggleDarkMode: () => {
        set(state => ({ darkMode: !state.darkMode }));
      },
    }),
    {
      name: 'settings-storage',
    }
  )
);
