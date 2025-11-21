import { useSettingsStore } from '../../stores/settingsStore';

export function StrategyConfig() {
  const { strategyConfig, updateStrategyConfig, resetStrategyConfig } = useSettingsStore();

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Strategy Configuration</h2>
        <button
          onClick={resetStrategyConfig}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="space-y-4">
        {/* Entry Conditions */}
        <div>
          <h3 className="font-medium text-sm text-gray-600 mb-2">Entry Conditions</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Dip Threshold (%)
              </label>
              <input
                type="number"
                value={strategyConfig.dipThreshold}
                onChange={(e) => updateStrategyConfig({ dipThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded text-sm"
                step="0.5"
                max="0"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                RSI Oversold Level
              </label>
              <input
                type="number"
                value={strategyConfig.rsiOversold}
                onChange={(e) => updateStrategyConfig({ rsiOversold: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded text-sm"
                min="0"
                max="50"
              />
            </div>
          </div>
        </div>

        {/* Exit Conditions */}
        <div>
          <h3 className="font-medium text-sm text-gray-600 mb-2">Exit Conditions</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                RSI Overbought Level
              </label>
              <input
                type="number"
                value={strategyConfig.rsiOverbought}
                onChange={(e) => updateStrategyConfig({ rsiOverbought: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded text-sm"
                min="50"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Target Gain (%)
              </label>
              <input
                type="number"
                value={strategyConfig.targetGainPercent}
                onChange={(e) => updateStrategyConfig({ targetGainPercent: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded text-sm"
                min="1"
                max="50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Stop Loss (%)
              </label>
              <input
                type="number"
                value={strategyConfig.stopLossPercent}
                onChange={(e) => updateStrategyConfig({ stopLossPercent: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded text-sm"
                min="1"
                max="20"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Max Holding Days
              </label>
              <input
                type="number"
                value={strategyConfig.maxHoldingDays}
                onChange={(e) => updateStrategyConfig({ maxHoldingDays: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded text-sm"
                min="1"
                max="90"
              />
            </div>
          </div>
        </div>

        {/* Quality Filters */}
        <div>
          <h3 className="font-medium text-sm text-gray-600 mb-2">Quality Filters</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Min Market Cap ($B)
              </label>
              <input
                type="number"
                value={strategyConfig.qualityFilters.minMarketCap / 1e9}
                onChange={(e) => updateStrategyConfig({
                  qualityFilters: {
                    ...strategyConfig.qualityFilters,
                    minMarketCap: Number(e.target.value) * 1e9
                  }
                })}
                className="w-full px-3 py-2 border rounded text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Max P/E Ratio
              </label>
              <input
                type="number"
                value={strategyConfig.qualityFilters.maxPERatio}
                onChange={(e) => updateStrategyConfig({
                  qualityFilters: {
                    ...strategyConfig.qualityFilters,
                    maxPERatio: Number(e.target.value)
                  }
                })}
                className="w-full px-3 py-2 border rounded text-sm"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Allocation */}
        <div>
          <h3 className="font-medium text-sm text-gray-600 mb-2">Allocation</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Max Positions
              </label>
              <input
                type="number"
                value={strategyConfig.allocation.maxPositions}
                onChange={(e) => updateStrategyConfig({
                  allocation: {
                    ...strategyConfig.allocation,
                    maxPositions: Number(e.target.value)
                  }
                })}
                className="w-full px-3 py-2 border rounded text-sm"
                min="1"
                max="50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Position Size (% of portfolio)
              </label>
              <input
                type="number"
                value={strategyConfig.allocation.positionSize * 100}
                onChange={(e) => updateStrategyConfig({
                  allocation: {
                    ...strategyConfig.allocation,
                    positionSize: Number(e.target.value) / 100
                  }
                })}
                className="w-full px-3 py-2 border rounded text-sm"
                min="1"
                max="100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
