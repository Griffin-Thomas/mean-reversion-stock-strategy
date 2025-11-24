import { useMemo } from 'react';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useMarketStore } from '../stores/marketStore';
import { getSortedPositions, getTopPerformers, getWorstPerformers } from '../services/portfolioManager';

export function usePortfolio() {
  const {
    portfolio,
    trades,
    buyStock,
    sellPosition,
    resetPortfolio,
    getStats,
    initializePortfolio,
    exportState,
    importState,
  } = usePortfolioStore();

  const { stocks } = useMarketStore();

  const stats = getStats();

  const sortedPositions = useMemo(
    () => getSortedPositions(portfolio.positions, 'percentGain', false),
    [portfolio.positions]
  );

  const topPerformers = useMemo(
    () => getTopPerformers(portfolio.positions, 3),
    [portfolio.positions]
  );

  const worstPerformers = useMemo(
    () => getWorstPerformers(portfolio.positions, 3),
    [portfolio.positions]
  );

  const recentTrades = useMemo(
    () => [...trades].reverse().slice(0, 10),
    [trades]
  );

  const handleBuy = (symbol: string, shares: number) => {
    const stockData = stocks.get(symbol);
    if (!stockData) return;

    buyStock(symbol, stockData.price, shares);
  };

  const handleSell = (positionId: string) => {
    const position = portfolio.positions.find(p => p.id === positionId);
    if (!position) return;

    sellPosition(positionId, position.currentPrice);
  };

  return {
    portfolio,
    trades,
    stats,
    sortedPositions,
    topPerformers,
    worstPerformers,
    recentTrades,
    handleBuy,
    handleSell,
    resetPortfolio,
    initializePortfolio,
    exportState,
    importState,
  };
}
