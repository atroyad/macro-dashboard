import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { useYahoo } from '../hooks/useYahoo'
import { GaugeChart, zoneColor } from '../components/charts/GaugeChart'

// ─── GaugeCard ───────────────────────────────────────────────────────────────
interface GaugeCardProps {
  title: string
  subtitle: string
  source?: string
  delta: number | null
  deltaColor: string
  formatDelta: (d: number) => string
  children: React.ReactNode
}

function GaugeCard({ title, subtitle, source, delta, deltaColor, formatDelta, children }: GaugeCardProps) {
  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-start justify-between gap-1 min-h-[2.2rem]">
        <p className="text-[11px] font-semibold text-text-primary leading-tight">{title}</p>
        {delta !== null && (
          <span
            className="text-[11px] font-mono whitespace-nowrap shrink-0 leading-tight"
            style={{ color: deltaColor }}
          >
            ({delta >= 0 ? '+' : ''}{formatDelta(delta)})
          </span>
        )}
      </div>

      {children}

      <div className="flex items-center justify-between gap-1 mt-0.5">
        <p className="text-[9.5px] text-text-muted leading-tight truncate">{subtitle}</p>
        {source && (
          <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-muted shrink-0 font-mono">
            {source}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── OverviewSection ─────────────────────────────────────────────────────────
export function OverviewSection() {
  const { fredApiKey } = useApp()

  const S = '2025-01-01'

  // ── FRED ─────────────────────────────────────────────────────────────────
  const vix    = useFRED('VIXCLS',  fredApiKey, { frequency: 'd', observationStart: S })
  const sofr   = useFRED('SOFR',    fredApiKey, { frequency: 'd', observationStart: S })
  const iorb   = useFRED('IORB',    fredApiKey, { frequency: 'd', observationStart: S })
  const us30y  = useFRED('DGS30',   fredApiKey, { frequency: 'd', observationStart: S })
  const us10y  = useFRED('DGS10',   fredApiKey, { frequency: 'd', observationStart: S })
  const usdjpy = useFRED('DEXJPUS', fredApiKey, { frequency: 'd', observationStart: S })
  // WTI + Brent SPOT via FRED (daily, same-day equivalents)
  const wtiS   = useFRED('DCOILWTICO',   fredApiKey, { frequency: 'd', observationStart: S })
  const brentS = useFRED('DCOILBRENTEU', fredApiKey, { frequency: 'd', observationStart: S })
  // Bitcoin via FRED (CoinBase daily)
  const btc    = useFRED('CBBTCUSD', fredApiKey, { frequency: 'd', observationStart: S })

  // ── Yahoo Finance ─────────────────────────────────────────────────────────
  const move = useYahoo('^MOVE')      // ICE BofA MOVE Index
  const dxy  = useYahoo('DX-Y.NYB')  // ICE Dollar Index
  // Gold & Silver & Copper COMEX front-month
  const gcf  = useYahoo('GC=F')      // Gold USD/oz — also used for Gold USD gauge
  const sif  = useYahoo('SI=F')      // Silver USD/oz
  const hgf  = useYahoo('HG=F')      // Copper USD/lb
  // CNY per 1 USD from Yahoo (symbol: CNY=X)
  const cnyx = useYahoo('CNY=X')     // USD/CNY rate (e.g. 7.24)
  // Oil front-month futures — same delivery horizon
  const clf  = useYahoo('CL=F')      // NYMEX WTI front-month
  const bzf  = useYahoo('BZ=F')      // ICE Brent front-month
  // Murban (ICE Abu Dhabi) — MCO=F not in Yahoo database; use Oman DME crude OQD=F as
  // nearest proxy (same Persian Gulf / Hormuz exposure, same delivery region)
  const mcof = useYahoo('OQD=F')     // DME Oman crude front-month (Hormuz proxy)

  // ── Derived ───────────────────────────────────────────────────────────────

  // SOFR − IORB
  const sofrIorbV = sofr.lastValue !== null && iorb.lastValue !== null
    ? sofr.lastValue - iorb.lastValue : null
  const sofrIorbP = sofr.prevValue !== null && iorb.prevValue !== null
    ? sofr.prevValue - iorb.prevValue : null

  // Gold in CNY: GC=F (USD/oz) × CNY=X (CNY per USD)
  const goldCnyV = gcf.value !== null && cnyx.value !== null
    ? gcf.value * cnyx.value : null
  const goldCnyP = gcf.prev !== null && cnyx.prev !== null
    ? gcf.prev * cnyx.prev : null

  // Gold/Oil (Howell) — GC=F ÷ CL=F
  const goldOilV = gcf.value !== null && clf.value !== null && clf.value > 0
    ? gcf.value / clf.value : null
  const goldOilP = gcf.prev  !== null && clf.prev  !== null && clf.prev  > 0
    ? gcf.prev  / clf.prev  : null

  // Gold/Silver — GC=F ÷ SI=F
  const gsV = gcf.value !== null && sif.value !== null && sif.value > 0
    ? gcf.value / sif.value : null
  const gsP = gcf.prev  !== null && sif.prev  !== null && sif.prev  > 0
    ? gcf.prev  / sif.prev  : null

  // Copper/Silver — HG=F ÷ SI=F  (both per lb vs per oz — intentionally mixed, gives 0.1–0.3)
  const cuAgV = hgf.value !== null && sif.value !== null && sif.value > 0
    ? hgf.value / sif.value : null
  const cuAgP = hgf.prev  !== null && sif.prev  !== null && sif.prev  > 0
    ? hgf.prev  / sif.prev  : null

  if (!fredApiKey) {
    return (
      <div className="section-enter flex items-center justify-center py-24">
        <div className="text-center bg-bg-card border border-bg-border rounded-xl p-8 max-w-sm">
          <p className="text-text-secondary text-sm mb-1">Add your free FRED API key in</p>
          <p className="text-text-secondary text-sm">
            <span className="text-accent-teal">Settings ⚙</span> to unlock all macro gauges
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="section-enter flex flex-col gap-3">
      <p className="text-[10.5px] text-text-muted leading-relaxed">
        Macro risk gauges. Arc zones:{' '}
        <span className="text-green-500 font-medium">green = safe</span>,{' '}
        <span className="text-yellow-500 font-medium">yellow = caution</span>,{' '}
        <span className="text-red-500 font-medium">red = stress</span>.
        Needle value shown in zone color. Multi-needle charts show highest price with its color.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">

        {/* 1 ── MOVE ───────────────────────────────────────────────────────── */}
        <GaugeCard
          title="Bond Volatility — MOVE"
          subtitle="ICE BofA MOVE Index. >100=elevated; >150=crisis"
          source="Yahoo ^MOVE"
          delta={move.value !== null && move.prev !== null ? move.value - move.prev : null}
          deltaColor={zoneColor(move.value, 70, 140)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(1)}`}
        >
          <GaugeChart
            value={move.value} min={0} max={200} greenMax={70} redMin={140}
            format={(v) => v.toFixed(1)} loading={move.loading}
            greenLabel="Calm" yellowLabel="Elevated" redLabel="Crisis"
          />
        </GaugeCard>

        {/* 2 ── VIX ────────────────────────────────────────────────────────── */}
        <GaugeCard
          title="Equity Volatility — VIX"
          subtitle="CBOE VIX. >14=caution; >28=fear; >40=panic"
          source="FRED VIXCLS"
          delta={vix.lastValue !== null && vix.prevValue !== null ? vix.lastValue - vix.prevValue : null}
          deltaColor={zoneColor(vix.lastValue, 14, 28)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(2)}`}
        >
          <GaugeChart
            value={vix.lastValue} min={0} max={80} greenMax={14} redMin={28}
            format={(v) => v.toFixed(1)} loading={vix.loading}
            greenLabel="Calm" yellowLabel="Caution" redLabel="Panic"
          />
        </GaugeCard>

        {/* 3 ── SOFR − IORB ─────────────────────────────────────────────────── */}
        <GaugeCard
          title="US Banking Stress — SOFR−IORB"
          subtitle="Repo stress proxy. Negative=excess reserves; >0.10%=reserves scarce"
          source="FRED SOFR, IORB"
          delta={sofrIorbV !== null && sofrIorbP !== null ? sofrIorbV - sofrIorbP : null}
          deltaColor={zoneColor(sofrIorbV, 0, 0.1)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(3)}%`}
        >
          <GaugeChart
            value={sofrIorbV} min={-0.2} max={0.5} greenMax={0} redMin={0.1}
            format={(v) => `${v.toFixed(3)}%`} loading={sofr.loading || iorb.loading}
            greenLabel="Easy" yellowLabel="Tighter" redLabel="Stress"
          />
        </GaugeCard>

        {/* 4 ── US 30Y ──────────────────────────────────────────────────────── */}
        <GaugeCard
          title="US Fiscal Pressure — 30Y"
          subtitle="30Y Treasury yield. >5%=fiscal dominance / monetization risk"
          source="FRED DGS30"
          delta={us30y.lastValue !== null && us30y.prevValue !== null ? us30y.lastValue - us30y.prevValue : null}
          deltaColor={zoneColor(us30y.lastValue, 2.5, 5)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)} bps`}
        >
          <GaugeChart
            value={us30y.lastValue} min={0} max={8} greenMax={2.5} redMin={5}
            format={(v) => `${v.toFixed(2)}%`} loading={us30y.loading}
            greenLabel="Low" yellowLabel="Normal" redLabel="High"
          />
        </GaugeCard>

        {/* 5 ── US 10Y ──────────────────────────────────────────────────────── */}
        <GaugeCard
          title="US Fiscal Pressure — 10Y"
          subtitle="10Y Treasury yield. >4.5%=debt refinancing cliff"
          source="FRED DGS10"
          delta={us10y.lastValue !== null && us10y.prevValue !== null ? us10y.lastValue - us10y.prevValue : null}
          deltaColor={zoneColor(us10y.lastValue, 2, 4.5)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)} bps`}
        >
          <GaugeChart
            value={us10y.lastValue} min={0} max={7} greenMax={2} redMin={4.5}
            format={(v) => `${v.toFixed(2)}%`} loading={us10y.loading}
            greenLabel="Low" yellowLabel="Normal" redLabel="High"
          />
        </GaugeCard>

        {/* 6 ── USD/JPY ─────────────────────────────────────────────────────── */}
        <GaugeCard
          title="JPY Hyperinflation — USD/JPY"
          subtitle="Yen per USD. >160=BoJ yield curve stress + $4T carry trade unwind risk"
          source="FRED DEXJPUS"
          delta={usdjpy.lastValue !== null && usdjpy.prevValue !== null ? usdjpy.lastValue - usdjpy.prevValue : null}
          deltaColor={zoneColor(usdjpy.lastValue, 100, 160)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(2)}`}
        >
          <GaugeChart
            value={usdjpy.lastValue} min={80} max={200} greenMax={100} redMin={160}
            format={(v) => v.toFixed(1)} loading={usdjpy.loading}
            greenLabel="Strong ¥" yellowLabel="Weak" redLabel="Crisis"
          />
        </GaugeCard>

        {/* 7 ── DXY (ICE, Yahoo) — green<90, red>110 ───────────────────────── */}
        <GaugeCard
          title="USD Strength — DXY (ICE)"
          subtitle="ICE Dollar Index. <90=weak USD; >110=strong dollar EM debt pressure"
          source="Yahoo DX-Y.NYB"
          delta={dxy.value !== null && dxy.prev !== null ? dxy.value - dxy.prev : null}
          deltaColor={zoneColor(dxy.value, 90, 110)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(2)}`}
        >
          <GaugeChart
            value={dxy.value} min={75} max={125} greenMax={90} redMin={110}
            format={(v) => v.toFixed(1)} loading={dxy.loading}
            greenLabel="Weak $" yellowLabel="Normal" redLabel="Strong $"
          />
        </GaugeCard>

        {/* 8 ── Gold USD/oz (Yahoo GC=F — live, no proxy lag) ─────────────── */}
        <GaugeCard
          title="Gold Renaissance — Gold (USD/oz)"
          subtitle="COMEX front-month. Green=deep value; Red=extreme repricing"
          source="Yahoo GC=F"
          delta={gcf.value !== null && gcf.prev !== null ? gcf.value - gcf.prev : null}
          deltaColor={zoneColor(gcf.value, 4000, 5500)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}$${Math.abs(d).toFixed(0)}`}
        >
          <GaugeChart
            value={gcf.value} min={2500} max={7000} greenMax={3500} redMin={5500}
            format={(v) => `$${(v / 1000).toFixed(1)}k`} loading={gcf.loading}
            greenLabel="Deep Value" yellowLabel="Consolidation" redLabel="Repricing"
          />
        </GaugeCard>

        {/* 9 ── Gold/CNY (GC=F × CNY=X) ────────────────────────────────────── */}
        <GaugeCard
          title="Gold/CNY — Yuan per Oz"
          subtitle="Gold priced in Chinese Yuan. Petrogold / de-dollarization signal"
          source="Yahoo GC=F × CNY=X"
          delta={goldCnyV !== null && goldCnyP !== null ? goldCnyV - goldCnyP : null}
          deltaColor={zoneColor(goldCnyV, 30000, 35000)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}¥${Math.abs(d / 1000).toFixed(1)}k`}
        >
          <GaugeChart
            value={goldCnyV} min={20000} max={50000} greenMax={25000} redMin={35000}
            format={(v) => `¥${(v / 1000).toFixed(0)}k`} loading={gcf.loading || cnyx.loading}
            greenLabel="Deep Value" yellowLabel="Consolidation" redLabel="Repricing"
          />
        </GaugeCard>

        {/* 10 ── Oil Spot — WTI + Brent (FRED same-day) ────────────────────── */}
        <GaugeCard
          title="Energy — Oil Spot (WTI + Brent)"
          subtitle="WTI Cushing & Brent Dated — same-day spot. Highest price shown in color."
          source="FRED spot series"
          delta={wtiS.lastValue !== null && wtiS.prevValue !== null ? wtiS.lastValue - wtiS.prevValue : null}
          deltaColor={zoneColor(wtiS.lastValue, 60, 120)}
          formatDelta={(d) => `WTI ${d >= 0 ? '+' : ''}$${Math.abs(d).toFixed(2)}`}
        >
          <GaugeChart
            needles={[
              { value: wtiS.lastValue,   color: '#3b82f6', label: 'WTI' },
              { value: brentS.lastValue, color: '#f59e0b', label: 'Brent' },
            ]}
            min={0} max={200} greenMax={60} redMin={120}
            format={(v) => `$${v.toFixed(0)}`}
            loading={wtiS.loading || brentS.loading}
            greenLabel="Cheap" yellowLabel="Normal" redLabel="Expensive"
          />
        </GaugeCard>

        {/* 11 ── Oil Futures — WTI + Brent + Murban (Yahoo) ────────────────── */}
        <GaugeCard
          title="Energy — Oil Futures (Front Month)"
          subtitle="WTI + Brent + Oman DME front-month — same delivery horizon. Highest shown. Oman crude = Persian Gulf / Hormuz price signal."
          source="Yahoo CL=F BZ=F OQD=F"
          delta={clf.value !== null && clf.prev !== null ? clf.value - clf.prev : null}
          deltaColor={zoneColor(clf.value, 60, 120)}
          formatDelta={(d) => `WTI ${d >= 0 ? '+' : ''}$${Math.abs(d).toFixed(2)}`}
        >
          <GaugeChart
            needles={[
              { value: clf.value,  color: '#3b82f6', label: 'WTI'    },
              { value: bzf.value,  color: '#f59e0b', label: 'Brent'  },
              { value: mcof.value, color: '#8b5cf6', label: 'Oman' },
            ]}
            min={0} max={200} greenMax={60} redMin={120}
            format={(v) => `$${v.toFixed(0)}`}
            loading={clf.loading || bzf.loading || mcof.loading}
            greenLabel="Cheap" yellowLabel="Normal" redLabel="Expensive"
          />
        </GaugeCard>

        {/* 12 ── Gold/Oil (Howell) ──────────────────────────────────────────── */}
        <GaugeCard
          title="Gold/Oil Ratio (Howell)"
          subtitle="Barrels of WTI per oz of gold. Howell: rising = excess monetary liquidity vs real economy"
          source="Yahoo GC=F ÷ CL=F"
          delta={goldOilV !== null && goldOilP !== null ? goldOilV - goldOilP : null}
          deltaColor={zoneColor(goldOilV, 20, 40)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(2)}×`}
        >
          <GaugeChart
            value={goldOilV} min={5} max={60} greenMax={20} redMin={40}
            format={(v) => `${v.toFixed(1)}×`} loading={gcf.loading || clf.loading}
            greenLabel="Normal" yellowLabel="Elevated" redLabel="Extreme"
          />
        </GaugeCard>

        {/* 13 ── Gold/Silver ratio ──────────────────────────────────────────── */}
        <GaugeCard
          title="Gold/Silver Ratio"
          subtitle="Oz of gold per oz of silver. <25=silver bull; >120=extreme undervaluation"
          source="Yahoo GC=F ÷ SI=F"
          delta={gsV !== null && gsP !== null ? gsV - gsP : null}
          deltaColor={zoneColor(gsV, 25, 120)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(2)}`}
        >
          <GaugeChart
            value={gsV} min={0} max={150} greenMax={25} redMin={120}
            format={(v) => v.toFixed(1)} loading={gcf.loading || sif.loading}
            greenLabel="Rotate Silver" yellowLabel="Normal" redLabel="Rotate Gold"
          />
        </GaugeCard>

        {/* 14 ── Copper/Silver ratio ────────────────────────────────────────── */}
        <GaugeCard
          title="Copper/Silver Ratio (Cu/Ag)"
          subtitle="HG=F (USD/lb) ÷ SI=F (USD/oz). Rising = industrial demand outpacing monetary silver"
          source="Yahoo HG=F ÷ SI=F"
          delta={cuAgV !== null && cuAgP !== null ? cuAgV - cuAgP : null}
          deltaColor={zoneColor(cuAgV, 0.1, 0.3)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(4)}`}
        >
          <GaugeChart
            value={cuAgV} min={0} max={0.4} greenMax={0.1} redMin={0.3}
            format={(v) => v.toFixed(3)} loading={hgf.loading || sif.loading}
            greenLabel="Rotate Silver" yellowLabel="Normal" redLabel="Rotate Copper"
          />
        </GaugeCard>

        {/* 15 ── Bitcoin ────────────────────────────────────────────────────── */}
        <GaugeCard
          title="Bitcoin Bear Market Thermometer"
          subtitle="BTC/USD. <$65k=deep value accumulation zone; >$95k=blow-off top risk"
          source="FRED CBBTCUSD"
          delta={btc.lastValue !== null && btc.prevValue !== null ? btc.lastValue - btc.prevValue : null}
          deltaColor={zoneColor(btc.lastValue, 65000, 95000)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}$${Math.abs(d / 1000).toFixed(1)}k`}
        >
          <GaugeChart
            value={btc.lastValue} min={40000} max={200000} greenMax={65000} redMin={95000}
            format={(v) => `$${(v / 1000).toFixed(0)}k`} loading={btc.loading}
            greenLabel="Deep Value" yellowLabel="Chopsolidation" redLabel="Bullish Again"
          />
        </GaugeCard>

      </div>

      {/* Contextual notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-bg-card border border-bg-border rounded-xl px-4 py-3 text-[10.5px] text-text-muted leading-relaxed">
          <span className="text-text-secondary font-semibold">Howell Gold/Oil ratio: </span>
          Michael Howell (CrossBorder Capital) uses Gold ÷ WTI as a liquidity barometer.
          A rising ratio means monetary liquidity is accumulating in stores of value faster than
          real economic demand. Historically a ratio above ~30× coincides with late-cycle
          monetary excess. He tracks this alongside his Global Liquidity Index (major CB
          balance sheets net of sterilization flows).
        </div>
        <div className="bg-bg-card border border-bg-border rounded-xl px-4 py-3 text-[10.5px] text-text-muted leading-relaxed">
          <span className="text-text-secondary font-semibold">Oman crude as Hormuz proxy: </span>
          Oman crude (DME, OQD=F) is priced at Fujairah — immediately east of the Strait of
          Hormuz. It is the de facto Asian/Persian Gulf benchmark and the primary pricing reference
          for Saudi, UAE, and Iranian exports to Asia. Any tanker flow disruption raises Oman
          crude disproportionately vs WTI/Brent. A widening Oman premium signals Hormuz stress
          before it appears in headline prices. Real-time vessel counts require commercial data
          (Kpler, Vortexa, MarineTraffic Enterprise). ICE Murban (MCO=F) is not available via
          Yahoo Finance — Oman DME is the closest freely-available equivalent.
        </div>
      </div>
    </div>
  )
}
