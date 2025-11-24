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
  exportState: () => { portfolio: Portfolio; trades: Trade[] };
  importState: (data: { portfolio: Portfolio; trades: Trade[] }) => void;
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

      exportState: () => {
        const { portfolio, trades } = get();
        return { portfolio, trades };
      },

      importState: (data) => {
        // Basic validation: require portfolio and trades arrays
        if (!data || typeof data !== 'object') return;
        const nextPortfolio = data.portfolio;
        const nextTrades = Array.isArray(data.trades) ? data.trades : [];

        // Rehydrate dates
        if (nextPortfolio?.positions) {
          nextPortfolio.positions = nextPortfolio.positions.map((p: Record<string, unknown>) => ({
            ...p,
            entryDate: new Date(p.entryDate as string),
          }));
        }
        if (nextTrades) {
          for (const t of nextTrades as Trade[]) {
            if (t.date) (t as Trade).date = new Date(t.date as unknown as string);
          }
        }

        if (nextPortfolio) {
          set({
            portfolio: nextPortfolio as unknown as Portfolio,
            trades: nextTrades as Trade[],
          });
        }
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
