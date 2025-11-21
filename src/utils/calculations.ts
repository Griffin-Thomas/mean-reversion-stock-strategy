import { HistoricalDataPoint } from '../types';

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return 0;
  const slice = data.slice(-period);
  return slice.reduce((sum, val) => sum + val, 0) / period;
}

/**
 * Calculate Moving Average from historical data
 */
export function calculateMA(
  historicalData: HistoricalDataPoint[],
  period: number
): number {
  if (historicalData.length < period) return 0;
  const closes = historicalData.slice(-period).map(d => d.close);
  return closes.reduce((sum, val) => sum + val, 0) / period;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(
  historicalData: HistoricalDataPoint[],
  period: number = 14
): number {
  if (historicalData.length < period + 1) return 50;

  const changes: number[] = [];
  for (let i = 1; i < historicalData.length; i++) {
    changes.push(historicalData[i].close - historicalData[i - 1].close);
  }

  const recentChanges = changes.slice(-period);

  let gains = 0;
  let losses = 0;

  for (const change of recentChanges) {
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return Math.round(rsi * 100) / 100;
}

/**
 * Calculate RSI for each point to build indicator series
 */
export function calculateRSISeries(
  historicalData: HistoricalDataPoint[],
  period: number = 14
): Array<number | null> {
  if (historicalData.length < period + 1) {
    return new Array(historicalData.length).fill(null);
  }

  const rsiSeries: Array<number | null> = new Array(historicalData.length).fill(null);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = historicalData[i].close - historicalData[i - 1].close;
    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsiSeries[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));

  for (let i = period + 1; i < historicalData.length; i++) {
    const change = historicalData[i].close - historicalData[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;

    rsiSeries[i] = avgLoss === 0
      ? 100
      : 100 - (100 / (1 + (avgGain / avgLoss)));
  }

  return rsiSeries;
}

/**
 * Calculate Exponential Moving Average
 */
export function calculateEMA(data: number[], period: number): number {
  if (data.length < period) return 0;

  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;

  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
  }

  return ema;
}

/**
 * Calculate percentage change
 */
export function calculatePercentChange(
  currentPrice: number,
  previousPrice: number
): number {
  if (previousPrice === 0) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

/**
 * Calculate Sharpe Ratio
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = 0.05
): number {
  if (returns.length === 0) return 0;

  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const annualizedReturn = avgReturn * 252; // Assuming daily returns

  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance) * Math.sqrt(252);

  if (stdDev === 0) return 0;

  return (annualizedReturn - riskFreeRate) / stdDev;
}

/**
 * Calculate Maximum Drawdown
 */
export function calculateMaxDrawdown(equityCurve: number[]): number {
  if (equityCurve.length === 0) return 0;

  let maxDrawdown = 0;
  let peak = equityCurve[0];

  for (const value of equityCurve) {
    if (value > peak) {
      peak = value;
    }
    const drawdown = (peak - value) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown * 100;
}

/**
 * Calculate signal strength based on multiple factors
 */
export function calculateSignalStrength(
  rsi: number,
  dipPercent: number,
  volumeRatio: number,
  aboveMA: boolean
): number {
  let strength = 0;

  // RSI contribution (0-30)
  if (rsi < 30) {
    strength += 30 - rsi;
  }

  // Dip contribution (0-30)
  const dipContribution = Math.min(Math.abs(dipPercent) * 3, 30);
  strength += dipContribution;

  // Volume contribution (0-20)
  const volumeContribution = Math.min(volumeRatio * 10, 20);
  strength += volumeContribution;

  // Trend filter bonus (0-20)
  if (aboveMA) {
    strength += 20;
  }

  return Math.min(Math.round(strength), 100);
}

/**
 * Calculate position size based on risk
 */
export function calculatePositionSize(
  portfolioValue: number,
  riskPercent: number,
  entryPrice: number,
  stopLossPrice: number
): number {
  const riskAmount = portfolioValue * (riskPercent / 100);
  const riskPerShare = entryPrice - stopLossPrice;

  if (riskPerShare <= 0) return 0;

  return Math.floor(riskAmount / riskPerShare);
}

/**
 * Calculate target price based on entry and target gain
 */
export function calculateTargetPrice(
  entryPrice: number,
  targetGainPercent: number
): number {
  return entryPrice * (1 + targetGainPercent / 100);
}

/**
 * Calculate stop loss price
 */
export function calculateStopLoss(
  entryPrice: number,
  stopLossPercent: number
): number {
  return entryPrice * (1 - stopLossPercent / 100);
}

/**
 * Check if stock meets quality filters
 */
export function meetsQualityFilters(
  marketCap: number,
  peRatio: number,
  volume: number,
  minMarketCap: number,
  maxPERatio: number,
  minVolume: number
): { passes: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (marketCap < minMarketCap) {
    reasons.push(`Market cap $${(marketCap / 1e9).toFixed(1)}B < $${(minMarketCap / 1e9).toFixed(0)}B`);
  }

  if (peRatio > maxPERatio && peRatio > 0) {
    reasons.push(`P/E ratio ${peRatio.toFixed(1)} > ${maxPERatio}`);
  }

  if (volume < minVolume) {
    reasons.push(`Volume ${(volume / 1e6).toFixed(1)}M < ${(minVolume / 1e6).toFixed(0)}M`);
  }

  return {
    passes: reasons.length === 0,
    reasons
  };
}
