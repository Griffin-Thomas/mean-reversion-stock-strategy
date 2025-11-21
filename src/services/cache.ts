import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { StockData, HistoricalDataPoint, CachedData } from '../types';
import { CACHE_DURATIONS } from '../utils/constants';

interface StockStrategyDB extends DBSchema {
  quotes: {
    key: string;
    value: CachedData<StockData>;
  };
  historical: {
    key: string;
    value: CachedData<HistoricalDataPoint[]>;
  };
  signals: {
    key: string;
    value: CachedData<unknown>;
  };
}

let dbInstance: IDBPDatabase<StockStrategyDB> | null = null;

async function getDB(): Promise<IDBPDatabase<StockStrategyDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<StockStrategyDB>('stock-strategy-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('quotes')) {
        db.createObjectStore('quotes');
      }
      if (!db.objectStoreNames.contains('historical')) {
        db.createObjectStore('historical');
      }
      if (!db.objectStoreNames.contains('signals')) {
        db.createObjectStore('signals');
      }
    },
  });

  return dbInstance;
}

export async function getCachedQuote(symbol: string): Promise<StockData | null> {
  const db = await getDB();
  const cached = await db.get('quotes', symbol);

  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    await db.delete('quotes', symbol);
    return null;
  }

  return cached.data;
}

export async function setCachedQuote(symbol: string, data: StockData): Promise<void> {
  const db = await getDB();
  const cached: CachedData<StockData> = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_DURATIONS.QUOTE,
  };
  await db.put('quotes', cached, symbol);
}

export async function getCachedHistorical(symbol: string): Promise<HistoricalDataPoint[] | null> {
  const db = await getDB();
  const cached = await db.get('historical', symbol);

  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    await db.delete('historical', symbol);
    return null;
  }

  return cached.data;
}

export async function setCachedHistorical(
  symbol: string,
  data: HistoricalDataPoint[]
): Promise<void> {
  const db = await getDB();
  const cached: CachedData<HistoricalDataPoint[]> = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_DURATIONS.HISTORICAL,
  };
  await db.put('historical', cached, symbol);
}

export async function clearCache(): Promise<void> {
  const db = await getDB();
  await db.clear('quotes');
  await db.clear('historical');
  await db.clear('signals');
}

export async function clearExpiredCache(): Promise<void> {
  const db = await getDB();
  const now = Date.now();

  // Clear expired quotes
  const quoteKeys = await db.getAllKeys('quotes');
  for (const key of quoteKeys) {
    const cached = await db.get('quotes', key);
    if (cached && now > cached.expiresAt) {
      await db.delete('quotes', key);
    }
  }

  // Clear expired historical data
  const historicalKeys = await db.getAllKeys('historical');
  for (const key of historicalKeys) {
    const cached = await db.get('historical', key);
    if (cached && now > cached.expiresAt) {
      await db.delete('historical', key);
    }
  }
}
