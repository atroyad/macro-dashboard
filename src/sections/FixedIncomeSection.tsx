import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { TradingViewChart } from '../components/charts/TradingViewChart'
import { ChartCard, MetricCard, NoApiKeyCard } from '../components/cards/MetricCard'
import { MacroChart, MultiMacroChart } from '../components/charts/MacroChart'

const START = '2000-01-01'
const START_SHORT = '2020-01-01'

export function FixedIncomeSection() {
  const { fredApiKey } = useApp()

  const us2y    = useFRED('DGS2',           fredApiKey, { frequency: 'd', observationStart: START })
  const us5y    = useFRED('DGS5',           fredApiKey, { frequency: 'd', observationStart: START })
  const us10y   = useFRED('DGS10',          fredApiKey, { frequency: 'd', observationStart: START })
  const us30y   = useFRED('DGS30',          fredApiKey, { frequency: 'd', observationStart: START })
  const be10y   = useFRED('T10YIE',         fredApiKey, { frequency: 'd', observationStart: START_SHORT })
  const be5y    = useFRED('T5YIE',          fredApiKey, { frequency: 'd', observationStart: START_SHORT })
  const hySpread = useFRED('BAMLH0A0HYM2',  fredApiKey, { frequency: 'd', observationStart: START_SHORT })
  const igSpread = useFRED('BAMLC0A0CM',    fredApiKey, { frequency: 'd', observationStart: START_SHORT })
  // VIX from FRED (CBOE Volatility Index, daily since 1990) — replaces CBOE:VIX embed (subscription)
  const vix     = useFRED('VIXCLS',         fredApiKey, { frequency: 'd', observationStart: '2010-01-01' })

  // 2s10s spread
  const spread2s10s = useMemo(() => {
    if (!us2y.data.length || !us10y.data.length) return []
    const map2y = new Map(us2y.data.map(d => [d.date, d.value]))
    return us10y.data
      .filter(d => map2y.has(d.date))
      .map(d => ({ date: d.date, value: d.value - (map2y.get(d.date) ?? 0) }))
  }, [us2y.data, us10y.data])

  // Combined yield curve
  const yieldCurveData = useMemo(() => {
    const maps = {
      '2Y':  new Map(us2y.data.map(d => [d.date, d.value])),
      '5Y':  new Map(us5y.data.map(d => [d.date, d.value])),
      '10Y': new Map(us10y.data.map(d => [d.date, d.value])),
      '30Y': new Map(us30y.data.map(d => [d.date, d.value])),
    }
    const dates = [...maps['10Y'].keys()].filter(
      d => maps['2Y'].has(d) && maps['5Y'].has(d) && maps['30Y'].has(d)
    )
    return dates.slice(-500).map(date => ({
      date,
      '2Y':  maps['2Y'].get(date) ?? 0,
      '5Y':  maps['5Y'].get(date) ?? 0,
      '10Y': maps['10Y'].get(date) ?? 0,
      '30Y': maps['30Y'].get(date) ?? 0,
    }))
  }, [us2y.data, us5y.data, us10y.data, us30y.data])

  const last2s10s = spread2s10s.length ? spread2s10s[spread2s10s.length - 1].value : null
  const lastHY    = hySpread.lastValue
  const lastBE10  = be10y.lastValue

  return (
    <div className="section-enter flex flex-col gap-6">
      {/* KPI Row */}
      {fredApiKey ? (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          <MetricCard
            label="US 2Y Yield"
            value={us2y.lastValue ? `${us2y.lastValue.toFixed(2)}%` : null}
            change={us2y.lastValue && us2y.prevValue ? (us2y.lastValue - us2y.prevValue) * 100 : null}
            changeLabel=" bps"
            color="#ef4444"
            loading={us2y.loading}
          />
          <MetricCard
            label="US 10Y Yield"
            value={us10y.lastValue ? `${us10y.lastValue.toFixed(2)}%` : null}
            change={us10y.lastValue && us10y.prevValue ? (us10y.lastValue - us10y.prevValue) * 100 : null}
            changeLabel=" bps"
            color="#f59e0b"
            loading={us10y.loading}
          />
          <MetricCard
            label="US 30Y Yield"
            value={us30y.lastValue ? `${us30y.lastValue.toFixed(2)}%` : null}
            change={us30y.lastValue && us30y.prevValue ? (us30y.lastValue - us30y.prevValue) * 100 : null}
            changeLabel=" bps"
            color="#8b5cf6"
            loading={us30y.loading}
          />
          <MetricCard
            label="2s10s Spread"
            value={last2s10s !== null ? `${last2s10s.toFixed(2)}%` : null}
            subtitle={last2s10s !== null && last2s10s < 0 ? 'Inverted ⚠' : 'Positive'}
            color={last2s10s !== null && last2s10s < 0 ? '#ef4444' : '#22c55e'}
            loading={us2y.loading || us10y.loading}
          />
          <MetricCard
            label="10Y Breakeven"
            value={lastBE10 ? `${lastBE10.toFixed(2)}%` : null}
            subtitle="Inflation expectations"
            color="#f59e0b"
            loading={be10y.loading}
          />
          <MetricCard
            label="HY Credit Spread"
            value={lastHY ? `${lastHY.toFixed(0)} bps` : null}
            subtitle={lastHY && lastHY > 500 ? 'Stressed ⚠' : 'Contained'}
            color={lastHY && lastHY > 500 ? '#ef4444' : '#22c55e'}
            loading={hySpread.loading}
          />
        </div>
      ) : (
        <NoApiKeyCard />
      )}

      {/* VIX (FRED) + MOVE context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {fredApiKey ? (
          <ChartCard
            title="VIX — Equity Volatility (FRED: VIXCLS)"
            subtitle="CBOE Volatility Index, daily since 1990"
            height={320}
            badge="FRED"
            note="VIX > 30 = fear; > 40 = panic. Embedded CBOE charts require subscription — using FRED feed."
          >
            {vix.data.length > 0 ? (
              <MacroChart
                data={vix.data}
                label="VIX"
                color="#ef4444"
                unit="%"
                type="area"
                refLine={30}
                refLabel="30"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                {vix.loading ? 'Loading…' : 'No data'}
              </div>
            )}
          </ChartCard>
        ) : (
          <NoApiKeyCard />
        )}

        {/* MOVE info card — no free embed exists */}
        <div className="bg-bg-card border border-accent-purple/30 rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-accent-purple text-lg">📊</span>
            <h3 className="text-sm font-semibold text-text-primary">
              MOVE Index — Treasury Volatility
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple font-mono ml-auto">
              Subscription
            </span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            The ICE BofA MOVE Index (bond market VIX) requires a Bloomberg or ICE data subscription
            and cannot be embedded freely. MOVE &gt; 100 = elevated; &gt; 150 = crisis-level.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-1">
            {[
              { level: 'MOVE < 80', status: 'Calm — Treasury auctions smooth', color: '#22c55e' },
              { level: 'MOVE 80–100', status: 'Moderate uncertainty', color: '#f59e0b' },
              { level: 'MOVE 100–150', status: 'Elevated — watch auctions', color: '#f97316' },
              { level: 'MOVE > 150', status: 'Crisis — SVB/2020 level', color: '#ef4444' },
            ].map(r => (
              <div key={r.level} className="bg-bg-elevated rounded-lg p-2">
                <p className="text-xs font-mono font-medium" style={{ color: r.color }}>{r.level}</p>
                <p className="text-xs text-text-muted mt-0.5">{r.status}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-1">
            Track via{' '}
            <a href="https://fred.stlouisfed.org" target="_blank" rel="noreferrer" className="text-accent-teal hover:underline">
              FRED (search BAMLMOVE)
            </a>
            {' '}or{' '}
            <a href="https://www.ice.com/market-data/analytics/fixed-income-analytics" target="_blank" rel="noreferrer" className="text-accent-teal hover:underline">
              ICE website
            </a>
          </p>
        </div>
      </div>

      {fredApiKey ? (
        <>
          {/* Yield curves */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="US Yield Curve — 2Y / 5Y / 10Y / 30Y"
              subtitle="Constant maturity Treasury yields"
              height={320}
              badge="FRED"
            >
              {yieldCurveData.length > 0 ? (
                <MultiMacroChart
                  data={yieldCurveData}
                  series={[
                    { key: '2Y',  label: '2Y',  color: '#ef4444' },
                    { key: '5Y',  label: '5Y',  color: '#f59e0b' },
                    { key: '10Y', label: '10Y', color: '#3b82f6' },
                    { key: '30Y', label: '30Y', color: '#8b5cf6' },
                  ]}
                  unit="%"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading…</div>
              )}
            </ChartCard>

            <ChartCard
              title="2s10s Yield Curve Spread"
              subtitle="10Y − 2Y: negative = inverted (every US recession since 1970)"
              height={320}
              badge="FRED"
            >
              {spread2s10s.length > 0 ? (
                <MacroChart
                  data={spread2s10s}
                  label="2s10s"
                  color={last2s10s !== null && last2s10s < 0 ? '#ef4444' : '#22c55e'}
                  unit="%"
                  type="area"
                  refLine={0}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading…</div>
              )}
            </ChartCard>

            <ChartCard
              title="10Y & 5Y Breakeven Inflation"
              subtitle="TIPS-derived inflation expectations"
              height={320}
              badge="FRED"
            >
              {be10y.data.length > 0 && be5y.data.length > 0 ? (
                (() => {
                  const be5Map = new Map(be5y.data.map(d => [d.date, d.value]))
                  const combined = be10y.data
                    .filter(d => be5Map.has(d.date))
                    .map(d => ({ date: d.date, '10Y BE': d.value, '5Y BE': be5Map.get(d.date) ?? 0 }))
                  return (
                    <MultiMacroChart
                      data={combined}
                      series={[
                        { key: '10Y BE', label: '10Y Breakeven', color: '#f59e0b' },
                        { key: '5Y BE', label: '5Y Breakeven',  color: '#3b82f6' },
                      ]}
                      unit="%"
                      refLine={2}
                    />
                  )
                })()
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading…</div>
              )}
            </ChartCard>

            <ChartCard
              title="Credit Spreads — HY & IG"
              subtitle="Option-adjusted spreads — HY > 500bps = credit stress"
              height={320}
              badge="FRED"
            >
              {hySpread.data.length > 0 && igSpread.data.length > 0 ? (
                (() => {
                  const igMap = new Map(igSpread.data.map(d => [d.date, d.value]))
                  const combined = hySpread.data
                    .filter(d => igMap.has(d.date))
                    .map(d => ({ date: d.date, 'HY OAS': d.value, 'IG OAS': igMap.get(d.date) ?? 0 }))
                  return (
                    <MultiMacroChart
                      data={combined}
                      series={[
                        { key: 'HY OAS', label: 'HY OAS (bps)', color: '#ef4444' },
                        { key: 'IG OAS', label: 'IG OAS (bps)', color: '#3b82f6' },
                      ]}
                      refLine={500}
                    />
                  )
                })()
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading…</div>
              )}
            </ChartCard>
          </div>

          {/* International bonds — TVC: feeds are TradingView's own composite (free) */}
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">
              International Sovereign Yields — TVC feeds (free)
            </h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {[
                { symbol: 'TVC:JP10Y', title: 'Japan JGB 10Y',     subtitle: 'BoJ YCC — key for carry trades' },
                { symbol: 'TVC:DE10Y', title: 'Germany Bund 10Y',  subtitle: 'EU benchmark yield' },
                { symbol: 'TVC:GB10Y', title: 'UK Gilt 10Y',       subtitle: 'Stagflation watch' },
                { symbol: 'TVC:CN10Y', title: 'China CGB 10Y',     subtitle: 'PBoC policy signal' },
              ].map(c => (
                <ChartCard
                  key={c.symbol}
                  title={c.title}
                  subtitle={c.subtitle}
                  height={360}
                  badge="TradingView"
                  badgeColor="#3b82f6"
                >
                  <TradingViewChart symbol={c.symbol} interval="W" height={300} />
                </ChartCard>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
