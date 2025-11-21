import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Bar
} from 'recharts';
import { StockData, HistoricalDataPoint } from '../../types';
import { formatCurrency, formatDate, formatVolume } from '../../utils/formatters';
import { CHART_COLORS } from '../../utils/constants';
import { calculateRSISeries } from '../../utils/calculations';

const DISPLAY_DAYS = 120;

const calculateMovingAverageSeries = (
  data: HistoricalDataPoint[],
  period: number
): Array<number | null> => {
  if (data.length === 0) return [];
  const series: Array<number | null> = new Array(data.length).fill(null);

  for (let i = 0; i < data.length; i++) {
    const windowSize = Math.min(period, i + 1);
    if (windowSize < period) continue;
    const slice = data.slice(i - period + 1, i + 1);
    const avg = slice.reduce((sum, point) => sum + point.close, 0) / period;
    series[i] = avg;
  }

  return series;
};

interface StockChartProps {
  stock: StockData | null;
  showMA?: boolean;
  showRSI?: boolean;
  showVolume?: boolean;
}

export function StockChart({
  stock,
  showMA = true,
  showRSI = true,
  showVolume = true
}: StockChartProps) {
  if (!stock || !stock.historicalData || stock.historicalData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold mb-4">Stock Chart</h2>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Select a stock to view chart
        </div>
      </div>
    );
  }

  // Prepare chart data
  const historicalData = stock.historicalData;
  const ma50Series = calculateMovingAverageSeries(historicalData, 50);
  // Temporarily disable 200-day MA until live historical data access is available
  const includeMa200 = false;
  const ma200Series = includeMa200
    ? calculateMovingAverageSeries(historicalData, 200)
    : [];
  const rsiSeries = calculateRSISeries(historicalData, 14);
  const recentHistory = historicalData.slice(-Math.min(DISPLAY_DAYS, historicalData.length));
  const offset = historicalData.length - recentHistory.length;

  const chartData = recentHistory.map((point, index) => {
    const absoluteIndex = offset + index;

    return {
      date: formatDate(point.date),
      price: point.close,
      ma50: ma50Series[absoluteIndex],
      ma200: ma200Series[absoluteIndex],
      volume: point.volume,
      high: point.high,
      low: point.low,
      rsi: rsiSeries[absoluteIndex],
    };
  });

  const rsiChartData = chartData.map(point => ({
    date: point.date,
    rsi: point.rsi,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{stock.symbol} Chart</h2>
        <div className="text-sm text-gray-500">
          Last {chartData.length} trading days
        </div>
      </div>

      {/* Price Chart */}
      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="price"
              domain={['auto', 'auto']}
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            {showVolume && (
              <YAxis
                yAxisId="volume"
                orientation="right"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `${formatVolume(value)}`}
              />
            )}
            <Tooltip
              formatter={(value: number, name: string) => {
                const key = name.toLowerCase();
                if (key.includes('volume')) return [formatVolume(value), 'Volume'];
                return [formatCurrency(value), name];
              }}
            />
            <Legend />

            {showVolume && (
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill={CHART_COLORS.volume}
                opacity={0.3}
                name="Volume"
              />
            )}

            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={false}
              name="Price"
            />

            {showMA && (
              <>
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="ma50"
                  stroke={CHART_COLORS.ma50}
                  strokeWidth={1}
                  dot={false}
                  connectNulls
                  name="50-MA"
                  strokeDasharray="5 5"
                />
                {includeMa200 && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="ma200"
                    stroke={CHART_COLORS.ma200}
                    strokeWidth={1}
                    dot={false}
                    connectNulls
                    name="200-MA"
                    strokeDasharray="3 3"
                  />
                )}
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RSI Chart */}
      {showRSI && (
        <div className="h-32">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            RSI ({stock.rsi.toFixed(1)})
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rsiChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <ReferenceLine y={30} stroke={CHART_COLORS.secondary} strokeDasharray="3 3" label="Oversold" />
              <ReferenceLine y={70} stroke={CHART_COLORS.danger} strokeDasharray="3 3" label="Overbought" />
              <Tooltip<number, string>
                formatter={(value) => [
                  Number.isFinite(value) ? value.toFixed(1) : 'N/A',
                  'RSI',
                ]}
              />
              <Line
                type="monotone"
                dataKey="rsi"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Oversold ({"<"}30)</span>
            <span className="font-medium">RSI: {stock.rsi.toFixed(1)}</span>
            <span>Overbought ({">"}70)</span>
          </div>
        </div>
      )}
    </div>
  );
}
