import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Portfolio, Trade, StockData } from '../types';
import {
  createPortfolio,
  addPosition,
  closePosition,
  updatePortfolio,
  calculatePortfolioStats
} from '../services/portfolioManager';

interface PortfolioState {
  portfolio: Portfolio;
  trades: Trade[];

  // Actions
  initializePortfolio: (initialCash: number) => void;
  buyStock: (symbol: string, price: number, shares: number) => void;
  sellPosition: (positionId: string, sellPrice: number) => void;
  updatePrices: (stocksData: Map<string, StockData>) => void;
  resetPortfolio: () => void;
  getStats: () => ReturnType<typeof calculatePortfolioStats>;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      portfolio: createPortfolio(100000),
      trades: [],

      initializePortfolio: (initialCash) => {
        set({
          portfolio: createPortfolio(initialCash),
          trades: [],
        });
      },

      buyStock: (symbol, price, shares) => {
        const { portfolio, trades } = get();

        try {
          const result = addPosition(portfolio, symbol, price, shares);
          set({
            portfolio: result.portfolio,
            trades: [...trades, result.trade],
          });
        } catch (error) {
          console.error('Failed to buy stock:', error);
        }
      },

      sellPosition: (positionId, sellPrice) => {
        const { portfolio, trades } = get();

        try {
          const result = closePosition(portfolio, positionId, sellPrice);
          set({
            portfolio: result.portfolio,
            trades: [...trades, result.trade],
          });
        } catch (error) {
          console.error('Failed to sell position:', error);
        }
      },

      updatePrices: (stocksData) => {
        const { portfolio } = get();
        const updatedPortfolio = updatePortfolio(portfolio, stocksData);
        set({ portfolio: updatedPortfolio });
      },

      resetPortfolio: () => {
        const { portfolio } = get();
        set({
          portfolio: createPortfolio(portfolio.initialCapital),
          trades: [],
        });
      },

      getStats: () => {
        const { portfolio } = get();
        return calculatePortfolioStats(portfolio);
      },
    }),
    {
      name: 'portfolio-storage',
      partialize: (state) => ({
        portfolio: state.portfolio,
        trades: state.trades,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          // Rehydrate dates in portfolio positions
          if (parsed.state?.portfolio?.positions) {
            parsed.state.portfolio.positions = parsed.state.portfolio.positions.map((p: Record<string, unknown>) => ({
              ...p,
              entryDate: new Date(p.entryDate as string),
            }));
          }
          // Rehydrate dates in trades
          if (parsed.state?.trades) {
            parsed.state.trades = parsed.state.trades.map((t: Record<string, unknown>) => ({
              ...t,
              date: new Date(t.date as string),
            }));
          }
          if (parsed.state?.portfolio && typeof parsed.state.portfolio.initialCapital !== 'number') {
            parsed.state.portfolio.initialCapital = parsed.state.portfolio.totalValue ?? 100000;
          }
          return parsed;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
