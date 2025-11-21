import { StockData, HistoricalDataPoint } from '../types/index.ts';
import { calculateMA, calculateRSI, calculatePercentChange } from '../utils/calculations';
import { getCachedQuote, setCachedQuote, getCachedHistorical, setCachedHistorical } from './cache';
import { API_RATE_LIMIT } from '../utils/constants';
import { APP_CONFIG } from '../utils/env';

// Rate limiting queue
let lastRequestTime = 0;
const requestQueue: (() => void)[] = [];
let isProcessingQueue = false;

async function rateLimitedRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;

        if (timeSinceLastRequest < API_RATE_LIMIT.DELAY_BETWEEN_REQUESTS) {
          await new Promise(r => setTimeout(r, API_RATE_LIMIT.DELAY_BETWEEN_REQUESTS - timeSinceLastRequest));
        }

        lastRequestTime = Date.now();
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    processQueue();
  });
}

async function processQueue(): Promise<void> {
  if (isProcessingQueue || requestQueue.length === 0) return;

  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      await request();
    }
  }

  isProcessingQueue = false;
}

const USE_DEMO_DATA = APP_CONFIG.useDemoData;
const MAX_RATE_LIMIT_RETRIES = 3;
const RATE_LIMIT_BACKOFF_MS = 1000;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const YAHOO_BASE_URL = APP_CONFIG.yahooBaseUrl;
const STOOQ_BASE_URL = APP_CONFIG.stooqBaseUrl;

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

async function fetchFromFinnhub<T>(
  path: string,
  params: Record<string, string | number> = {},
  attempt: number = 0
): Promise<T> {
  if (!APP_CONFIG.finnhubApiKey) {
    throw new Error('Missing Finnhub API key. Set VITE_FINNHUB_API_KEY.');
  }

  const query = new URLSearchParams({
    ...Object.keys(params).reduce((acc, key) => {
      acc[key] = String(params[key]);
      return acc;
    }, {} as Record<string, string>),
    token: APP_CONFIG.finnhubApiKey,
  });

  const url = `${FINNHUB_BASE_URL}${path}?${query.toString()}`;
  const response = await fetch(url);

  if (response.status === 429) {
    if (attempt < MAX_RATE_LIMIT_RETRIES) {
      await delay(RATE_LIMIT_BACKOFF_MS * (attempt + 1));
      return fetchFromFinnhub(path, params, attempt + 1);
    }
    throw new Error('Finnhub rate limit exceeded');
  }

  if (!response.ok) {
    throw new Error(`Finnhub request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

async function fetchFinnhubQuote(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}> {
  const data = await fetchFromFinnhub<{
    c: number;
    d: number;
    dp: number;
    v: number;
  }>('/quote', { symbol });

  return {
    price: data.c,
    change: data.d,
    changePercent: data.dp,
    volume: data.v,
  };
}

async function fetchFinnhubMetrics(symbol: string): Promise<{
  marketCap: number;
  peRatio: number;
}> {
  const data = await fetchFromFinnhub<{
    metric: {
      marketCapitalization?: number;
      peBasicExclExtraTTM?: number;
    };
  }>('/stock/metric', { symbol, metric: 'valuation' });

  return {
    marketCap: data.metric.marketCapitalization ?? 0,
    peRatio: data.metric.peBasicExclExtraTTM ?? 0,
  };
}

async function fetchFinnhubHistorical(symbol: string, days: number = 400): Promise<HistoricalDataPoint[]> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const fromSeconds = nowSeconds - (days * 24 * 60 * 60);

  const data = await fetchFromFinnhub<{
    c: number[];
    h: number[];
    l: number[];
    o: number[];
    v: number[];
    t: number[];
    s: string;
  }>('/stock/candle', {
    symbol,
    resolution: 'D',
    from: fromSeconds,
    to: nowSeconds,
  });

  if (data.s !== 'ok' || !Array.isArray(data.t)) {
    throw new Error(`Finnhub historical data unavailable for ${symbol}`);
  }

  const historicalData: HistoricalDataPoint[] = [];
  for (let i = 0; i < data.t.length; i++) {
    historicalData.push({
      date: new Date(data.t[i] * 1000),
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i],
    });
  }

  return historicalData;
}

function buildYahooUrl(path: string, params: Record<string, string | number> = {}): string {
  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {} as Record<string, string>)
  );

  return `${YAHOO_BASE_URL}${path}?${query.toString()}`;
}

async function fetchFromYahoo<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = buildYahooUrl(path, params);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

async function fetchYahooQuote(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
}> {
  const data = await fetchFromYahoo<{
    quoteResponse: {
      result: Array<{
        regularMarketPrice?: number;
        regularMarketChange?: number;
        regularMarketChangePercent?: number;
        regularMarketVolume?: number;
        marketCap?: number;
        trailingPE?: number;
        forwardPE?: number;
      }>;
    };
  }>('/v6/finance/quote', { symbols: symbol });

  const quote = data.quoteResponse?.result?.[0];
  if (!quote) {
    throw new Error(`No Yahoo Finance data found for ${symbol}`);
  }

  return {
    price: quote.regularMarketPrice ?? 0,
    change: quote.regularMarketChange ?? 0,
    changePercent: quote.regularMarketChangePercent ?? 0,
    volume: quote.regularMarketVolume ?? 0,
    marketCap: quote.marketCap ?? 0,
    peRatio: quote.trailingPE ?? quote.forwardPE ?? 0,
  };
}

async function fetchYahooHistorical(symbol: string, days: number = 400): Promise<HistoricalDataPoint[]> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const fromSeconds = nowSeconds - (days * 24 * 60 * 60);

  const data = await fetchFromYahoo<{
    chart: {
      result?: Array<{
        timestamp?: number[];
        indicators?: {
          quote?: Array<{
            open?: Array<number | null>;
            high?: Array<number | null>;
            low?: Array<number | null>;
            close?: Array<number | null>;
            volume?: Array<number | null>;
          }>;
        };
      }>;
      error?: unknown;
    };
  }>(`/v8/finance/chart/${encodeURIComponent(symbol)}`, {
    period1: fromSeconds,
    period2: nowSeconds,
    interval: '1d',
    includePrePost: false,
    events: 'div,splits',
  });

  const result = data.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  const timestamps = result?.timestamp;

  if (!result || !quote || !timestamps || timestamps.length === 0) {
    throw new Error(`Yahoo Finance historical data unavailable for ${symbol}`);
  }

  const historicalData: HistoricalDataPoint[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const open = quote.open?.[i];
    const high = quote.high?.[i];
    const low = quote.low?.[i];
    const close = quote.close?.[i];
    const volume = quote.volume?.[i];

    if (
      open == null ||
      high == null ||
      low == null ||
      close == null ||
      volume == null
    ) {
      continue;
    }

    historicalData.push({
      date: new Date(timestamps[i] * 1000),
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return historicalData;
}

function buildStooqSymbol(symbol: string): string {
  return `${symbol.toLowerCase()}.us`;
}

async function fetchFromStooq<T>(path: string): Promise<T> {
  const url = `${STOOQ_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { accept: 'application/json,text/csv,*/*;q=0.1' },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`Stooq request failed (${response.status})`);
  }
  return response.text() as unknown as Promise<T>;
}

async function fetchStooqQuote(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
}> {
  const stooqSymbol = buildStooqSymbol(symbol);
  const raw = await fetchFromStooq<string>(
    `/q/l/?s=${encodeURIComponent(stooqSymbol)}&f=sd2t2ohlcv&h&e=json`
  );

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid Stooq JSON for ${symbol}: ${error}`);
  }

  const quote = (parsed as { symbols?: Array<Record<string, unknown>> })?.symbols?.[0];
  const close = Number(quote?.close);
  if (!quote || Number.isNaN(close)) {
    throw new Error(`No Stooq quote for ${symbol}`);
  }

  return {
    price: close,
    change: 0,
    changePercent: 0,
    volume: Number(quote.volume) || 0,
    // Stooq does not provide fundamentals; use reasonable defaults to avoid failing quality filter
    marketCap: 100_000_000_000,
    peRatio: 20,
  };
}

async function fetchStooqHistorical(symbol: string, days: number = 400): Promise<HistoricalDataPoint[]> {
  const stooqSymbol = buildStooqSymbol(symbol);
  const csv = await fetchFromStooq<string>(
    `/q/d/l/?s=${encodeURIComponent(stooqSymbol)}&i=d`
  );

  const lines = csv.trim().split('\n');
  if (lines.length <= 1) {
    throw new Error(`Empty Stooq CSV for ${symbol}`);
  }

  const data: HistoricalDataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 6) continue;

    const [dateStr, openStr, highStr, lowStr, closeStr, volumeStr] = parts;
    const date = new Date(dateStr);
    const open = parseFloat(openStr);
    const high = parseFloat(highStr);
    const low = parseFloat(lowStr);
    const close = parseFloat(closeStr);
    const volume = parseFloat(volumeStr);

    if ([open, high, low, close, volume].some(v => Number.isNaN(v))) continue;

    data.push({
      date,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  const limited = data.slice(-days);
  return limited;
}

// Seeded random number generator for consistent simulated data
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Simulated data generators for demo/development
function generateSimulatedQuote(symbol: string): {
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
} {
  // Use symbol hash for consistent "random" values
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  // Include day of year for daily variation
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const seed = hash + dayOfYear;

  const basePrice = 100 + (hash % 400);
  const change = (seededRandom(seed) - 0.5) * 10;

  return {
    price: basePrice + change,
    change,
    changePercent: (change / basePrice) * 100,
    volume: 1000000 + seededRandom(seed + 1) * 50000000,
    marketCap: 10000000000 + (hash % 100) * 10000000000,
    peRatio: 10 + seededRandom(seed + 2) * 30,
  };
}

function generateSimulatedHistorical(symbol: string, days: number): HistoricalDataPoint[] {
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  let basePrice = 100 + (hash % 400);

  const data: HistoricalDataPoint[] = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // Use seeded random for consistent historical data
    const daySeed = hash + i;
    const change = (seededRandom(daySeed) - 0.48) * 3; // Slight upward bias
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) + seededRandom(daySeed + 1) * 2;
    const low = Math.min(open, close) - seededRandom(daySeed + 2) * 2;

    data.push({
      date,
      open,
      high,
      low,
      close,
      volume: 1000000 + seededRandom(daySeed + 3) * 10000000,
    });

    basePrice = close;
  }

  return data;
}

function buildSimulatedPrice(symbol: string) {
  const simulated = generateSimulatedQuote(symbol);
  return {
    price: simulated.price,
    change: simulated.change,
    changePercent: simulated.changePercent,
    volume: simulated.volume,
    marketCap: simulated.marketCap,
    peRatio: simulated.peRatio,
  };
}

export async function fetchStockData(symbol: string): Promise<StockData> {
  // Check cache first
  const cached = await getCachedQuote(symbol);
  if (cached) return cached;

  return rateLimitedRequest(async () => {
    const historicalPromise = fetchHistoricalData(symbol);
    const hasFinnhub = Boolean(APP_CONFIG.finnhubApiKey);

    let priceData: {
      price: number;
      change: number;
      changePercent: number;
      volume: number;
    } | null = null;
    let fundamentals: { marketCap: number; peRatio: number } | null = null;

    if (USE_DEMO_DATA) {
      const simulated = buildSimulatedPrice(symbol);
      priceData = {
        price: simulated.price,
        change: simulated.change,
        changePercent: simulated.changePercent,
        volume: simulated.volume,
      };
      fundamentals = {
        marketCap: simulated.marketCap,
        peRatio: simulated.peRatio,
      };
    } else {
      if (hasFinnhub) {
        try {
          const [quote, metrics] = await Promise.all([
            fetchFinnhubQuote(symbol),
            fetchFinnhubMetrics(symbol),
          ]);
          priceData = quote;
          fundamentals = metrics;
        } catch (error) {
          console.warn(`Finnhub quote failed for ${symbol}, trying Yahoo Finance:`, error);
        }
      }

      // Try Stooq first when we don't have Finnhub to avoid Yahoo 429s
      if (!hasFinnhub && (!priceData || !fundamentals)) {
        try {
          const stooqQuote = await fetchStooqQuote(symbol);
          priceData = {
            price: stooqQuote.price,
            change: stooqQuote.change,
            changePercent: stooqQuote.changePercent,
            volume: stooqQuote.volume,
          };
          fundamentals = {
            marketCap: stooqQuote.marketCap,
            peRatio: stooqQuote.peRatio,
          };
        } catch (error) {
          console.warn(`Stooq quote failed for ${symbol}, trying Yahoo Finance:`, error);
        }
      }

      if (!priceData || !fundamentals) {
        try {
          const yahooQuote = await fetchYahooQuote(symbol);
          priceData = {
            price: yahooQuote.price,
            change: yahooQuote.change,
            changePercent: yahooQuote.changePercent,
            volume: yahooQuote.volume,
          };
          fundamentals = {
            marketCap: yahooQuote.marketCap,
            peRatio: yahooQuote.peRatio,
          };
        } catch (error) {
          console.warn(`Falling back to simulated price data for ${symbol}:`, error);
        }
      }

      if (!priceData || !fundamentals) {
        const simulated = buildSimulatedPrice(symbol);
        priceData = {
          price: simulated.price,
          change: simulated.change,
          changePercent: simulated.changePercent,
          volume: simulated.volume,
        };
        fundamentals = {
          marketCap: simulated.marketCap,
          peRatio: simulated.peRatio,
        };
      }
    }

    const historical = await historicalPromise;
    let price = priceData.price;
    let change = priceData.change;
    let changePercent = priceData.changePercent;

    if (historical.length >= 2) {
      const prevClose = historical[historical.length - 2].close;
      const latestClose = historical[historical.length - 1].close;
      price = latestClose;
      change = latestClose - prevClose;
      changePercent = calculatePercentChange(latestClose, prevClose);
    }

    // Calculate technical indicators
    const ma200 = calculateMA(historical, 200);
    const ma50 = calculateMA(historical, 50);
    const rsi = calculateRSI(historical, 14);

    const stockData: StockData = {
      symbol,
      price,
      change,
      changePercent,
      volume: priceData.volume,
      ma200,
      ma50,
      rsi,
      marketCap: fundamentals.marketCap,
      peRatio: fundamentals.peRatio,
      timestamp: new Date(),
      historicalData: historical,
    };

    // Cache the result
    await setCachedQuote(symbol, stockData);

    return stockData;
  });
}

export async function fetchHistoricalData(
  symbol: string,
  days: number = 400
): Promise<HistoricalDataPoint[]> {
  // Check cache first
  const cached = await getCachedHistorical(symbol);
  const minRequired = Math.min(days * 0.6, 240);
  if (cached && cached.length >= minRequired) return cached;

  let historical: HistoricalDataPoint[] = [];
  const hasFinnhub = Boolean(APP_CONFIG.finnhubApiKey);

  if (USE_DEMO_DATA) {
    historical = generateSimulatedHistorical(symbol, days);
  } else {
    if (hasFinnhub) {
      try {
        historical = await fetchFinnhubHistorical(symbol, days);
      } catch (error) {
        console.warn(`Finnhub historical failed for ${symbol}, trying Yahoo Finance:`, error);
      }
    }

    // Try Stooq first when we don't have Finnhub to avoid Yahoo 429s
    if (!hasFinnhub && historical.length === 0) {
      try {
        historical = await fetchStooqHistorical(symbol, days);
      } catch (error) {
        console.warn(`Stooq historical failed for ${symbol}, trying Yahoo Finance:`, error);
      }
    }

    if (historical.length === 0) {
      try {
        historical = await fetchYahooHistorical(symbol, days);
      } catch (error) {
        console.warn(`Falling back to simulated historical data for ${symbol}:`, error);
      }
    }

    if (historical.length === 0) {
      historical = generateSimulatedHistorical(symbol, days);
    }
  }

  if (historical.length < 220) {
    console.warn(`Insufficient historical data for ${symbol}: received ${historical.length} points`);
  }

  // Cache the result
  await setCachedHistorical(symbol, historical);

  return historical;
}

export async function fetchMultipleStocks(symbols: string[]): Promise<Map<string, StockData>> {
  const results = new Map<string, StockData>();

  // Process in batches to respect rate limits
  const batchSize = 5;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(symbol =>
        fetchStockData(symbol).catch(error => {
          console.error(`Error fetching ${symbol}:`, error);
          return null;
        })
      )
    );

    batchResults.forEach(result => {
      if (result) {
        results.set(result.symbol, result);
      }
    });
  }

  return results;
}
