import { Portfolio, Position, Trade, StockData } from '../types';
import { SECTOR_MAP } from '../utils/constants';

/**
 * Create a new empty portfolio
 */
export function createPortfolio(initialCash: number = 100000): Portfolio {
  return {
    positions: [],
    cash: initialCash,
    totalValue: initialCash,
    dailyPnL: 0,
    totalPnL: 0,
    initialCapital: initialCash,
  };
}

/**
 * Add a new position to the portfolio
 */
export function addPosition(
  portfolio: Portfolio,
  symbol: string,
  price: number,
  shares: number
): { portfolio: Portfolio; trade: Trade } {
  const cost = price * shares;

  if (cost > portfolio.cash) {
    throw new Error(`Insufficient cash. Need $${cost.toFixed(2)}, have $${portfolio.cash.toFixed(2)}`);
  }

  const position: Position = {
    id: `${symbol}-${Date.now()}`,
    symbol,
    entryPrice: price,
    currentPrice: price,
    shares,
    entryDate: new Date(),
    unrealizedPnL: 0,
    percentGain: 0,
    sector: SECTOR_MAP[symbol] || 'Other',
  };

  const trade: Trade = {
    id: `trade-${symbol}-${Date.now()}`,
    symbol,
    type: 'BUY',
    price,
    shares,
    date: new Date(),
  };

  return {
    portfolio: {
      ...portfolio,
      positions: [...portfolio.positions, position],
      cash: portfolio.cash - cost,
      initialCapital: portfolio.initialCapital,
    },
    trade,
  };
}

/**
 * Close a position in the portfolio
 */
export function closePosition(
  portfolio: Portfolio,
  positionId: string,
  sellPrice: number
): { portfolio: Portfolio; trade: Trade } {
  const position = portfolio.positions.find(p => p.id === positionId);

  if (!position) {
    throw new Error(`Position ${positionId} not found`);
  }

  const proceeds = sellPrice * position.shares;
  const pnl = proceeds - (position.entryPrice * position.shares);
  const percentGain = ((sellPrice - position.entryPrice) / position.entryPrice) * 100;

  const trade: Trade = {
    id: `trade-${position.symbol}-${Date.now()}`,
    symbol: position.symbol,
    type: 'SELL',
    price: sellPrice,
    shares: position.shares,
    date: new Date(),
    pnl,
    percentGain,
  };

  return {
    portfolio: {
      ...portfolio,
      positions: portfolio.positions.filter(p => p.id !== positionId),
      cash: portfolio.cash + proceeds,
      totalPnL: portfolio.totalPnL + pnl,
      initialCapital: portfolio.initialCapital,
    },
    trade,
  };
}

/**
 * Update portfolio with current market prices
 */
export function updatePortfolio(
  portfolio: Portfolio,
  stocksData: Map<string, StockData>
): Portfolio {
  let totalValue = portfolio.cash;
  let dailyPnL = 0;

  const updatedPositions = portfolio.positions.map(position => {
    const stockData = stocksData.get(position.symbol);

    if (!stockData) {
      totalValue += position.currentPrice * position.shares;
      return position;
    }

    const currentPrice = stockData.price;
    const unrealizedPnL = (currentPrice - position.entryPrice) * position.shares;
    const percentGain = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
    const dailyChange = stockData.change * position.shares;

    totalValue += currentPrice * position.shares;
    dailyPnL += dailyChange;

    return {
      ...position,
      currentPrice,
      unrealizedPnL,
      percentGain,
    };
  });

  return {
    ...portfolio,
    positions: updatedPositions,
    totalValue,
    dailyPnL,
    initialCapital: portfolio.initialCapital,
  };
}

/**
 * Calculate portfolio statistics
 */
export function calculatePortfolioStats(portfolio: Portfolio): {
  totalPositions: number;
  totalInvested: number;
  unrealizedPnL: number;
  realizedPnL: number;
  cashPercent: number;
  sectors: Map<string, number>;
} {
  let totalInvested = 0;
  let unrealizedPnL = 0;
  const sectors = new Map<string, number>();

  for (const position of portfolio.positions) {
    const invested = position.entryPrice * position.shares;
    totalInvested += invested;
    unrealizedPnL += position.unrealizedPnL;

    const sector = position.sector || 'Other';
    const currentSectorValue = sectors.get(sector) || 0;
    sectors.set(sector, currentSectorValue + position.currentPrice * position.shares);
  }

  // Convert sector values to percentages
  const totalPositionValue = portfolio.totalValue - portfolio.cash;
  for (const [sector, value] of sectors) {
    sectors.set(sector, totalPositionValue > 0 ? value / totalPositionValue : 0);
  }

  return {
    totalPositions: portfolio.positions.length,
    totalInvested,
    unrealizedPnL,
    realizedPnL: portfolio.totalPnL,
    cashPercent: portfolio.cash / portfolio.totalValue,
    sectors,
  };
}

/**
 * Get positions sorted by various criteria
 */
export function getSortedPositions(
  positions: Position[],
  sortBy: 'percentGain' | 'unrealizedPnL' | 'entryDate' | 'symbol' = 'percentGain',
  ascending: boolean = false
): Position[] {
  const sorted = [...positions].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'percentGain':
        comparison = a.percentGain - b.percentGain;
        break;
      case 'unrealizedPnL':
        comparison = a.unrealizedPnL - b.unrealizedPnL;
        break;
      case 'entryDate':
        comparison = a.entryDate.getTime() - b.entryDate.getTime();
        break;
      case 'symbol':
        comparison = a.symbol.localeCompare(b.symbol);
        break;
    }

    return ascending ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Calculate position size for new trade
 */
export function calculateNewPositionSize(
  portfolio: Portfolio,
  price: number,
  positionSizePercent: number
): number {
  const positionValue = portfolio.totalValue * positionSizePercent;
  return Math.floor(positionValue / price);
}

/**
 * Check if can add new position
 */
export function canAddPosition(
  portfolio: Portfolio,
  price: number,
  shares: number,
  maxPositions: number
): { canAdd: boolean; reason?: string } {
  if (portfolio.positions.length >= maxPositions) {
    return { canAdd: false, reason: `Already at max positions (${maxPositions})` };
  }

  const cost = price * shares;
  if (cost > portfolio.cash) {
    return { canAdd: false, reason: `Insufficient cash ($${portfolio.cash.toFixed(2)} available)` };
  }

  return { canAdd: true };
}

/**
 * Get top performing positions
 */
export function getTopPerformers(
  positions: Position[],
  count: number = 5
): Position[] {
  return getSortedPositions(positions, 'percentGain', false).slice(0, count);
}

/**
 * Get worst performing positions
 */
export function getWorstPerformers(
  positions: Position[],
  count: number = 5
): Position[] {
  return getSortedPositions(positions, 'percentGain', true).slice(0, count);
}
