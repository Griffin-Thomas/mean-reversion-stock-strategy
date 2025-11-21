import { StockData, TradingSignal, StrategyConfig, Position } from '../types';
import {
  calculateSignalStrength,
  calculateTargetPrice,
  calculateStopLoss,
  meetsQualityFilters
} from '../utils/calculations';
import { DEFAULT_STRATEGY_CONFIG, SECTOR_MAP } from '../utils/constants';

/**
 * Check if stock meets buy conditions
 */
export function meetsBuyConditions(
  data: StockData,
  config: StrategyConfig = DEFAULT_STRATEGY_CONFIG
): { meets: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const failReasons: string[] = [];

  // Check if stock had a significant dip
  if (data.changePercent <= config.dipThreshold) {
    reasons.push(`Dropped ${data.changePercent.toFixed(2)}% (threshold: ${config.dipThreshold}%)`);
  } else {
    failReasons.push(`No significant dip (${data.changePercent.toFixed(2)}% > ${config.dipThreshold}%)`);
  }

  // Check if price is above 200-day MA (uptrend filter)
  if (data.price > data.ma200 && data.ma200 > 0) {
    reasons.push(`Price $${data.price.toFixed(2)} above 200-MA $${data.ma200.toFixed(2)}`);
  } else if (data.ma200 > 0) {
    failReasons.push(`Price below 200-MA (trend filter)`);
  }

  // Check RSI oversold
  if (data.rsi < config.rsiOversold) {
    reasons.push(`RSI ${data.rsi.toFixed(1)} < ${config.rsiOversold} (oversold)`);
  } else {
    failReasons.push(`RSI not oversold (${data.rsi.toFixed(1)} >= ${config.rsiOversold})`);
  }

  // Check quality filters
  const qualityCheck = meetsQualityFilters(
    data.marketCap,
    data.peRatio,
    data.volume,
    config.qualityFilters.minMarketCap,
    config.qualityFilters.maxPERatio,
    config.qualityFilters.minVolume
  );

  if (qualityCheck.passes) {
    reasons.push('Passes quality filters');
  } else {
    failReasons.push(...qualityCheck.reasons);
  }

  const meets = failReasons.length === 0 && reasons.length >= 3;

  return {
    meets,
    reasons: meets ? reasons : failReasons
  };
}

/**
 * Check if position should be sold
 */
export function meetsSellConditions(
  position: Position,
  currentData: StockData,
  config: StrategyConfig = DEFAULT_STRATEGY_CONFIG
): { meets: boolean; reasons: string[] } {
  const reasons: string[] = [];

  const daysSinceEntry = Math.floor(
    (Date.now() - position.entryDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Check RSI overbought
  if (currentData.rsi > config.rsiOverbought) {
    reasons.push(`RSI ${currentData.rsi.toFixed(1)} > ${config.rsiOverbought} (overbought)`);
  }

  // Check target hit
  const targetPrice = calculateTargetPrice(position.entryPrice, config.targetGainPercent);
  if (currentData.price >= targetPrice) {
    reasons.push(`Target hit: $${currentData.price.toFixed(2)} >= $${targetPrice.toFixed(2)}`);
  }

  // Check stop loss
  const stopLoss = calculateStopLoss(position.entryPrice, config.stopLossPercent);
  if (currentData.price <= stopLoss) {
    reasons.push(`Stop loss triggered: $${currentData.price.toFixed(2)} <= $${stopLoss.toFixed(2)}`);
  }

  // Check time-based exit
  if (daysSinceEntry >= config.maxHoldingDays) {
    reasons.push(`Max holding period reached (${daysSinceEntry} days)`);
  }

  return {
    meets: reasons.length > 0,
    reasons
  };
}

/**
 * Generate buy signal for a stock
 */
export function generateBuySignal(
  data: StockData,
  config: StrategyConfig = DEFAULT_STRATEGY_CONFIG
): TradingSignal {
  const { reasons } = meetsBuyConditions(data, config);

  // Calculate average volume for volume ratio
  const avgVolume = data.historicalData?.length
    ? data.historicalData.slice(-20).reduce((sum, d) => sum + d.volume, 0) / 20
    : data.volume;

  const volumeRatio = data.volume / avgVolume;

  const signalStrength = calculateSignalStrength(
    data.rsi,
    data.changePercent,
    volumeRatio,
    data.price > data.ma200
  );

  return {
    id: `${data.symbol}-${Date.now()}`,
    symbol: data.symbol,
    signalType: 'BUY',
    signalStrength,
    reasons,
    entryPrice: data.price,
    targetPrice: calculateTargetPrice(data.price, config.targetGainPercent),
    stopLoss: calculateStopLoss(data.price, config.stopLossPercent),
    timestamp: new Date(),
  };
}

/**
 * Generate sell signal for a position
 */
export function generateSellSignal(
  position: Position,
  data: StockData,
  config: StrategyConfig = DEFAULT_STRATEGY_CONFIG
): TradingSignal {
  const { reasons } = meetsSellConditions(position, data, config);

  return {
    id: `${data.symbol}-sell-${Date.now()}`,
    symbol: data.symbol,
    signalType: 'SELL',
    signalStrength: 100, // Sell signals are always strong
    reasons,
    entryPrice: position.entryPrice,
    targetPrice: data.price,
    stopLoss: calculateStopLoss(position.entryPrice, config.stopLossPercent),
    timestamp: new Date(),
  };
}

/**
 * Scan multiple stocks for buy opportunities
 */
export async function scanForOpportunities(
  stocksData: Map<string, StockData>,
  config: StrategyConfig = DEFAULT_STRATEGY_CONFIG
): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];

  for (const [, data] of stocksData) {
    const { meets } = meetsBuyConditions(data, config);
    if (meets) {
      signals.push(generateBuySignal(data, config));
    }
  }

  // Sort by signal strength descending
  return signals.sort((a, b) => b.signalStrength - a.signalStrength);
}

/**
 * Check existing positions for sell signals
 */
export function checkPositionsForSells(
  positions: Position[],
  stocksData: Map<string, StockData>,
  config: StrategyConfig = DEFAULT_STRATEGY_CONFIG
): TradingSignal[] {
  const signals: TradingSignal[] = [];

  for (const position of positions) {
    const data = stocksData.get(position.symbol);
    if (!data) continue;

    const { meets } = meetsSellConditions(position, data, config);
    if (meets) {
      signals.push(generateSellSignal(position, data, config));
    }
  }

  return signals;
}

/**
 * Calculate sector exposure
 */
export function calculateSectorExposure(
  positions: Position[]
): Map<string, number> {
  const sectorValues = new Map<string, number>();
  let totalValue = 0;

  for (const position of positions) {
    const sector = SECTOR_MAP[position.symbol] || 'Other';
    const positionValue = position.currentPrice * position.shares;
    totalValue += positionValue;

    const currentSectorValue = sectorValues.get(sector) || 0;
    sectorValues.set(sector, currentSectorValue + positionValue);
  }

  // Convert to percentages
  const sectorExposure = new Map<string, number>();
  for (const [sector, value] of sectorValues) {
    sectorExposure.set(sector, totalValue > 0 ? value / totalValue : 0);
  }

  return sectorExposure;
}

/**
 * Check if adding a position would exceed sector exposure limit
 */
export function wouldExceedSectorLimit(
  symbol: string,
  positionValue: number,
  currentPositions: Position[],
  portfolioValue: number,
  maxSectorExposure: number
): boolean {
  const sector = SECTOR_MAP[symbol] || 'Other';

  // Calculate current sector exposure
  let sectorValue = positionValue;
  for (const position of currentPositions) {
    if (SECTOR_MAP[position.symbol] === sector) {
      sectorValue += position.currentPrice * position.shares;
    }
  }

  return sectorValue / portfolioValue > maxSectorExposure;
}

/**
 * Filter signals based on portfolio constraints
 */
export function filterSignalsByPortfolioConstraints(
  signals: TradingSignal[],
  currentPositions: Position[],
  portfolioValue: number,
  config: StrategyConfig = DEFAULT_STRATEGY_CONFIG
): TradingSignal[] {
  const filtered: TradingSignal[] = [];
  const { maxPositions, positionSize, maxSectorExposure } = config.allocation;

  // Check if we're at max positions
  if (currentPositions.length >= maxPositions) {
    return [];
  }

  const positionValue = portfolioValue * positionSize;
  const currentSymbols = new Set(currentPositions.map(p => p.symbol));

  for (const signal of signals) {
    // Skip if already holding
    if (currentSymbols.has(signal.symbol)) continue;

    // Check sector exposure
    if (wouldExceedSectorLimit(
      signal.symbol,
      positionValue,
      currentPositions,
      portfolioValue,
      maxSectorExposure
    )) continue;

    filtered.push(signal);

    // Stop if we've filled remaining slots
    if (filtered.length >= maxPositions - currentPositions.length) break;
  }

  return filtered;
}
