import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { GaugeChart, zoneColor } from '../components/charts/GaugeChart'

// ─── GaugeCard ───────────────────────────────────────────────────────────────
interface GaugeCardProps {
  title: string
  subtitle: string
  value: number | null
  prev: number | null
  loading: boolean
  min: number
  max: number
  greenMax: number
  redMin: number
  format: (v: number) => string
  /** Optional override for how the change delta is formatted */
  formatDelta?: (delta: number) => string
}

function GaugeCard({
  title,
  subtitle,
  value,
  prev,
  loading,
  min,
  max,
  greenMax,
  redMin,
  format,
  formatDelta,
}: GaugeCardProps) {
  const delta = value !== null && prev !== null ? value - prev : null
  const color = zoneColor(value, greenMax, redMin)
  const fmtDelta = formatDelta ?? ((d: number) => `${d >= 0 ? '+' : ''}${format(Math.abs(d))}`)

  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-3 flex flex-col gap-1">
      {/* Title row */}
      <div className="flex items-start justify-between gap-1 min-h-[2.5rem]">
        <p className="text-xs font-semibold text-text-primary leading-tight">{title}</p>
        {delta !== null && (
          <span
            className="text-xs font-mono whitespace-nowrap shrink-0 mt-0.5"
            style={{ color }}
          >
            ({fmtDelta(delta)})
          </span>
        )}
      </div>

      {/* Gauge SVG */}
      <GaugeChart
        value={value}
        min={min}
        max={max}
        greenMax={greenMax}
        redMin={redMin}
        format={format}
        loading={loading}
      />

      {/* Thresholds + subtitle */}
      <div className="flex items-center justify-between text-[10px] font-mono mt-0.5">
        <span style={{ color: '#22c55e' }}>Green &lt; {format(greenMax)}</span>
        <span style={{ color: '#ef4444' }}>Red &gt; {format(redMin)}</span>
      </div>
      <p className="text-[10px] text-text-muted leading-tight">{subtitle}</p>
    </div>
  )
}

// ─── OverviewSection ─────────────────────────────────────────────────────────
export function OverviewSection() {
  const { fredApiKey } = useApp()

  // All FRED series for gauges
  // Daily series — start 2025 to keep fetches small
  const S = '2025-01-01'
  const move   = useFRED('BAMLMOVE',          fredApiKey, { frequency: 'd', observationStart: S })
  const vix    = useFRED('VIXCLS',            fredApiKey, { frequency: 'd', observationStart: S })
  const sofr   = useFRED('SOFR',              fredApiKey, { frequency: 'd', observationStart: S })
  const iorb   = useFRED('IORB',              fredApiKey, { frequency: 'd', observationStart: S })
  const us30y  = useFRED('DGS30',             fredApiKey, { frequency: 'd', observationStart: S })
  const us10y  = useFRED('DGS10',             fredApiKey, { frequency: 'd', observationStart: S })
  // DEXJPUS = Japanese Yen per 1 USD (same scale as USDJPY, e.g. 150)
  const usdjpy = useFRED('DEXJPUS',           fredApiKey, { frequency: 'd', observationStart: S })
  // DTWEXBGS = Nominal Broad US Dollar Index (goods), base 2006=100
  // Scale ~90–130; thresholds adjusted to match this index (not ICE DXY)
  const dxy    = useFRED('DTWEXBGS',          fredApiKey, { frequency: 'w', observationStart: '2024-01-01' })
  const wti    = useFRED('DCOILWTICO',        fredApiKey, { frequency: 'd', observationStart: S })
  const gold   = useFRED('GOLDAMGBD228NLBM',  fredApiKey, { frequency: 'd', observationStart: S })
  // DEXCHUS = Chinese Yuan per 1 USD (e.g. 7.2 = ¥7.2 per $1)
  const cny    = useFRED('DEXCHUS',           fredApiKey, { frequency: 'd', observationStart: S })
  // SLVPRUSD = Silver Fixing Price London 12:00 noon, USD per troy oz (daily)
  const silver = useFRED('SLVPRUSD',          fredApiKey, { frequency: 'd', observationStart: S })
  // PCOPPUSDM = Copper, USD per metric ton (monthly)
  const copper = useFRED('PCOPPUSDM',         fredApiKey, { frequency: 'm', observationStart: '2024-01-01' })
  // CBBTCUSD = CoinBase Bitcoin USD (daily)
  const btc    = useFRED('CBBTCUSD',          fredApiKey, { frequency: 'd', observationStart: S })

  // ── Derived metrics ─────────────────────────────────────────────────────────

  // SOFR − IORB spread
  const sofrIorbLast = sofr.lastValue !== null && iorb.lastValue !== null
    ? sofr.lastValue - iorb.lastValue : null
  const sofrIorbPrev = sofr.prevValue !== null && iorb.prevValue !== null
    ? sofr.prevValue - iorb.prevValue : null

  // Gold in Chinese Yuan per troy oz
  const goldCnyLast = gold.lastValue !== null && cny.lastValue !== null
    ? gold.lastValue * cny.lastValue : null
  const goldCnyPrev = gold.prevValue !== null && cny.prevValue !== null
    ? gold.prevValue * cny.prevValue : null

  // Gold / Oil ratio (how many barrels per oz of gold)
  const goldOilLast = gold.lastValue !== null && wti.lastValue !== null && wti.lastValue > 0
    ? gold.lastValue / wti.lastValue : null
  const goldOilPrev = gold.prevValue !== null && wti.prevValue !== null && wti.prevValue > 0
    ? gold.prevValue / wti.prevValue : null

  // Gold / Silver ratio
  const goldSilverLast = gold.lastValue !== null && silver.lastValue !== null && silver.lastValue > 0
    ? gold.lastValue / silver.lastValue : null
  const goldSilverPrev = gold.prevValue !== null && silver.prevValue !== null && silver.prevValue > 0
    ? gold.prevValue / silver.prevValue : null

  // Copper / Silver ratio: PCOPPUSDM is USD/metric ton → /2204.62 → USD/lb
  // Ratio = (copper USD/lb) / (silver USD/oz) — dimensionally mixed but gives 0.1–0.3 range
  const copperLb     = copper.lastValue !== null ? copper.lastValue / 2204.62 : null
  const copperLbPrev = copper.prevValue !== null ? copper.prevValue / 2204.62 : null
  const cuAgLast = copperLb !== null && silver.lastValue !== null && silver.lastValue > 0
    ? copperLb / silver.lastValue : null
  const cuAgPrev = copperLbPrev !== null && silver.prevValue !== null && silver.prevValue > 0
    ? copperLbPrev / silver.prevValue : null

  if (!fredApiKey) {
    return (
      <div className="section-enter flex items-center justify-center py-24">
        <div className="text-center bg-bg-card border border-bg-border rounded-xl p-8">
          <p className="text-text-secondary text-sm mb-1">Add your free FRED API key in</p>
          <p className="text-text-secondary text-sm">
            <span className="text-accent-teal">Settings ⚙</span> to unlock all macro gauges
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="section-enter flex flex-col gap-4">
      <p className="text-xs text-text-muted">
        Real-time macro risk gauges — FRED API. Green zone = benign, yellow = caution, red = stress.
        Daily change in parentheses.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">

        {/* 1. Bond market volatility — MOVE */}
        <GaugeCard
          title="Bond Volatility — MOVE"
          subtitle="ICE BofA MOVE Index (FRED: BAMLMOVE)"
          value={move.lastValue}
          prev={move.prevValue}
          loading={move.loading}
          min={0} max={200} greenMax={70} redMin={140}
          format={(v) => v.toFixed(1)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(1)}`}
        />

        {/* 2. Equity market volatility — VIX */}
        <GaugeCard
          title="Equity Volatility — VIX"
          subtitle="CBOE Volatility Index (FRED: VIXCLS)"
          value={vix.lastValue}
          prev={vix.prevValue}
          loading={vix.loading}
          min={0} max={80} greenMax={14} redMin={28}
          format={(v) => v.toFixed(1)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(2)}`}
        />

        {/* 3. US banking stress — SOFR minus IORB */}
        <GaugeCard
          title="US Banking Stress — SOFR−IORB"
          subtitle="Repo stress proxy. Neg = excess reserves (FRED: SOFR, IORB)"
          value={sofrIorbLast}
          prev={sofrIorbPrev}
          loading={sofr.loading || iorb.loading}
          min={-0.2} max={0.5} greenMax={0} redMin={0.1}
          format={(v) => `${v.toFixed(3)}%`}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(3)}%`}
        />

        {/* 4. US fiscal pressure — US 30Y */}
        <GaugeCard
          title="US Fiscal Pressure — 30Y"
          subtitle="US 30Y Treasury yield (FRED: DGS30)"
          value={us30y.lastValue}
          prev={us30y.prevValue}
          loading={us30y.loading}
          min={0} max={8} greenMax={2.5} redMin={5.0}
          format={(v) => `${v.toFixed(2)}%`}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)} bps`}
        />

        {/* 5. US fiscal pressure — US 10Y */}
        <GaugeCard
          title="US Fiscal Pressure — 10Y"
          subtitle="US 10Y Treasury yield (FRED: DGS10)"
          value={us10y.lastValue}
          prev={us10y.prevValue}
          loading={us10y.loading}
          min={0} max={7} greenMax={2.0} redMin={4.5}
          format={(v) => `${v.toFixed(2)}%`}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)} bps`}
        />

        {/* 6. Japan hyperinflation — USDJPY */}
        <GaugeCard
          title="JPY Hyperinflation — USD/JPY"
          subtitle="Yen per USD. >160 = BoJ/carry crisis (FRED: DEXJPUS)"
          value={usdjpy.lastValue}
          prev={usdjpy.prevValue}
          loading={usdjpy.loading}
          min={80} max={200} greenMax={100} redMin={160}
          format={(v) => v.toFixed(1)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(2)}`}
        />

        {/* 7. USD strength — Broad Dollar Index */}
        <GaugeCard
          title="USD Strength — Broad Dollar"
          subtitle="Nominal Broad Dollar Index base 2006=100 (FRED: DTWEXBGS) — not ICE DXY"
          value={dxy.lastValue}
          prev={dxy.prevValue}
          loading={dxy.loading}
          min={90} max={135} greenMax={100} redMin={120}
          format={(v) => v.toFixed(1)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(2)}`}
        />

        {/* 8. Energy — WTI Oil */}
        <GaugeCard
          title="Energy — WTI Crude Oil"
          subtitle="West Texas Intermediate spot, USD/bbl (FRED: DCOILWTICO)"
          value={wti.lastValue}
          prev={wti.prevValue}
          loading={wti.loading}
          min={0} max={200} greenMax={60} redMin={120}
          format={(v) => `$${v.toFixed(0)}`}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}$${Math.abs(d).toFixed(2)}`}
        />

        {/* 9. Gold renaissance — Gold in Chinese Yuan */}
        <GaugeCard
          title="Gold Renaissance — Gold/CNY"
          subtitle="Gold price in Chinese Yuan per troy oz (FRED: GOLD × DEXCHUS)"
          value={goldCnyLast}
          prev={goldCnyPrev}
          loading={gold.loading || cny.loading}
          min={0} max={50000} greenMax={30000} redMin={35000}
          format={(v) => `¥${(v / 1000).toFixed(1)}k`}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}¥${Math.abs(d / 1000).toFixed(1)}k`}
        />

        {/* 10. Gold/Oil ratio */}
        <GaugeCard
          title="Commodity Ratio — Gold/Oil"
          subtitle="Barrels of WTI per oz of gold. Rising = gold outperforming energy"
          value={goldOilLast}
          prev={goldOilPrev}
          loading={gold.loading || wti.loading}
          min={0} max={60} greenMax={20} redMin={40}
          format={(v) => v.toFixed(1)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(2)}`}
        />

        {/* 11. Gold/Silver ratio */}
        <GaugeCard
          title="Commodity Ratio — Gold/Silver"
          subtitle="Oz of gold per oz of silver. <25 = silver bull; >120 = extreme stress"
          value={goldSilverLast}
          prev={goldSilverPrev}
          loading={gold.loading || silver.loading}
          min={0} max={150} greenMax={25} redMin={120}
          format={(v) => v.toFixed(1)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(2)}`}
        />

        {/* 12. Copper/Silver ratio */}
        <GaugeCard
          title="Commodity Ratio — Cu/Ag"
          subtitle="(Cu USD/lb) ÷ (Ag USD/oz). Copper monthly data (FRED: PCOPPUSDM, SLVPRUSD)"
          value={cuAgLast}
          prev={cuAgPrev}
          loading={copper.loading || silver.loading}
          min={0} max={0.4} greenMax={0.1} redMin={0.3}
          format={(v) => v.toFixed(3)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(4)}`}
        />

        {/* 13. Bitcoin */}
        <GaugeCard
          title="Bitcoin Bear Market Thermometer"
          subtitle="BTC/USD spot (FRED: CBBTCUSD via CoinBase)"
          value={btc.lastValue}
          prev={btc.prevValue}
          loading={btc.loading}
          min={0} max={200000} greenMax={65000} redMin={95000}
          format={(v) => `$${(v / 1000).toFixed(0)}k`}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}$${Math.abs(d / 1000).toFixed(1)}k`}
        />

      </div>
    </div>
  )
}
