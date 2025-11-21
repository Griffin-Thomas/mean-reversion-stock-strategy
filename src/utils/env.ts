const stripTrailingSlash = (value: string): string =>
  value.endsWith('/') ? value.slice(0, -1) : value;

const rawUseDemo = import.meta.env.VITE_USE_DEMO_DATA;
const rawProxy = import.meta.env.VITE_YAHOO_PROXY_URL;
const rawFinnhubKey = import.meta.env.VITE_FINNHUB_API_KEY;
const rawStooqProxy = import.meta.env.VITE_STOOQ_PROXY_URL;

export const APP_CONFIG = {
  useDemoData: rawUseDemo ? rawUseDemo.toLowerCase() !== 'false' : true,
  yahooBaseUrl: rawProxy ? stripTrailingSlash(rawProxy) : 'https://query1.finance.yahoo.com',
  stooqBaseUrl: rawStooqProxy ? stripTrailingSlash(rawStooqProxy) : 'https://stooq.pl',
  finnhubApiKey: rawFinnhubKey || '',
};

export const isDemoMode = (): boolean => APP_CONFIG.useDemoData;
