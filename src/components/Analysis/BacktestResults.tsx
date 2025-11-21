import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { BacktestResult } from '../../types';
import { formatCurrency, formatPercent, formatDate } from '../../utils/formatters';
import { CHART_COLORS } from '../../utils/constants';
import { clsx } from 'clsx';

interface BacktestResultsProps {
  results: BacktestResult | null;
  isRunning?: boolean;
  onRunBacktest?: () => void;
}

export function BacktestResults({ results, isRunning, onRunBacktest }: BacktestResultsProps) {
  if (!results) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Backtest Results</h2>
          {onRunBacktest && (
            <button
              onClick={onRunBacktest}
              disabled={isRunning}
              className={clsx(
                'px-4 py-2 rounded text-sm font-medium',
                isRunning
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              {isRunning ? 'Running...' : 'Run Backtest'}
            </button>
          )}
        </div>
        <div className="h-64 flex items-center justify-center text-gray-500">
          {isRunning ? 'Running backtest...' : 'Click "Run Backtest" to see results'}
        </div>
      </div>
    );
  }

  // Prepare equity curve data
  const equityData = results.equityCurve.map(point => ({
    date: formatDate(point.date),
    value: point.value,
  }));

  // Prepare win/loss distribution
  const winLossData = [
    { name: 'Wins', value: results.profitableTrades, fill: CHART_COLORS.secondary },
    { name: 'Losses', value: results.totalTrades - results.profitableTrades, fill: CHART_COLORS.danger },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Backtest Results</h2>
        {onRunBacktest && (
          <button
            onClick={onRunBacktest}
            disabled={isRunning}
            className={clsx(
              'px-4 py-2 rounded text-sm font-medium',
              isRunning
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {isRunning ? 'Running...' : 'Re-run'}
          </button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">Total Return</div>
          <div className={clsx(
            'text-lg font-bold',
            results.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {formatPercent(results.totalReturn)}
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">Win Rate</div>
          <div className="text-lg font-bold">{results.winRate.toFixed(1)}%</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">Sharpe Ratio</div>
          <div className="text-lg font-bold">{results.sharpeRatio.toFixed(2)}</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">Max Drawdown</div>
          <div className="text-lg font-bold text-red-600">
            -{results.maxDrawdown.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Equity Curve */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Equity Curve</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={equityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Portfolio']} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Trade Statistics</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Trades</span>
              <span className="font-medium">{results.totalTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Profitable</span>
              <span className="font-medium text-green-600">{results.profitableTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Win</span>
              <span className="font-medium text-green-600">{formatPercent(results.avgWinPercent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Loss</span>
              <span className="font-medium text-red-600">{formatPercent(results.avgLossPercent)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Win/Loss Distribution</h3>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={winLossData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={50} />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
