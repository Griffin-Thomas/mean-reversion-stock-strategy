import { clsx } from 'clsx';
import { StockData } from '../../types';
import { formatPercent } from '../../utils/formatters';

interface MarketOverviewProps {
  stocks: Map<string, StockData>;
  onStockClick?: (symbol: string) => void;
}

export function MarketOverview({ stocks, onStockClick }: MarketOverviewProps) {
  const stocksArray = Array.from(stocks.values());

  // Sort by change percent for rankings
  const sortedStocks = [...stocksArray].sort(
    (a, b) => b.changePercent - a.changePercent
  );

  const gainers = sortedStocks.filter(s => s.changePercent > 0).slice(0, 5);
  const losers = sortedStocks.filter(s => s.changePercent < 0).reverse().slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-bold mb-4">Market Overview</h2>

      {/* Heatmap Grid */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Performance Heatmap</h3>
        <div className="grid grid-cols-5 gap-1">
          {sortedStocks
            .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
            .slice(0, 20)
            .map(stock => {
            const intensity = Math.min(Math.abs(stock.changePercent) / 5, 1);
            const isPositive = stock.changePercent >= 0;

            return (
              <div
                key={stock.symbol}
                onClick={() => onStockClick?.(stock.symbol)}
                className={clsx(
                  'p-2 rounded text-center cursor-pointer transition-transform hover:scale-105',
                  isPositive
                    ? `bg-green-${Math.round(intensity * 5 + 1)}00`
                    : `bg-red-${Math.round(intensity * 5 + 1)}00`,
                )}
                style={{
                  backgroundColor: isPositive
                    ? `rgba(34, 197, 94, ${0.2 + intensity * 0.6})`
                    : `rgba(239, 68, 68, ${0.2 + intensity * 0.6})`,
                }}
                title={`${stock.symbol}: ${formatPercent(stock.changePercent)}`}
              >
                <div className="text-xs font-medium truncate">{stock.symbol}</div>
                <div className="text-xs">{formatPercent(stock.changePercent, 1)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-green-600 mb-2">Top Gainers</h3>
          <div className="space-y-1">
            {gainers.map(stock => (
              <div
                key={stock.symbol}
                onClick={() => onStockClick?.(stock.symbol)}
                className="flex justify-between text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <span className="font-medium">{stock.symbol}</span>
                <span className="text-green-600">{formatPercent(stock.changePercent)}</span>
              </div>
            ))}
            {gainers.length === 0 && (
              <p className="text-xs text-gray-500">No gainers</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-red-600 mb-2">Top Losers</h3>
          <div className="space-y-1">
            {losers.map(stock => (
              <div
                key={stock.symbol}
                onClick={() => onStockClick?.(stock.symbol)}
                className="flex justify-between text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <span className="font-medium">{stock.symbol}</span>
                <span className="text-red-600">{formatPercent(stock.changePercent)}</span>
              </div>
            ))}
            {losers.length === 0 && (
              <p className="text-xs text-gray-500">No losers</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
