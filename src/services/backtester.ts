import {
  HistoricalDataPoint,
  BacktestResult,
  Trade,
  StrategyConfig,
  Position
} from '../types';
import {
  calculateMA,
  calculateRSI,
  calculateSharpeRatio,
  calculateMaxDrawdown,
  calculateTargetPrice,
  calculateStopLoss
} from '../utils/calculations';
import { DEFAULT_STRATEGY_CONFIG } from '../utils/constants';

interface BacktestState {
  cash: number;
  positions: Map<string, Position>;
  trades: Trade[];
  equityCurve: { date: Date; value: number }[];
}

/**
 * Run backtest on historical data
 */
export async function runBacktest(
  symbolsData: Map<string, HistoricalDataPoint[]>,
  initialCapital: number = 100000,
  config: StrategyConfig = DEFAULT_STRATEGY_CONFIG
): Promise<BacktestResult> {
  const state: BacktestState = {
    cash: initialCapital,
    positions: new Map(),
    trades: [],
    equityCurve: [],
  };

  // Get all unique dates across all symbols
  const allDates = new Set<string>();
  for (const [, data] of symbolsData) {
    for (const point of data) {
      allDates.add(point.date.toISOString().split('T')[0]);
    }
  }

  const sortedDates = Array.from(allDates).sort();

  // Iterate through each trading day
  for (let i = 200; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const lookbackData = new Map<string, HistoricalDataPoint[]>();

    // Get historical data up to current date for each symbol
    for (const [symbol, data] of symbolsData) {
      const filtered = data.filter(
        d => d.date <= currentDate
      );
      if (filtered.length >= 200) {
        lookbackData.set(symbol, filtered);
      }
    }

    // Check existing positions for exit signals
    await checkExits(state, lookbackData, currentDate, config);

    // Look for new entry signals
    await checkEntries(state, lookbackData, currentDate, config);

    // Calculate and record portfolio value
    const portfolioValue = calculatePortfolioValue(state, lookbackData);
    state.equityCurve.push({ date: currentDate, value: portfolioValue });
  }

  // Close all remaining positions at the end
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);
  for (const [symbol, position] of state.positions) {
    const data = symbolsData.get(symbol);
    if (!data) continue;

    const lastPrice = data[data.length - 1].close;
    const pnl = (lastPrice - position.entryPrice) * position.shares;
    const percentGain = ((lastPrice - position.entryPrice) / position.entryPrice) * 100;

    state.trades.push({
      id: `${symbol}-sell-${lastDate.getTime()}`,
      symbol,
      type: 'SELL',
      price: lastPrice,
      shares: position.shares,
      date: lastDate,
      pnl,
      percentGain,
    });

    state.cash += lastPrice * position.shares;
  }

  return calculateBacktestMetrics(state, initialCapital);
}

async function checkExits(
  state: BacktestState,
  lookbackData: Map<string, HistoricalDataPoint[]>,
  currentDate: Date,
  config: StrategyConfig
): Promise<void> {
  const positionsToClose: string[] = [];

  for (const [symbol, position] of state.positions) {
    const data = lookbackData.get(symbol);
    if (!data || data.length === 0) continue;

    const currentPrice = data[data.length - 1].close;

    // Calculate current indicators
    const rsi = calculateRSI(data, 14);

    const daysSinceEntry = Math.floor(
      (currentDate.getTime() - position.entryDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check exit conditions
    const targetPrice = calculateTargetPrice(position.entryPrice, config.targetGainPercent);
    const stopLoss = calculateStopLoss(position.entryPrice, config.stopLossPercent);

    let shouldExit = false;

    if (rsi > config.rsiOverbought) shouldExit = true;
    if (currentPrice >= targetPrice) shouldExit = true;
    if (currentPrice <= stopLoss) shouldExit = true;
    if (daysSinceEntry >= config.maxHoldingDays) shouldExit = true;

    if (shouldExit) {
      const pnl = (currentPrice - position.entryPrice) * position.shares;
      const percentGain = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

      state.trades.push({
        id: `${symbol}-sell-${currentDate.getTime()}`,
        symbol,
        type: 'SELL',
        price: currentPrice,
        shares: position.shares,
        date: currentDate,
        pnl,
        percentGain,
      });

      state.cash += currentPrice * position.shares;
      positionsToClose.push(symbol);
    } else {
      // Update position with current price
      position.currentPrice = currentPrice;
      position.unrealizedPnL = (currentPrice - position.entryPrice) * position.shares;
      position.percentGain = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
    }
  }

  for (const symbol of positionsToClose) {
    state.positions.delete(symbol);
  }
}

async function checkEntries(
  state: BacktestState,
  lookbackData: Map<string, HistoricalDataPoint[]>,
  currentDate: Date,
  config: StrategyConfig
): Promise<void> {
  // Check if we're at max positions
  if (state.positions.size >= config.allocation.maxPositions) return;

  const opportunities: Array<{
    symbol: string;
    score: number;
    price: number;
    rsi: number;
    changePercent: number;
  }> = [];

  for (const [symbol, data] of lookbackData) {
    // Skip if already holding
    if (state.positions.has(symbol)) continue;

    if (data.length < 200) continue;

    const currentPrice = data[data.length - 1].close;
    const previousPrice = data[data.length - 2]?.close || currentPrice;
    const changePercent = ((currentPrice - previousPrice) / previousPrice) * 100;

    // Calculate indicators
    const ma200 = calculateMA(data, 200);
    const rsi = calculateRSI(data, 14);

    // Check buy conditions
    const hasDip = changePercent <= config.dipThreshold;
    const aboveMA = currentPrice > ma200;
    const isOversold = rsi < config.rsiOversold;

    if (hasDip && aboveMA && isOversold) {
      // Score based on signal strength
      const score = (config.rsiOversold - rsi) + Math.abs(changePercent);
      opportunities.push({ symbol, score, price: currentPrice, rsi, changePercent });
    }
  }

  // Sort by score and take best opportunities
  opportunities.sort((a, b) => b.score - a.score);

  const positionValue = state.cash * config.allocation.positionSize;
  const availableSlots = config.allocation.maxPositions - state.positions.size;

  for (let i = 0; i < Math.min(opportunities.length, availableSlots); i++) {
    const opp = opportunities[i];

    // Check if we have enough cash
    if (positionValue > state.cash) continue;

    const shares = Math.floor(positionValue / opp.price);
    if (shares <= 0) continue;

    const cost = shares * opp.price;

    state.positions.set(opp.symbol, {
      id: `${opp.symbol}-${currentDate.getTime()}`,
      symbol: opp.symbol,
      entryPrice: opp.price,
      currentPrice: opp.price,
      shares,
      entryDate: currentDate,
      unrealizedPnL: 0,
      percentGain: 0,
    });

    state.trades.push({
      id: `${opp.symbol}-buy-${currentDate.getTime()}`,
      symbol: opp.symbol,
      type: 'BUY',
      price: opp.price,
      shares,
      date: currentDate,
    });

    state.cash -= cost;
  }
}

function calculatePortfolioValue(
  state: BacktestState,
  lookbackData: Map<string, HistoricalDataPoint[]>
): number {
  let value = state.cash;

  for (const [symbol, position] of state.positions) {
    const data = lookbackData.get(symbol);
    if (!data || data.length === 0) {
      value += position.entryPrice * position.shares;
      continue;
    }

    const currentPrice = data[data.length - 1].close;
    value += currentPrice * position.shares;
  }

  return value;
}

function calculateBacktestMetrics(
  state: BacktestState,
  initialCapital: number
): BacktestResult {
  const finalValue = state.equityCurve.length > 0
    ? state.equityCurve[state.equityCurve.length - 1].value
    : initialCapital;

  const totalReturn = ((finalValue - initialCapital) / initialCapital) * 100;

  // Calculate annualized return
  const tradingDays = state.equityCurve.length;
  const years = tradingDays / 252;
  const annualizedReturn = years > 0
    ? (Math.pow(finalValue / initialCapital, 1 / years) - 1) * 100
    : 0;

  // Calculate daily returns for Sharpe ratio
  const dailyReturns: number[] = [];
  for (let i = 1; i < state.equityCurve.length; i++) {
    const prevValue = state.equityCurve[i - 1].value;
    const currValue = state.equityCurve[i].value;
    dailyReturns.push((currValue - prevValue) / prevValue);
  }

  const sharpeRatio = calculateSharpeRatio(dailyReturns);
  const equityValues = state.equityCurve.map(e => e.value);
  const maxDrawdown = calculateMaxDrawdown(equityValues);

  // Calculate win rate and average gains/losses
  const sellTrades = state.trades.filter(t => t.type === 'SELL');
  const profitableTrades = sellTrades.filter(t => (t.pnl || 0) > 0);

  const winRate = sellTrades.length > 0
    ? (profitableTrades.length / sellTrades.length) * 100
    : 0;

  const avgWinPercent = profitableTrades.length > 0
    ? profitableTrades.reduce((sum, t) => sum + (t.percentGain || 0), 0) / profitableTrades.length
    : 0;

  const losingTrades = sellTrades.filter(t => (t.pnl || 0) <= 0);
  const avgLossPercent = losingTrades.length > 0
    ? losingTrades.reduce((sum, t) => sum + (t.percentGain || 0), 0) / losingTrades.length
    : 0;

  return {
    totalReturn,
    annualizedReturn,
    sharpeRatio,
    maxDrawdown,
    winRate,
    avgWinPercent,
    avgLossPercent,
    totalTrades: sellTrades.length,
    profitableTrades: profitableTrades.length,
    trades: state.trades,
    equityCurve: state.equityCurve,
  };
}

/**
 * Run quick backtest on a single symbol
 */
export async function runSingleSymbolBacktest(
  symbol: string,
  historicalData: HistoricalDataPoint[],
  initialCapital: number = 10000,
  config: StrategyConfig = DEFAULT_STRATEGY_CONFIG
): Promise<BacktestResult> {
  const symbolsData = new Map<string, HistoricalDataPoint[]>();
  symbolsData.set(symbol, historicalData);

  return runBacktest(symbolsData, initialCapital, config);
}
