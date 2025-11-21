# Mean Reversion Stock Strategy App

React/TypeScript dashboard for a "buy the dip" mean-reversion strategy on a subset of S&P 500 names. It pulls free market data (Stooq/Yahoo) or simulated data for local use. No paid API needed.

## Quick start
```bash
# 1) Install deps
npm install

# 2) Run the free-data proxy (handles CORS for Yahoo/Stooq)
npm run proxy:yahoo

# 3) In another terminal, start the app
npm run dev
# open the printed URL (default http://localhost:5173/)
```

## Environment settings
- `.env` / `.env.local` (already stubbed):
  - `VITE_USE_DEMO_DATA=false` to use real free data; set to `true` for simulated.
  - `VITE_YAHOO_PROXY_URL=http://localhost:8787` (from the proxy above).
  - `VITE_STOOQ_PROXY_URL=http://localhost:8787/stooq` (fallback with no API key).
  - `VITE_FINNHUB_API_KEY=` leave blank unless you have a key (Finnhub is optional).

## Data flow (free)
1) App calls the proxy at `http://localhost:8787/...`
2) Proxy forwards to:
   - Yahoo Finance for quotes/history (may rate limit with 429 responses), and
   - Stooq for quotes/history (no key, EOD) as the first fallback when no Finnhub key.
3) If both fail, the app uses consistent simulated data so the UI stays usable.

## What you'll see
- Signals list (BUY/SELL with strength, entry/target/stop, reasons).
- Chart with price, 50-day MA, volume, RSI panel; quick actions to buy/sell.
- Heatmap and top movers (from the fetched subset) — click to load the chart.
- Portfolio summary, P&L, and backtest results when run.
For a deep dive on how to read these, see `docs/INTERPRETATION.md`.

## Strategy behavior
- Entry: dip ≥ threshold, price above 200-MA, RSI < oversold, passes quality filters.
- Exit: RSI > overbought, hit target, hit stop, or max holding days.
- Allocation: caps positions/sector exposure and skips symbols already held.
  Full implementation outline and structure live in `docs/IMPLEMENTATION.md`.

## Scripts
- `npm run dev` – start Vite dev server.
- `npm run proxy:yahoo` – start the local proxy (Yahoo/Stooq).
- `npm run lint` – lint.
- `npm run build` – build for production.

## Notes
- The app fetches a limited set (top ~25 + AMD) to respect free data limits.
- If data looks stale or empty, restart the proxy and dev server, then hard refresh to clear cached responses/IndexedDB.
