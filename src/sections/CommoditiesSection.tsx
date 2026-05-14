import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { useYahoo } from '../hooks/useYahoo'
import { useYahooHistory } from '../hooks/useYahooHistory'
import { TradingViewChart } from '../components/charts/TradingViewChart'
import { ChartCard, NoApiKeyCard } from '../components/cards/MetricCard'
import { MacroChart } from '../components/charts/MacroChart'
import { GaugeChart, deltaColor as getDeltaColor } from '../components/charts/GaugeChart'
import { GaugeCard } from '../components/charts/GaugeCard'

const CHART_HEIGHT = 400

// Metals only — oil lives in its own OilSection
const metalsCharts = [
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
    symbol: 'NYSE:CPER',
    title: 'Copper — CPER ETF',
    subtitle: 'US Copper Index Fund — leading economic indicator',
    badge: 'TradingView',
    interval: 'W',
  },
  {
    symbol: 'AMEX:SLV',
    title: 'Silver — SLV ETF',
    subtitle: 'iShares Silver Trust — monetary + industrial',
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
  {
    symbol: 'AMEX:GDX',
    title: 'Gold Miners — GDX ETF',
    subtitle: 'VanEck Gold Miners — leveraged gold + M&A signal',
    badge: 'TradingView',
    interval: 'W',
  },
]

function daysAgo(isoDate: string | null): number | null {
  if (!isoDate) return null
  return Math.round((Date.now() - new Date(isoDate).getTime()) / 86_400_000)
}
function fmtDate(isoDate: string | null): string {
  if (!isoDate) return '—'
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function CommoditiesSection() {
  const { fredApiKey } = useApp()

  // FRED historical — gold only (oil is in OilSection)
  const goldFRED = useFRED('GOLDAMGBD228NLBM', fredApiKey, { frequency: 'm', observationStart: '1968-01-01' })

  // Yahoo spot prices for gauge ratios
  const gcf  = useYahoo('GC=F')
  const sif  = useYahoo('SI=F')
  const hgf  = useYahoo('HG=F')
  const cnyx = useYahoo('CNY=X')

  // ATH for Gold
  const gcfH = useYahooHistory('GC=F', '5y')

  // Derived ratios
  const goldPct     = gcf.value !== null && gcfH.ath !== null ? (gcf.value / gcfH.ath - 1) * 100 : null
  const goldPrevPct = gcf.prev  !== null && gcfH.ath !== null ? (gcf.prev  / gcfH.ath - 1) * 100 : null

  const goldCnyV = gcf.value !== null && cnyx.value !== null ? gcf.value * cnyx.value : null
  const goldCnyP = gcf.prev  !== null && cnyx.prev  !== null ? gcf.prev  * cnyx.prev  : null

  const gsV = gcf.value !== null && sif.value !== null && sif.value > 0 ? gcf.value / sif.value : null
  const gsP = gcf.prev  !== null && sif.prev  !== null && sif.prev  > 0 ? gcf.prev  / sif.prev  : null

  const cuAgV = hgf.value !== null && sif.value !== null && sif.value > 0 ? hgf.value / sif.value : null
  const cuAgP = hgf.prev  !== null && sif.prev  !== null && sif.prev  > 0 ? hgf.prev  / sif.prev  : null

  const goldAthNote = gcfH.ath
    ? `ATH $${gcfH.ath.toFixed(0)}/oz — ${fmtDate(gcfH.athDate)} (${daysAgo(gcfH.athDate)}d ago) · Now $${gcf.value?.toFixed(0) ?? '…'}`
    : gcfH.loading ? 'Calculating ATH…' : undefined

  return (
    <div className="section-enter flex flex-col gap-6">

      {/* ── Gauge summary ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10.5px] text-text-muted leading-relaxed mb-3">
          Metals gauges — ratios signal monetary vs. industrial demand balance.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

          {/* Gold % from ATH */}
          {(() => {
            const delta = goldPct !== null && goldPrevPct !== null ? goldPct - goldPrevPct : null
            return (
              <GaugeCard
                title="Gold — % from ATH"
                subtitle="COMEX front-month vs 5-year ATH. Near ATH=bull confirmation; deep below=value zone."
                source="Yahoo GC=F (5y)"
                headerNote={goldAthNote}
                delta={delta} deltaColor={getDeltaColor(delta, false)}
                formatDelta={(d) => `${Math.abs(d).toFixed(2)}%`}
              >
                <GaugeChart value={goldPct} min={-60} max={0}
                  greenMax={-10} redMin={-50} inverted
                  format={(v) => `${v.toFixed(1)}%`}
                  loading={gcf.loading || gcfH.loading}
                  greenLabel="Toward ATH" yellowLabel="Recovery" redLabel="Deep Value" />
              </GaugeCard>
            )
          })()}

          {/* Gold/CNY */}
          {(() => {
            const delta = goldCnyV !== null && goldCnyP !== null ? goldCnyV - goldCnyP : null
            return (
              <GaugeCard
                title="Gold/CNY — Yuan per Oz"
                subtitle="Gold in Chinese Yuan. High=repricing / de-dollarization; Low=deep value"
                source="Yahoo GC=F × CNY=X"
                delta={delta} deltaColor={getDeltaColor(delta, false)}
                formatDelta={(d) => `¥${Math.abs(d / 1000).toFixed(1)}k`}
              >
                <GaugeChart value={goldCnyV} min={20000} max={50000}
                  greenMax={35000} redMin={25000} inverted
                  format={(v) => `¥${(v / 1000).toFixed(0)}k`} loading={gcf.loading || cnyx.loading}
                  greenLabel="Repricing" yellowLabel="Consolidation" redLabel="Deep Value" />
              </GaugeCard>
            )
          })()}

          {/* Gold/Silver */}
          {(() => {
            const delta = gsV !== null && gsP !== null ? gsV - gsP : null
            return (
              <GaugeCard
                title="Gold/Silver Ratio"
                subtitle="High=monetary demand for gold dominant; Low=silver commodity speculation"
                source="Yahoo GC=F ÷ SI=F"
                delta={delta} deltaColor={getDeltaColor(delta, false)}
                formatDelta={(d) => `${Math.abs(d).toFixed(2)}`}
              >
                <GaugeChart value={gsV} min={0} max={150}
                  greenMax={120} redMin={25} inverted
                  format={(v) => v.toFixed(1)} loading={gcf.loading || sif.loading}
                  greenLabel="Monetary Expansion" yellowLabel="Normal" redLabel="Commodity Speculation" />
              </GaugeCard>
            )
          })()}

          {/* Copper/Silver */}
          {(() => {
            const delta = cuAgV !== null && cuAgP !== null ? cuAgV - cuAgP : null
            return (
              <GaugeCard
                title="Copper/Silver Ratio (Cu/Ag)"
                subtitle="HG=F / SI=F. High=industrial expansion dominant; Low=monetary silver demand"
                source="Yahoo HG=F ÷ SI=F"
                delta={delta} deltaColor={getDeltaColor(delta, true)}
                formatDelta={(d) => `${Math.abs(d).toFixed(4)}`}
              >
                <GaugeChart value={cuAgV} min={0} max={0.4} greenMax={0.1} redMin={0.3}
                  format={(v) => v.toFixed(3)} loading={hgf.loading || sif.loading}
                  greenLabel="Commodity Speculation" yellowLabel="Mixed" redLabel="Industrial Expansion" />
              </GaugeCard>
            )
          })()}

        </div>
      </div>

      {/* Context pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Gold: monetary remonetization + CB buying', color: '#f59e0b' },
          { label: 'Copper: China PMI / industrial demand proxy', color: '#f97316' },
          { label: 'Silver: industrial + monetary dual role', color: '#94a3b8' },
          { label: 'Uranium: nuclear renaissance (energy transition)', color: '#22c55e' },
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

      {/* Historical long-term chart (FRED) */}
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
        </div>
      ) : (
        <div>
          <p className="text-xs text-text-muted mb-2">
            Add FRED key for historical data back to 1968
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
          {metalsCharts.map((c) => (
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
