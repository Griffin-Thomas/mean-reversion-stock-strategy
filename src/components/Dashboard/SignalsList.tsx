import { clsx } from 'clsx';
import { TradingSignal } from '../../types';
import { formatCurrency, formatRelativeTime, getSignalBgColor } from '../../utils/formatters';

interface SignalsListProps {
  signals: TradingSignal[];
  onSignalClick?: (signal: TradingSignal) => void;
}

export function SignalsList({ signals, onSignalClick }: SignalsListProps) {
  if (signals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold mb-4">Trading Signals</h2>
        <p className="text-gray-500 text-sm text-center py-4">
          No signals at this time. Scanning for opportunities...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold">Trading Signals</h2>
        <p className="text-sm text-gray-500">{signals.length} active signals</p>
      </div>

      <div className="divide-y max-h-96 overflow-y-auto">
        {signals.map(signal => (
          <div
            key={signal.id}
            onClick={() => onSignalClick?.(signal)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold">{signal.symbol}</span>
                <span className={clsx(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  getSignalBgColor(signal.signalType),
                  signal.signalType === 'BUY' ? 'text-green-800' : 'text-red-800'
                )}>
                  {signal.signalType}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  Strength: {signal.signalStrength}%
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-2">
              <div className="flex justify-between">
                <span>Entry</span>
                <span className="font-medium">{formatCurrency(signal.entryPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Target</span>
                <span className="font-medium text-green-600">{formatCurrency(signal.targetPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Stop Loss</span>
                <span className="font-medium text-red-600">{formatCurrency(signal.stopLoss)}</span>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              {signal.reasons.slice(0, 2).map((reason, i) => (
                <div key={i}>• {reason}</div>
              ))}
            </div>

            <div className="text-xs text-gray-400 mt-2">
              {formatRelativeTime(signal.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
