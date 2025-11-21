# How to read the app

## Trading signals
- **Signal card**: `SYMBOL BUY/SELL`, `Strength %` (0–100: higher = more conviction), `Entry` (current/assumed entry price), `Target` (profit-taking level), `Stop Loss` (protective exit).
- **Why it triggered**: bullet list shows checks that passed/failed vs the strategy config (e.g., "Dropped -7.82% (threshold: -5%)", "Price above 200-MA", "RSI < oversold"). If a condition fails, it won't appear as a BUY.
- **Timing**: timestamp shows when the scan ran; signals refresh each data refresh.

## Price & technicals
- **Chart**: last ~120 trading days. Blue line = price. Purple dashed = 50‑day MA (trend/mean anchor). (200‑day MA is disabled until enough reliable history is available from the free feed.)
- **Volume bars** (right axis): share volume per day (K/M/B). Spikes can confirm capitulation or interest.
- **RSI panel**: momentum/mean-reversion gauge (0–100). <30 = oversold, >70 = overbought. The strategy uses RSI to gate entries/exits.

## Strategy logic (defaults)
- **Entry (BUY)**: day's drop ≤ -5%, price above 200‑MA (uptrend), RSI < 30 (oversold), passes quality filters (market cap, P/E, volume). Signal strength blends RSI, drop size, volume vs average, and trend alignment.
- **Exit (SELL)**: RSI > 70, or price ≥ target (+10% default), or price ≤ stop (-8% default), or held ≥ 30 days.
- **Allocation guardrails**: max 10 positions; 10% of capital each; max 30% per sector; skips symbols already held.

## Market overview
- **Heatmap**: top movers by absolute % change from the fetched list (limits size to respect free data). Green = up, red = down; opacity shows magnitude.
- **Top gainers/losers list**: biggest % moves today. Clicking a ticker sets it as the selected stock and updates the chart/quick actions.

## Portfolio & trades
- **Portfolio summary**: positions with entry price, current price, shares, unrealized P&L and % gain; cash, total value, total/ daily P&L.
- **Quick actions**: buy a fixed share amount for the selected stock; sell if you already hold it.
- **Backtest results** (when run): total/annualized return, Sharpe, max drawdown, win rate, average win/loss, trade counts; equity curve vs time.

## Example of a trade signal interpretation
- **Symbol**: AMD; **Type**: BUY
- **Strength 55%**: moderate conviction (RSI near threshold, drop size meets rule, trend filter passes).
- **Entry $206.06**: current price used for entry math.
- **Target $226.67**: +10% above entry (default targetGainPercent).
- **Stop Loss $189.58**: -8% below entry (default stopLossPercent).
- **Reasons**:
  - `Dropped -7.82% (threshold: -5%)`: daily drop triggered the dip rule.
  - `Price $206.06 above 200-MA $147.98`: uptrend filter passed.
  - (RSI/quality check bullets would appear if those conditions passed/fail messages.)

## Tips
- If you don't see a signal for a big mover, check RSI/quality rules or whether the symbol is in the fetched set.
- If a click loads stale data, hit Refresh; the app refetches and rescans.
- Adjust thresholds in Settings if you want more/less aggressive entries (e.g., RSI oversold 35 instead of 30, different dip threshold).***
