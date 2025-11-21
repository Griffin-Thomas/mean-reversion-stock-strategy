# Implementation Notes (Current State)

This app is already built. Below is the concrete description of how it works today, the data flow, and where to tweak behaviour.

## Stack
- React + TypeScript + Vite.
- Zustand for state.
- Recharts for charting.
- Tailwind for styling.
- IndexedDB (via `idb`) for quote/historical cache.

## Data sources (free-first)
Order of attempts in `src/services/dataFetcher.ts`:
1) **Finnhub** (only if `VITE_FINNHUB_API_KEY` is set) for quotes + fundamentals and history.
2) **Stooq** (no key, EOD) for quotes + history. Routed through the local proxy by default (`http://localhost:8787/stooq`).
3) **Yahoo Finance** (no key) for quotes + history. Routed through the local proxy by default (`http://localhost:8787`).
4) **Simulated** seeded data if all else fails or when `VITE_USE_DEMO_DATA=true`.

Caching: quotes are cached for 1 minute, history for 24 hours in IndexedDB.

## Universe (fetched)
- Top ~25 symbols from the S&P list plus explicit `AMD` (see `src/utils/constants.ts` and `src/stores/marketStore.ts`).
- Kept small to respect free-source rate limits; you can extend the slice if needed.

## Strategy (defaults in `src/utils/constants.ts`)
- **Entry (BUY)**: day's drop ≤ `dipThreshold` (-5%), price > 200-MA, RSI < `rsiOversold` (30), passes quality filters (market cap, PE, volume).
- **Exit (SELL)**: RSI > `rsiOverbought` (70), or price ≥ target (+10%), or price ≤ stop (-8%), or held ≥ 30 days.
- **Allocation**: max positions 10, 10% per position, max 30% per sector; skips symbols already held.
- **Signal strength** blends RSI, drop size, volume ratio, and trend alignment.

## UI map
- **Dashboard** (`src/components/Dashboard/Dashboard.tsx`):
  - Signals list (BUY/SELL cards with strength, entry/target/stop, reasons).
  - Chart: price + 50-day MA, volume, RSI panel (200-MA disabled visually until reliable history). Clicking movers/signals scrolls here.
  - Market overview: heatmap and top movers from the fetched subset (sorted by absolute % change).
  - Portfolio summary & quick actions (buy fixed shares, sell if held).
  - Backtest panel (runs on the fetched subset).

## Hooks/stores
- `useStockData` (Zustand store `marketStore`): fetch/subset refresh, selected symbol, signals scan.
- `usePortfolio` (`portfolioStore`): positions, trades, buy/sell, price updates.
- `useBacktest`: runs backtests on fetched history.
- Settings store: holds interval/config.

## Running locally (free data)
1) Install deps: `npm install`
2) Start proxy (Yahoo/Stooq, CORS-safe): `npm run proxy`
3) Dev server: `npm run dev` (open printed URL)
4) Env (already stubbed):  
   - `VITE_USE_DEMO_DATA=false` for real data (or `true` for simulated)  
   - `VITE_YAHOO_PROXY_URL=http://localhost:8787`  
   - `VITE_STOOQ_PROXY_URL=http://localhost:8787/stooq`  
   - `VITE_FINNHUB_API_KEY=` (optional; leave blank to stay free)

## Limitations/notes
- Free feeds are EOD; intraday moves won't appear until the next bar. Yahoo may 429; Stooq is the primary free path when no Finnhub key.
- Heatmap and movers reflect only the fetched subset, not the full S&P 500.
- Backtests run on the same subset and cached history.
- If data looks stale, clear IndexedDB (site data), restart proxy/dev server, and refresh.

## Related docs
- **Interpretation**: see `INTERPRETATION.md` for how to read signals/metrics.
- **Setup summary**: see `README.md` for quick start commands.
