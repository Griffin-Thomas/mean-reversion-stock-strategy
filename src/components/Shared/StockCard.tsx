import { clsx } from 'clsx';
import { StockData } from '../../types';
import { formatCurrency, formatPercent, formatVolume } from '../../utils/formatters';

interface StockCardProps {
  stock: StockData;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
}

export function StockCard({ stock, onClick, selected, compact }: StockCardProps) {
  const isPositive = stock.changePercent >= 0;

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={clsx(
          'flex items-center justify-between p-2 rounded cursor-pointer transition-colors',
          selected ? 'bg-blue-100' : 'hover:bg-gray-50',
        )}
      >
        <span className="font-medium">{stock.symbol}</span>
        <span className={clsx(
          'text-sm font-medium',
          isPositive ? 'text-green-600' : 'text-red-600'
        )}>
          {formatPercent(stock.changePercent)}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-4 rounded-lg border transition-all cursor-pointer',
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-lg">{stock.symbol}</h3>
        <span className={clsx(
          'px-2 py-1 rounded text-sm font-medium',
          isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        )}>
          {formatPercent(stock.changePercent)}
        </span>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Price</span>
          <span className="font-medium">{formatCurrency(stock.price)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Volume</span>
          <span className="font-medium">{formatVolume(stock.volume)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">RSI</span>
          <span className={clsx(
            'font-medium',
            stock.rsi < 30 ? 'text-green-600' : stock.rsi > 70 ? 'text-red-600' : ''
          )}>
            {stock.rsi.toFixed(1)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">200-MA</span>
          <span className="font-medium">{formatCurrency(stock.ma200)}</span>
        </div>
      </div>
    </div>
  );
}
