import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { useYahoo } from '../hooks/useYahoo'
import { TradingViewChart } from '../components/charts/TradingViewChart'
import { ChartCard, NoApiKeyCard } from '../components/cards/MetricCard'
import { MacroChart } from '../components/charts/MacroChart'
import { GaugeChart, deltaColor as getDeltaColor } from '../components/charts/GaugeChart'
import { GaugeCard } from '../components/charts/GaugeCard'

const CHART_HEIGHT = 400

const oilCharts = [
  {
    symbol: 'TVC:USOIL',
    title: 'WTI Crude Oil — Spot',
    subtitle: 'West Texas Intermediate (Cushing, OK)',
    badge: 'TradingView',
    interval: 'W',
  },
  {
    symbol: 'TVC:UKOIL',
    title: 'Brent Crude Oil — Spot',
    subtitle: 'North Sea Brent benchmark',
    badge: 'TradingView',
    interval: 'W',
  },
  {
    symbol: 'NYSE:USO',
    title: 'WTI Crude — USO Fund (futures-rolling proxy)',
    subtitle: 'US Oil Fund — tracks front-month WTI futures roll',
    badge: 'TradingView',
    interval: 'W',
  },
  {
    symbol: 'NYSE:UNG',
    title: 'Natural Gas — UNG Fund',
    subtitle: 'US Natural Gas Fund — Henry Hub futures proxy',
    badge: 'TradingView',
    interval: 'W',
  },
]

export function OilSection() {
  const { fredApiKey } = useApp()

  // FRED oil spots (daily → monthly)
  const wtiS   = useFRED('DCOILWTICO',   fredApiKey, { frequency: 'd', observationStart: '2025-01-01' })
  const brentS = useFRED('DCOILBRENTEU', fredApiKey, { frequency: 'd', observationStart: '2025-01-01' })

  // Yahoo futures
  const clf = useYahoo('CL=F')
  const bzf = useYahoo('BZ=F')

  // FRED historical
  const oilFRED   = useFRED('DCOILWTICO',   fredApiKey, { frequency: 'm', observationStart: '1986-01-01' })
  const brentFRED = useFRED('DCOILBRENTEU', fredApiKey, { frequency: 'm', observationStart: '1987-01-01' })

  // Brent − WTI spread
  const brentWtiSpread = (() => {
    if (!brentFRED.data.length || !oilFRED.data.length) return []
    const wtiMap = new Map(oilFRED.data.map(d => [d.date, d.value]))
    return brentFRED.data
      .filter(d => wtiMap.has(d.date))
      .map(d => ({ date: d.date, value: d.value - (wtiMap.get(d.date) ?? 0) }))
  })()

  return (
    <div className="section-enter flex flex-col gap-6">

      {/* ── Gauge summary ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10.5px] text-text-muted leading-relaxed mb-3">
          Oil stress gauges — green = low price (consumer-friendly), red = high price / supply shock.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

          {/* Oil Spot */}
          {(() => {
            const delta = wtiS.lastValue !== null && wtiS.prevValue !== null
              ? wtiS.lastValue - wtiS.prevValue : null
            return (
              <GaugeCard
                title="Energy — Oil Spot (WTI + Brent)"
                subtitle="WTI Cushing & Brent Dated spot. Highest price shown in color."
                source="FRED spot series"
                delta={delta} deltaColor={getDeltaColor(delta, true)}
                formatDelta={(d) => `WTI $${Math.abs(d).toFixed(2)}`}
              >
                <GaugeChart
                  needles={[
                    { value: wtiS.lastValue,   color: '#3b82f6', label: 'WTI'   },
                    { value: brentS.lastValue, color: '#f59e0b', label: 'Brent' },
                  ]}
                  min={0} max={200} greenMax={60} redMin={120}
                  format={(v) => `$${v.toFixed(0)}`}
                  loading={wtiS.loading || brentS.loading}
                  greenLabel="Cheap" yellowLabel="Normal" redLabel="Expensive"
                />
              </GaugeCard>
            )
          })()}

          {/* Oil Futures */}
          {(() => {
            const delta = clf.value !== null && clf.prev !== null ? clf.value - clf.prev : null
            return (
              <GaugeCard
                title="Energy — Oil Futures (Front Month)"
                subtitle="WTI + Brent front-month futures — same delivery horizon."
                source="Yahoo CL=F BZ=F"
                delta={delta} deltaColor={getDeltaColor(delta, true)}
                formatDelta={(d) => `WTI $${Math.abs(d).toFixed(2)}`}
              >
                <GaugeChart
                  needles={[
                    { value: clf.value, color: '#3b82f6', label: 'WTI'   },
                    { value: bzf.value, color: '#f59e0b', label: 'Brent' },
                  ]}
                  min={0} max={200} greenMax={60} redMin={120}
                  format={(v) => `$${v.toFixed(0)}`}
                  loading={clf.loading || bzf.loading}
                  greenLabel="Cheap" yellowLabel="Normal" redLabel="Expensive"
                />
              </GaugeCard>
            )
          })()}

        </div>
      </div>

      {/* Context pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Strait of Hormuz: ~20% of global oil supply', color: '#ef4444' },
          { label: 'Brent−WTI spread: Middle East risk premium', color: '#f97316' },
          { label: 'WTI < $60: shale break-even / US production signal', color: '#3b82f6' },
          { label: 'OPEC+ cuts vs. demand cycle', color: '#f59e0b' },
        ].map((p) => (
          <span
            key={p.label}
            className="text-xs px-2.5 py-1 rounded-full border"
            style={{ color: p.color, borderColor: `${p.color}40`, background: `${p.color}10` }}
          >
            {p.label}
          </span>
        ))}
      </div>

      {/* Historical FRED charts */}
      {fredApiKey ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="WTI Crude Oil — Historical (1986–present)"
            subtitle="Cushing OK WTI Spot Price FOB, USD/bbl"
            height={320}
            badge="FRED"
            note="OPEC shocks, Gulf Wars, COVID crash, Ukraine spike all visible."
          >
            {oilFRED.data.length > 0 ? (
              <MacroChart data={oilFRED.data} label="WTI ($/bbl)" color="#3b82f6" unit="$" denominate />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                {oilFRED.loading ? 'Loading…' : 'No data — check FRED key'}
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Brent Crude Oil — Historical (1987–present)"
            subtitle="ICE Brent Crude Dated, USD/bbl"
            height={320}
            badge="FRED"
          >
            {brentFRED.data.length > 0 ? (
              <MacroChart data={brentFRED.data} label="Brent ($/bbl)" color="#f59e0b" unit="$" denominate />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                {brentFRED.loading ? 'Loading…' : 'No data — check FRED key'}
              </div>
            )}
          </ChartCard>
        </div>
      ) : (
        <div>
          <p className="text-xs text-text-muted mb-2">Add FRED key for historical data back to 1986</p>
          <NoApiKeyCard />
        </div>
      )}

      {/* Live TradingView charts */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">
          Live Market Charts — TradingView
        </h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {oilCharts.map((c) => (
            <ChartCard
              key={c.symbol}
              title={c.title}
              subtitle={c.subtitle}
              height={CHART_HEIGHT}
              badge={c.badge}
              badgeColor="#3b82f6"
            >
              <TradingViewChart symbol={c.symbol} interval={c.interval} height={CHART_HEIGHT - 60} />
            </ChartCard>
          ))}
        </div>
      </div>

      {/* Strait of Hormuz note + Brent-WTI spread */}
      <div className="bg-bg-card border border-accent-orange/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-accent-orange text-sm">⚠</span>
          <h4 className="text-sm font-medium text-accent-orange">
            Strait of Hormuz — Supply Disruption Monitor
          </h4>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          ~21 million barrels/day (≈20% of global oil supply) transits the Strait of Hormuz.
          Real-time vessel tracking data requires specialist sources (e.g.{' '}
          <strong className="text-text-secondary">Kpler, Vortexa, MarineTraffic Enterprise</strong>).
          Key signal: sustained drop in daily tanker transits → Brent/WTI premium spike.
          Monitor Brent–WTI spread as a proxy for Middle East supply risk premium.
        </p>
        {fredApiKey && brentWtiSpread.length > 0 ? (
          <div className="mt-3" style={{ height: 200 }}>
            <MacroChart
              data={brentWtiSpread}
              label="Brent − WTI ($/bbl)"
              color="#f97316"
              unit="$"
              type="area"
              refLine={0}
            />
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div style={{ height: 200 }}>
              <TradingViewChart symbol="TVC:UKOIL" interval="D" height={200} />
            </div>
            <div style={{ height: 200 }}>
              <TradingViewChart symbol="TVC:USOIL" interval="D" height={200} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
