import { StrategyConfig } from '../types';

// S&P 500 constituent symbols (top 100 for demo purposes)
export const SP500_SYMBOLS = [
  'AAPL', 'MSFT', 'AMZN', 'NVDA', 'GOOGL', 'META', 'TSLA', 'BRK-B', 'UNH', 'JNJ',
  'XOM', 'JPM', 'V', 'PG', 'MA', 'HD', 'CVX', 'MRK', 'ABBV', 'LLY',
  'PEP', 'KO', 'COST', 'AVGO', 'WMT', 'MCD', 'CSCO', 'TMO', 'ACN', 'ABT',
  'DHR', 'NEE', 'VZ', 'ADBE', 'CMCSA', 'NKE', 'PM', 'TXN', 'CRM', 'UPS',
  'RTX', 'BMY', 'ORCL', 'HON', 'QCOM', 'INTC', 'IBM', 'LOW', 'AMGN', 'UNP',
  'AMD', 'CAT', 'SPGI', 'BA', 'GE', 'SBUX', 'INTU', 'DE', 'PLD', 'GILD',
  'MDLZ', 'BLK', 'ISRG', 'CVS', 'AXP', 'ADI', 'NOW', 'VRTX', 'BKNG', 'LMT',
  'TMUS', 'MMC', 'REGN', 'CI', 'MO', 'DUK', 'SO', 'ZTS', 'CME', 'SYK',
  'CL', 'BDX', 'EQIX', 'TGT', 'ITW', 'AON', 'SCHW', 'CB', 'PNC', 'MU',
  'ATVI', 'CSX', 'NOC', 'HUM', 'FIS', 'FISV', 'NSC', 'EW', 'USB', 'DG'
];

// Sector mappings
export const SECTOR_MAP: Record<string, string> = {
  'AAPL': 'Technology', 'MSFT': 'Technology', 'NVDA': 'Technology', 'GOOGL': 'Technology',
  'META': 'Technology', 'AVGO': 'Technology', 'CSCO': 'Technology', 'ADBE': 'Technology',
  'CRM': 'Technology', 'ORCL': 'Technology', 'INTC': 'Technology', 'AMD': 'Technology',
  'QCOM': 'Technology', 'TXN': 'Technology', 'IBM': 'Technology', 'NOW': 'Technology',
  'INTU': 'Technology', 'ADI': 'Technology', 'MU': 'Technology',

  'AMZN': 'Consumer Discretionary', 'TSLA': 'Consumer Discretionary', 'HD': 'Consumer Discretionary',
  'MCD': 'Consumer Discretionary', 'NKE': 'Consumer Discretionary', 'LOW': 'Consumer Discretionary',
  'SBUX': 'Consumer Discretionary', 'BKNG': 'Consumer Discretionary', 'TGT': 'Consumer Discretionary',

  'BRK-B': 'Financials', 'JPM': 'Financials', 'V': 'Financials', 'MA': 'Financials',
  'BLK': 'Financials', 'AXP': 'Financials', 'MMC': 'Financials', 'SCHW': 'Financials',
  'CB': 'Financials', 'PNC': 'Financials', 'AON': 'Financials', 'CME': 'Financials',
  'SPGI': 'Financials', 'USB': 'Financials',

  'UNH': 'Healthcare', 'JNJ': 'Healthcare', 'MRK': 'Healthcare', 'ABBV': 'Healthcare',
  'LLY': 'Healthcare', 'TMO': 'Healthcare', 'ABT': 'Healthcare', 'DHR': 'Healthcare',
  'BMY': 'Healthcare', 'AMGN': 'Healthcare', 'GILD': 'Healthcare', 'ISRG': 'Healthcare',
  'CVS': 'Healthcare', 'VRTX': 'Healthcare', 'REGN': 'Healthcare', 'CI': 'Healthcare',
  'ZTS': 'Healthcare', 'SYK': 'Healthcare', 'BDX': 'Healthcare', 'EW': 'Healthcare',
  'HUM': 'Healthcare',

  'XOM': 'Energy', 'CVX': 'Energy',

  'PG': 'Consumer Staples', 'PEP': 'Consumer Staples', 'KO': 'Consumer Staples',
  'COST': 'Consumer Staples', 'WMT': 'Consumer Staples', 'PM': 'Consumer Staples',
  'MDLZ': 'Consumer Staples', 'MO': 'Consumer Staples', 'CL': 'Consumer Staples',
  'DG': 'Consumer Staples',

  'NEE': 'Utilities', 'DUK': 'Utilities', 'SO': 'Utilities',

  'RTX': 'Industrials', 'HON': 'Industrials', 'UPS': 'Industrials', 'UNP': 'Industrials',
  'CAT': 'Industrials', 'BA': 'Industrials', 'GE': 'Industrials', 'DE': 'Industrials',
  'LMT': 'Industrials', 'ITW': 'Industrials', 'CSX': 'Industrials', 'NOC': 'Industrials',
  'NSC': 'Industrials',

  'VZ': 'Communication Services', 'CMCSA': 'Communication Services', 'TMUS': 'Communication Services',

  'PLD': 'Real Estate', 'EQIX': 'Real Estate',

  'FIS': 'Information Technology', 'FISV': 'Information Technology', 'ACN': 'Information Technology'
};

// Default strategy configuration
export const DEFAULT_STRATEGY_CONFIG: StrategyConfig = {
  dipThreshold: -5,
  rsiOversold: 30,
  rsiOverbought: 70,
  trendFilterMA: 200,
  targetGainPercent: 10,
  stopLossPercent: 8,
  maxHoldingDays: 30,
  qualityFilters: {
    minMarketCap: 10_000_000_000, // $10B
    maxPERatio: 35,
    minVolume: 1_000_000, // 1M shares
  },
  allocation: {
    maxPositions: 10,
    positionSize: 0.1, // 10%
    maxSectorExposure: 0.3, // 30%
  },
};

// Cache durations (in milliseconds)
export const CACHE_DURATIONS = {
  QUOTE: 60 * 1000, // 1 minute
  HISTORICAL: 24 * 60 * 60 * 1000, // 24 hours
  SP500_LIST: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// API rate limiting
export const API_RATE_LIMIT = {
  REQUESTS_PER_MINUTE: 5,
  DELAY_BETWEEN_REQUESTS: 500, // ms
};

// Chart colors
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  ma50: '#8b5cf6',
  ma200: '#f97316',
  volume: '#94a3b8',
};
