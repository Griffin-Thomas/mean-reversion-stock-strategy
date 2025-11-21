import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Portfolio, Position } from '../../types';
import { formatCurrency, formatPercent, getChangeColor } from '../../utils/formatters';

interface PortfolioSummaryProps {
  portfolio: Portfolio;
  onPositionClick?: (position: Position) => void;
  onCapitalUpdate?: (amount: number) => void;
}

export function PortfolioSummary({
  portfolio,
  onPositionClick,
  onCapitalUpdate,
}: PortfolioSummaryProps) {
  const totalReturn = portfolio.initialCapital > 0
    ? ((portfolio.totalValue - portfolio.initialCapital) / portfolio.initialCapital) * 100
    : 0;
  const totalUnrealized = portfolio.positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
  const [capitalInput, setCapitalInput] = useState(portfolio.initialCapital.toFixed(0));
  const [capitalError, setCapitalError] = useState<string | null>(null);

  useEffect(() => {
    setCapitalInput(portfolio.initialCapital.toFixed(0));
  }, [portfolio.initialCapital]);

  const handleCapitalUpdate = () => {
    if (!onCapitalUpdate) return;
    const amount = Number(capitalInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setCapitalError('Enter a positive dollar amount');
      return;
    }
    setCapitalError(null);
    onCapitalUpdate(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold">Portfolio</h2>
      </div>

      {/* Summary Stats */}
      <div className="p-4 space-y-3 border-b">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Value</span>
          <span className="font-bold">{formatCurrency(portfolio.totalValue)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Cash</span>
          <span className="font-medium">{formatCurrency(portfolio.cash)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Return</span>
          <span className={clsx('font-bold', getChangeColor(totalReturn))}>
            {formatPercent(totalReturn)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Daily P&L</span>
          <span className={clsx('font-medium', getChangeColor(portfolio.dailyPnL))}>
            {formatCurrency(portfolio.dailyPnL)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Unrealized P&L</span>
          <span className={clsx('font-medium', getChangeColor(totalUnrealized))}>
            {formatCurrency(totalUnrealized)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Realized P&L</span>
          <span className={clsx('font-medium', getChangeColor(portfolio.totalPnL))}>
            {formatCurrency(portfolio.totalPnL)}
          </span>
        </div>
      </div>

      {/* Positions */}
      <div className="p-4">
        <h3 className="font-medium mb-3">
          Positions ({portfolio.positions.length})
        </h3>

        {portfolio.positions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">
            No open positions
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {portfolio.positions.map(position => (
              <div
                key={position.id}
                onClick={() => onPositionClick?.(position)}
                className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{position.symbol}</span>
                  <span className={clsx(
                    'text-sm font-bold',
                    getChangeColor(position.percentGain)
                  )}>
                    {formatPercent(position.percentGain)}
                  </span>
                </div>
                <div className="text-xs text-gray-600 flex justify-between">
                  <span>{position.shares} shares @ {formatCurrency(position.entryPrice)}</span>
                  <span className={getChangeColor(position.unrealizedPnL)}>
                    {formatCurrency(position.unrealizedPnL)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Capital Controls */}
      {onCapitalUpdate && (
        <div className="px-4 pb-4">
          <div className="border-t pt-4">
            <h3 className="font-medium text-sm text-gray-600 mb-2">
              Portfolio Capital
            </h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="number"
                value={capitalInput}
                onChange={e => setCapitalInput(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm sm:flex-1"
                min="1000"
                step="1000"
              />
              <button
                onClick={handleCapitalUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 sm:shrink-0"
              >
                Update
              </button>
            </div>
            {capitalError && (
              <p className="text-xs text-red-600 mt-1">{capitalError}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Updates reset positions/trades to match the new starting capital.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
