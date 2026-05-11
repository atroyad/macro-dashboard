import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { TradingViewChart } from '../components/charts/TradingViewChart'
import { ChartCard, NoApiKeyCard } from '../components/cards/MetricCard'
import { MacroChart } from '../components/charts/MacroChart'

const CHART_HEIGHT = 400

const commodityCharts = [
  {
    symbol: 'TVC:GOLD',
    title: 'Gold (XAU/USD)',
    subtitle: 'Spot price — weekly',
    badge: 'TradingView',
    interval: 'W',
  },
  {
    symbol: 'TVC:SILVER',
    title: 'Silver (XAG/USD)',
    subtitle: 'Spot price — weekly',
    badge: 'TradingView',
    interval: 'W',
  },
  {
    symbol: 'TVC:USOIL',
    title: 'WTI Crude Oil — Spot',
    subtitle: 'West Texas Intermediate',
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
    symbol: 'NYMEX:CL1!',
    title: 'WTI Crude — Front Month Futures',
    subtitle: 'NYMEX CL1! continuous contract',
    badge: 'TradingView',
    interval: 'W',
  },
  {
    symbol: 'NYMEX:NG1!',
    title: 'Natural Gas — Front Month',
    subtitle: 'Henry Hub NG1! continuous',
    badge: 'TradingView',
    interval: 'W',
  },
  {
    symbol: 'COMEX:HG1!',
    title: 'Copper — Front Month Futures',
    subtitle: 'COMEX HG1! — leading economic indicator',
    badge: 'TradingView',
    interval: 'W',
  },
  {
    symbol: 'COMEX:SI1!',
    title: 'Silver — Front Month Futures',
    subtitle: 'COMEX SI1! — industrial + monetary',
    badge: 'TradingView',
    interval: 'W',
  },
  {
    symbol: 'NYSE:CCJ',
    title: 'Cameco (CCJ) — Uranium Proxy',
    subtitle: 'Largest listed uranium producer — nuclear renaissance play',
    badge: 'TradingView',
    interval: 'W',
  },
]

export function CommoditiesSection() {
  const { fredApiKey } = useApp()

  // FRED historical data for gold and oil (back to 1968 / 1986)
  const goldFRED = useFRED('GOLDAMGBD228NLBM', fredApiKey, {
    frequency: 'm',
    observationStart: '1968-01-01',
  })
  const oilFRED = useFRED('DCOILWTICO', fredApiKey, {
    frequency: 'm',
    observationStart: '1986-01-01',
  })

  return (
    <div className="section-enter flex flex-col gap-6">
      {/* Context pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Gold: monetary remonetization + CB buying', color: '#f59e0b' },
          { label: 'Oil: Strait of Hormuz flow disruption risk', color: '#ef4444' },
          { label: 'Copper: China PMI / industrial demand proxy', color: '#f97316' },
          { label: 'Silver: industrial + monetary dual role', color: '#94a3b8' },
          { label: 'Uranium: nuclear renaissance (energy transition)', color: '#22c55e' },
          { label: 'NatGas: European energy security', color: '#3b82f6' },
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

      {/* Historical long-term charts (FRED) */}
      {fredApiKey ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Gold Price — Historical (1968–present)"
            subtitle="LBMA Gold Price AM, USD/troy oz"
            height={320}
            badge="FRED"
            note="Denominator switching applies — view gold priced in oil, BTC, etc."
          >
            {goldFRED.data.length > 0 ? (
              <MacroChart
                data={goldFRED.data}
                label="Gold ($/oz)"
                color="#f59e0b"
                unit="$"
                denominate
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                {goldFRED.loading ? 'Loading…' : 'No data — check FRED key'}
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="WTI Crude Oil — Historical (1986–present)"
            subtitle="Cushing OK WTI Spot Price FOB, USD/bbl"
            height={320}
            badge="FRED"
            note="Denominator switching applies — view oil priced in gold, BTC, etc."
          >
            {oilFRED.data.length > 0 ? (
              <MacroChart
                data={oilFRED.data}
                label="WTI ($/bbl)"
                color="#ef4444"
                unit="$"
                denominate
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                {oilFRED.loading ? 'Loading…' : 'No data — check FRED key'}
              </div>
            )}
          </ChartCard>
        </div>
      ) : (
        <div>
          <p className="text-xs text-text-muted mb-2">
            Add FRED key for historical data back to the 1800s (via FRED + World Bank)
          </p>
          <NoApiKeyCard />
        </div>
      )}

      {/* Live TradingView charts */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">
          Live Market Charts — TradingView
        </h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {commodityCharts.map((c) => (
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

      {/* Strait of Hormuz note */}
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
        <div className="mt-3">
          <TradingViewChart
            symbol="TVC:UKOIL"
            interval="D"
            height={180}
          />
        </div>
      </div>

      {/* Additional context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-bg-card border border-bg-border rounded-xl p-4">
          <h4 className="text-sm font-medium text-text-secondary mb-2">
            Gold: Monetary Remonetization Thesis
          </h4>
          <ul className="text-xs text-text-muted space-y-1.5 leading-relaxed">
            <li>→ BIS Basel III: gold as Tier 1 capital (100% weighting)</li>
            <li>→ Central bank gold purchases at post-Bretton Woods record highs</li>
            <li>→ China, Russia, India accumulating; UK/Germany repatriating</li>
            <li>→ Gold/oil ratio = implicit "petrogold" pricing signal</li>
            <li>→ Gromen thesis: US will eventually need gold to back Treasuries</li>
          </ul>
        </div>
        <div className="bg-bg-card border border-bg-border rounded-xl p-4">
          <h4 className="text-sm font-medium text-text-secondary mb-2">
            Copper: Dr. Copper Leading Indicator
          </h4>
          <ul className="text-xs text-text-muted space-y-1.5 leading-relaxed">
            <li>→ ~55% of copper demand from China (construction + infrastructure)</li>
            <li>→ Energy transition multiplier: EVs use 4× copper vs ICE vehicles</li>
            <li>→ Copper/gold ratio: rising = reflation / risk-on; falling = risk-off</li>
            <li>→ Copper/oil ratio: tracks real economic activity vs. energy costs</li>
            <li>→ LME warehouse inventories as supply tightness signal</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
