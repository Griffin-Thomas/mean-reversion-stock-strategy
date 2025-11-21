/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_DEMO_DATA?: string;
  readonly VITE_YAHOO_PROXY_URL?: string;
  readonly VITE_FINNHUB_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
