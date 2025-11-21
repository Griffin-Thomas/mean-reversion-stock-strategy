import { useRef } from 'react';
import { SignalsList } from './SignalsList';
import { PortfolioSummary } from './PortfolioSummary';
import { MarketOverview } from './MarketOverview';
import { StockChart } from '../Analysis/StockChart';
import { BacktestResults } from '../Analysis/BacktestResults';
import { LoadingSpinner } from '../Shared/LoadingSpinner';
import { useStockData, useSelectedStock } from '../../hooks/useStockData';
import { usePortfolio } from '../../hooks/usePortfolio';
import { useBacktest } from '../../hooks/useBacktest';
import { formatDateTime } from '../../utils/formatters';
import { isDemoMode } from '../../utils/env';

export function Dashboard() {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const {
    stocks,
    signals,
    isLoading,
    error,
    lastUpdated,
    setSelectedSymbol,
    fetchStock,
    refreshData,
  } = useStockData();

  const selectedStock = useSelectedStock();
  const { portfolio, handleBuy, handleSell, initializePortfolio } = usePortfolio();
  const { results, isRunning, runFullBacktest } = useBacktest();
  const demoMode = isDemoMode();

  const handleSignalClick = (signal: { symbol: string }) => {
    setSelectedSymbol(signal.symbol);
  };

  const handleStockClick = async (symbol: string) => {
    setSelectedSymbol(symbol);
    // Ensure fresh data for clicked ticker and scroll chart into view
    await fetchStock(symbol);
    chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePositionClick = (position: { symbol: string }) => {
    setSelectedSymbol(position.symbol);
  };

  if (isLoading && stocks.size === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading market data..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Mean Reversion Strategy
                </h1>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded ${
                    demoMode
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {demoMode ? 'DEMO' : 'LIVE'}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {demoMode
                  ? 'S&P 500 "Buy the Dip" Trading Signals (Simulated Data)'
                  : 'S&P 500 "Buy the Dip" Trading Signals'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Updated: {formatDateTime(lastUpdated)}
                </span>
              )}
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Sidebar - Signals */}
          <div className="col-span-12 lg:col-span-3">
            <SignalsList
              signals={signals}
              onSignalClick={handleSignalClick}
            />
          </div>

          {/* Center - Charts and Analysis */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            <div ref={chartRef}>
              <StockChart
                stock={selectedStock}
                showMA={true}
                showRSI={true}
                showVolume={true}
              />
            </div>

            <BacktestResults
              results={results}
              isRunning={isRunning}
              onRunBacktest={runFullBacktest}
            />

            <MarketOverview
              stocks={stocks}
              onStockClick={handleStockClick}
            />
          </div>

          {/* Right Sidebar - Portfolio */}
          <div className="col-span-12 lg:col-span-3">
            <PortfolioSummary
              portfolio={portfolio}
              onPositionClick={handlePositionClick}
              onCapitalUpdate={initializePortfolio}
            />

            {/* Quick Actions */}
            {selectedStock && (
              <div className="mt-4 bg-white rounded-lg shadow p-4">
                <h3 className="font-medium mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleBuy(selectedStock.symbol, 10)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                  >
                    Buy 10 shares of {selectedStock.symbol}
                  </button>
                  {portfolio.positions.find(p => p.symbol === selectedStock.symbol) && (
                    <button
                      onClick={() => {
                        const position = portfolio.positions.find(p => p.symbol === selectedStock.symbol);
                        if (position) handleSell(position.id);
                      }}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                    >
                      Sell {selectedStock.symbol}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
