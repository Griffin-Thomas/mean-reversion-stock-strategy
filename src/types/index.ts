// Core data models
export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  ma200: number;
  ma50: number;
  rsi: number;
  marketCap: number;
  peRatio: number;
  timestamp: Date;
  historicalData?: HistoricalDataPoint[];
}

export interface HistoricalDataPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradingSignal {
  id: string;
  symbol: string;
  signalType: 'BUY' | 'SELL' | 'HOLD';
  signalStrength: number; // 0-100
  reasons: string[];
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  timestamp: Date;
}

// Strategy configuration
export interface StrategyConfig {
  dipThreshold: number;        // Default: -5%
  rsiOversold: number;         // Default: 30
  rsiOverbought: number;       // Default: 70
  trendFilterMA: number;       // Default: 200
  targetGainPercent: number;   // Default: 10%
  stopLossPercent: number;     // Default: 8%
  maxHoldingDays: number;      // Default: 30
  qualityFilters: {
    minMarketCap: number;      // Default: $10B
    maxPERatio: number;        // Default: 35
    minVolume: number;         // Default: 1M shares
  };
  allocation: {
    maxPositions: number;      // Default: 10
    positionSize: number;      // Default: 10% of capital
    maxSectorExposure: number; // Default: 30%
  };
}

// Portfolio models
export interface Position {
  id: string;
  symbol: string;
  entryPrice: number;
  currentPrice: number;
  shares: number;
  entryDate: Date;
  unrealizedPnL: number;
  percentGain: number;
  sector?: string;
}

export interface Portfolio {
  positions: Position[];
  cash: number;
  totalValue: number;
  dailyPnL: number;
  totalPnL: number;
  initialCapital: number;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  price: number;
  shares: number;
  date: Date;
  pnl?: number;
  percentGain?: number;
}

// Backtesting models
export interface BacktestResult {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  avgWinPercent: number;
  avgLossPercent: number;
  totalTrades: number;
  profitableTrades: number;
  trades: Trade[];
  equityCurve: { date: Date; value: number }[];
}

// Risk metrics
export interface RiskMetrics {
  portfolioBeta: number;
  valueAtRisk: number;
  sectorExposure: Map<string, number>;
}

// Sector information
export interface SectorData {
  name: string;
  performance: number;
  stocks: string[];
}

// Cache models
export interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}
