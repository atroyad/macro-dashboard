import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { useYahoo } from '../hooks/useYahoo'
import { useDeribitDVOL } from '../hooks/useDeribitDVOL'
import { GaugeChart, deltaColor as getDeltaColor } from '../components/charts/GaugeChart'

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
  const vix      = useFRED('VIXCLS',         fredApiKey, { frequency: 'd', observationStart: S })
  const sofr     = useFRED('SOFR',           fredApiKey, { frequency: 'd', observationStart: S })
  const iorb     = useFRED('IORB',           fredApiKey, { frequency: 'd', observationStart: S })
  const us30y    = useFRED('DGS30',          fredApiKey, { frequency: 'd', observationStart: S })
  const us10y    = useFRED('DGS10',          fredApiKey, { frequency: 'd', observationStart: S })
  const effr     = useFRED('DFF',            fredApiKey, { frequency: 'd', observationStart: S })
  const usdjpy   = useFRED('DEXJPUS',        fredApiKey, { frequency: 'd', observationStart: S })
  const wtiS     = useFRED('DCOILWTICO',     fredApiKey, { frequency: 'd', observationStart: S })
  const brentS   = useFRED('DCOILBRENTEU',   fredApiKey, { frequency: 'd', observationStart: S })
  const btc      = useFRED('CBBTCUSD',       fredApiKey, { frequency: 'd', observationStart: S })
  const loans    = useFRED('LOANS',          fredApiKey, { units: 'pc1', observationStart: '2024-01-01' })
  // Buffett Indicator: Wilshire 5000 total market cap ($B) ÷ GDP ($B)
  const wilshire = useFRED('WILL5000INDFC',  fredApiKey, { frequency: 'q', observationStart: '2000-01-01' })
  const gdp      = useFRED('GDP',            fredApiKey, { frequency: 'q', observationStart: '2000-01-01' })

  // ── Yahoo Finance ─────────────────────────────────────────────────────────
  const move = useYahoo('^MOVE')      // ICE BofA MOVE Index
  const dxy  = useYahoo('DX-Y.NYB')  // ICE Dollar Index
  const gcf  = useYahoo('GC=F')      // Gold USD/oz
  const sif  = useYahoo('SI=F')      // Silver USD/oz
  const hgf  = useYahoo('HG=F')      // Copper USD/lb
  const cnyx = useYahoo('CNY=X')     // USD/CNY rate
  const clf  = useYahoo('CL=F')      // NYMEX WTI front-month
  const bzf  = useYahoo('BZ=F')      // ICE Brent front-month

  // ── Deribit ───────────────────────────────────────────────────────────────
  const bviv = useDeribitDVOL()      // BTC DVOL (30-day implied vol)

  // ── Derived ───────────────────────────────────────────────────────────────

  const sofrIorbV = sofr.lastValue !== null && iorb.lastValue !== null
    ? sofr.lastValue - iorb.lastValue : null
  const sofrIorbP = sofr.prevValue !== null && iorb.prevValue !== null
    ? sofr.prevValue - iorb.prevValue : null

  // 10Y minus EFFR (both in %, difference = bps/100)
  const spreadV = us10y.lastValue !== null && effr.lastValue !== null
    ? us10y.lastValue - effr.lastValue : null
  const spreadP = us10y.prevValue !== null && effr.prevValue !== null
    ? us10y.prevValue - effr.prevValue : null

  // Buffett Indicator: WILL5000INDFC ($B) / GDP ($B) × 100 = %
  const { buffettV, buffettP } = useMemo(() => {
    const wLast = wilshire.lastValue
    const wPrev = wilshire.prevValue
    const gLast = gdp.lastValue
    const gPrev = gdp.prevValue
    return {
      buffettV: wLast !== null && gLast !== null && gLast > 0 ? (wLast / gLast) * 100 : null,
      buffettP: wPrev !== null && gPrev !== null && gPrev > 0 ? (wPrev / gPrev) * 100 : null,
    }
  }, [wilshire.lastValue, wilshire.prevValue, gdp.lastValue, gdp.prevValue])

  // Gold in CNY
  const goldCnyV = gcf.value !== null && cnyx.value !== null ? gcf.value * cnyx.value : null
  const goldCnyP = gcf.prev  !== null && cnyx.prev  !== null ? gcf.prev  * cnyx.prev  : null

  // Gold/Oil — GC=F ÷ CL=F
  const goldOilV = gcf.value !== null && clf.value !== null && clf.value > 0 ? gcf.value / clf.value : null
  const goldOilP = gcf.prev  !== null && clf.prev  !== null && clf.prev  > 0 ? gcf.prev  / clf.prev  : null

  // Gold/Silver — GC=F ÷ SI=F
  const gsV = gcf.value !== null && sif.value !== null && sif.value > 0 ? gcf.value / sif.value : null
  const gsP = gcf.prev  !== null && sif.prev  !== null && sif.prev  > 0 ? gcf.prev  / sif.prev  : null

  // Copper/Silver — HG=F ÷ SI=F
  const cuAgV = hgf.value !== null && sif.value !== null && sif.value > 0 ? hgf.value / sif.value : null
  const cuAgP = hgf.prev  !== null && sif.prev  !== null && sif.prev  > 0 ? hgf.prev  / sif.prev  : null

  // Bitcoin/Gold ratio — BTC ÷ gold price = oz of gold 1 BTC can buy
  const btcGoldV = btc.lastValue !== null && gcf.value !== null && gcf.value > 0 ? btc.lastValue / gcf.value : null
  const btcGoldP = btc.prevValue !== null && gcf.prev  !== null && gcf.prev  > 0 ? btc.prevValue / gcf.prev  : null

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
        Macro risk gauges. Arc zones match needle color: green = favorable reading, red = stress/risk.
        Day-over-day delta follows the same scheme — rising is green when a higher value is favorable,
        red when a lower value is favorable.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">

        {/* 1 ── MOVE ── falling=good, green at low ─────────────────────────── */}
        {(() => {
          const delta = move.value !== null && move.prev !== null ? move.value - move.prev : null
          return (
            <GaugeCard title="Bond Volatility — MOVE"
              subtitle="ICE BofA MOVE Index. >100=elevated; >150=crisis"
              source="Yahoo ^MOVE"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(1)}`}>
              <GaugeChart value={move.value} min={0} max={200} greenMax={70} redMin={140}
                format={(v) => v.toFixed(1)} loading={move.loading}
                greenLabel="Calm" yellowLabel="Elevated" redLabel="Crisis" />
            </GaugeCard>
          )
        })()}

        {/* 2 ── VIX ── falling=good, green at low ──────────────────────────── */}
        {(() => {
          const delta = vix.lastValue !== null && vix.prevValue !== null ? vix.lastValue - vix.prevValue : null
          return (
            <GaugeCard title="Equity Volatility — VIX"
              subtitle="CBOE VIX. >14=caution; >28=fear; >40=panic"
              source="FRED VIXCLS"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}`}>
              <GaugeChart value={vix.lastValue} min={0} max={80} greenMax={14} redMin={28}
                format={(v) => v.toFixed(1)} loading={vix.loading}
                greenLabel="Calm" yellowLabel="Caution" redLabel="Panic" />
            </GaugeCard>
          )
        })()}

        {/* 3 ── SOFR−IORB ── falling=good, green at low ────────────────────── */}
        {(() => {
          const delta = sofrIorbV !== null && sofrIorbP !== null ? sofrIorbV - sofrIorbP : null
          return (
            <GaugeCard title="US Banking Stress — SOFR−IORB"
              subtitle="Repo stress proxy. <0=excess reserves; >0.10%=reserves scarce"
              source="FRED SOFR, IORB"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(3)}%`}>
              <GaugeChart value={sofrIorbV} min={-0.2} max={0.5} greenMax={0} redMin={0.1}
                format={(v) => `${v.toFixed(3)}%`} loading={sofr.loading || iorb.loading}
                greenLabel="Easy" yellowLabel="Tighter" redLabel="Stress" />
            </GaugeCard>
          )
        })()}

        {/* 4 ── US 30Y ── falling=good, green at low ───────────────────────── */}
        {(() => {
          const delta = us30y.lastValue !== null && us30y.prevValue !== null ? us30y.lastValue - us30y.prevValue : null
          return (
            <GaugeCard title="US Fiscal Pressure — 30Y"
              subtitle="30Y Treasury yield. >5%=fiscal dominance / monetization risk"
              source="FRED DGS30"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d * 100).toFixed(1)} bps`}>
              <GaugeChart value={us30y.lastValue} min={0} max={8} greenMax={2.5} redMin={5}
                format={(v) => `${v.toFixed(2)}%`} loading={us30y.loading}
                greenLabel="Low" yellowLabel="Normal" redLabel="High" />
            </GaugeCard>
          )
        })()}

        {/* 5 ── US 10Y ── falling=good, green at low ───────────────────────── */}
        {(() => {
          const delta = us10y.lastValue !== null && us10y.prevValue !== null ? us10y.lastValue - us10y.prevValue : null
          return (
            <GaugeCard title="US Fiscal Pressure — 10Y"
              subtitle="10Y Treasury yield. >4.5%=debt refinancing cliff"
              source="FRED DGS10"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d * 100).toFixed(1)} bps`}>
              <GaugeChart value={us10y.lastValue} min={0} max={7} greenMax={2} redMin={4.5}
                format={(v) => `${v.toFixed(2)}%`} loading={us10y.loading}
                greenLabel="Low" yellowLabel="Normal" redLabel="High" />
            </GaugeCard>
          )
        })()}

        {/* 6 ── 10Y − EFFR ── rising=good, green at high (risk-on=green) ───── */}
        {(() => {
          const delta = spreadV !== null && spreadP !== null ? spreadV - spreadP : null
          return (
            <GaugeCard title="Risk Sentiment — 10Y minus EFFR"
              subtitle="Yield spread. <0 bps=risk-off (inverted curve); >100 bps=risk-on (steep)"
              source="FRED DGS10, DFF"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `${Math.abs(d * 100).toFixed(0)} bps`}>
              {/* inverted=true: left=red (negative spread), right=green (steep curve) */}
              <GaugeChart value={spreadV} min={-2} max={4}
                greenMax={1} redMin={0}
                inverted
                format={(v) => `${(v * 100).toFixed(0)} bps`}
                loading={us10y.loading || effr.loading}
                greenLabel="Risk On" yellowLabel="Flat" redLabel="Risk Off" />
            </GaugeCard>
          )
        })()}

        {/* 7 ── Buffett Indicator ── falling=good, green at low ────────────── */}
        {(() => {
          const delta = buffettV !== null && buffettP !== null ? buffettV - buffettP : null
          return (
            <GaugeCard title="Buffett Indicator — Market Cap / GDP"
              subtitle="Wilshire 5000 ÷ GDP. <100%=fair value; >150%=significantly overvalued"
              source="FRED WILL5000INDFC, GDP"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(1)}%`}>
              <GaugeChart value={buffettV} min={50} max={250} greenMax={100} redMin={150}
                format={(v) => `${v.toFixed(0)}%`}
                loading={wilshire.loading || gdp.loading}
                greenLabel="Undervalued" yellowLabel="Elevated" redLabel="Overvalued" />
            </GaugeCard>
          )
        })()}

        {/* 8 ── USD/JPY ── falling=good, green at low ──────────────────────── */}
        {(() => {
          const delta = usdjpy.lastValue !== null && usdjpy.prevValue !== null ? usdjpy.lastValue - usdjpy.prevValue : null
          return (
            <GaugeCard title="JPY Hyperinflation — USD/JPY"
              subtitle="Yen per USD. >160=BoJ yield curve stress + $4T carry trade unwind risk"
              source="FRED DEXJPUS"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}`}>
              <GaugeChart value={usdjpy.lastValue} min={80} max={200} greenMax={100} redMin={160}
                format={(v) => v.toFixed(1)} loading={usdjpy.loading}
                greenLabel="Strong ¥" yellowLabel="Weak" redLabel="Crisis" />
            </GaugeCard>
          )
        })()}

        {/* 9 ── DXY ── falling=good, green at low ──────────────────────────── */}
        {(() => {
          const delta = dxy.value !== null && dxy.prev !== null ? dxy.value - dxy.prev : null
          return (
            <GaugeCard title="USD Strength — DXY (ICE)"
              subtitle="ICE Dollar Index. <90=weak USD; >110=strong dollar EM debt pressure"
              source="Yahoo DX-Y.NYB"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}`}>
              <GaugeChart value={dxy.value} min={75} max={125} greenMax={90} redMin={110}
                format={(v) => v.toFixed(1)} loading={dxy.loading}
                greenLabel="Weak $" yellowLabel="Normal" redLabel="Strong $" />
            </GaugeCard>
          )
        })()}

        {/* 10 ── Loans YoY ── rising=good, green at high (expansion=green) ─── */}
        {(() => {
          const delta = loans.lastValue !== null && loans.prevValue !== null ? loans.lastValue - loans.prevValue : null
          return (
            <GaugeCard title="Credit Pulse — Loans & Leases YoY"
              subtitle="Commercial bank loans, YoY % change. Expansion=green: credit flows to real economy, not financial assets."
              source="FRED LOANS pc1"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}%`}>
              {/* inverted=true: left=red (contraction), right=green (expansion) */}
              <GaugeChart value={loans.lastValue} min={-5} max={20}
                greenMax={8} redMin={4}
                inverted
                format={(v) => `${v.toFixed(1)}%`} loading={loans.loading}
                greenLabel="Expansion" yellowLabel="Tepid" redLabel="Contraction" />
            </GaugeCard>
          )
        })()}

        {/* 11 ── Gold USD ── rising=good, green at high ────────────────────── */}
        {(() => {
          const delta = gcf.value !== null && gcf.prev !== null ? gcf.value - gcf.prev : null
          return (
            <GaugeCard title="Gold Renaissance — Gold (USD/oz)"
              subtitle="COMEX front-month. Green=repricing / gold bull thesis; Red=deep value zone"
              source="Yahoo GC=F"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `$${Math.abs(d).toFixed(0)}`}>
              {/* inverted=true: left=red (cheap), right=green (expensive / repricing) */}
              <GaugeChart value={gcf.value} min={2500} max={7000}
                greenMax={5500} redMin={3500}
                inverted
                format={(v) => `$${(v / 1000).toFixed(1)}k`} loading={gcf.loading}
                greenLabel="Repricing" yellowLabel="Consolidation" redLabel="Deep Value" />
            </GaugeCard>
          )
        })()}

        {/* 12 ── Gold CNY ── rising=good, green at high ────────────────────── */}
        {(() => {
          const delta = goldCnyV !== null && goldCnyP !== null ? goldCnyV - goldCnyP : null
          return (
            <GaugeCard title="Gold/CNY — Yuan per Oz"
              subtitle="Gold in Chinese Yuan. High=repricing / de-dollarization; Low=deep value"
              source="Yahoo GC=F × CNY=X"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `¥${Math.abs(d / 1000).toFixed(1)}k`}>
              <GaugeChart value={goldCnyV} min={20000} max={50000}
                greenMax={35000} redMin={25000}
                inverted
                format={(v) => `¥${(v / 1000).toFixed(0)}k`} loading={gcf.loading || cnyx.loading}
                greenLabel="Repricing" yellowLabel="Consolidation" redLabel="Deep Value" />
            </GaugeCard>
          )
        })()}

        {/* 13 ── Oil Spot ── falling=good, green at low ────────────────────── */}
        {(() => {
          const delta = wtiS.lastValue !== null && wtiS.prevValue !== null ? wtiS.lastValue - wtiS.prevValue : null
          return (
            <GaugeCard title="Energy — Oil Spot (WTI + Brent)"
              subtitle="WTI Cushing & Brent Dated spot. Highest price shown in color."
              source="FRED spot series"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `WTI $${Math.abs(d).toFixed(2)}`}>
              <GaugeChart
                needles={[
                  { value: wtiS.lastValue,   color: '#3b82f6', label: 'WTI'   },
                  { value: brentS.lastValue, color: '#f59e0b', label: 'Brent' },
                ]}
                min={0} max={200} greenMax={60} redMin={120}
                format={(v) => `$${v.toFixed(0)}`}
                loading={wtiS.loading || brentS.loading}
                greenLabel="Cheap" yellowLabel="Normal" redLabel="Expensive" />
            </GaugeCard>
          )
        })()}

        {/* 14 ── Oil Futures ── falling=good, green at low ─────────────────── */}
        {(() => {
          const delta = clf.value !== null && clf.prev !== null ? clf.value - clf.prev : null
          return (
            <GaugeCard title="Energy — Oil Futures (Front Month)"
              subtitle="WTI + Brent front-month futures — same delivery horizon."
              source="Yahoo CL=F BZ=F"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `WTI $${Math.abs(d).toFixed(2)}`}>
              <GaugeChart
                needles={[
                  { value: clf.value, color: '#3b82f6', label: 'WTI'   },
                  { value: bzf.value, color: '#f59e0b', label: 'Brent' },
                ]}
                min={0} max={200} greenMax={60} redMin={120}
                format={(v) => `$${v.toFixed(0)}`}
                loading={clf.loading || bzf.loading}
                greenLabel="Cheap" yellowLabel="Normal" redLabel="Expensive" />
            </GaugeCard>
          )
        })()}

        {/* 15 ── Gold/Oil ── rising=good, green at high ────────────────────── */}
        {(() => {
          const delta = goldOilV !== null && goldOilP !== null ? goldOilV - goldOilP : null
          return (
            <GaugeCard title="Gold/Oil Ratio (Howell)"
              subtitle="Barrels of WTI per oz of gold. Rising = excess monetary liquidity vs real economy"
              source="Yahoo GC=F ÷ CL=F"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}×`}>
              <GaugeChart value={goldOilV} min={5} max={60} greenMax={20} redMin={40}
                format={(v) => `${v.toFixed(1)}×`} loading={gcf.loading || clf.loading}
                greenLabel="Normal" yellowLabel="Elevated" redLabel="Extreme" />
            </GaugeCard>
          )
        })()}

        {/* 16 ── Gold/Silver ── neutral (no inherent good/bad direction) ─────── */}
        {(() => {
          const delta = gsV !== null && gsP !== null ? gsV - gsP : null
          return (
            <GaugeCard title="Gold/Silver Ratio"
              subtitle="Oz of silver per oz of gold. Rotate signal — neither direction is inherently good."
              source="Yahoo GC=F ÷ SI=F"
              delta={delta} deltaColor="#64748b"
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}`}>
              <GaugeChart value={gsV} min={0} max={150} greenMax={25} redMin={120}
                neutral
                format={(v) => v.toFixed(1)} loading={gcf.loading || sif.loading}
                greenLabel="Rotate Silver" yellowLabel="Normal" redLabel="Rotate Gold" />
            </GaugeCard>
          )
        })()}

        {/* 17 ── Copper/Silver ── neutral ───────────────────────────────────── */}
        {(() => {
          const delta = cuAgV !== null && cuAgP !== null ? cuAgV - cuAgP : null
          return (
            <GaugeCard title="Copper/Silver Ratio (Cu/Ag)"
              subtitle="HG=F ($/lb) ÷ SI=F ($/oz). Rotate signal — no inherently good direction."
              source="Yahoo HG=F ÷ SI=F"
              delta={delta} deltaColor="#64748b"
              formatDelta={(d) => `${Math.abs(d).toFixed(4)}`}>
              <GaugeChart value={cuAgV} min={0} max={0.4} greenMax={0.1} redMin={0.3}
                neutral
                format={(v) => v.toFixed(3)} loading={hgf.loading || sif.loading}
                greenLabel="Rotate Silver" yellowLabel="Normal" redLabel="Rotate Copper" />
            </GaugeCard>
          )
        })()}

        {/* 18 ── Bitcoin ── rising=good, green at high ─────────────────────── */}
        {(() => {
          const delta = btc.lastValue !== null && btc.prevValue !== null ? btc.lastValue - btc.prevValue : null
          return (
            <GaugeCard title="Bitcoin Thermometer"
              subtitle="BTC/USD. Bull market confirmation when price is high; accumulation zone at low."
              source="FRED CBBTCUSD"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `$${Math.abs(d / 1000).toFixed(1)}k`}>
              {/* inverted=true: left=red (bear), right=green (bull) */}
              <GaugeChart value={btc.lastValue} min={40000} max={200000}
                greenMax={95000} redMin={65000}
                inverted
                format={(v) => `$${(v / 1000).toFixed(0)}k`} loading={btc.loading}
                greenLabel="Bull Run" yellowLabel="Recovery" redLabel="Bear Zone" />
            </GaugeCard>
          )
        })()}

        {/* 19 ── Bitcoin/Gold ratio ── rising=good, green at high ──────────── */}
        {/* Value = BTC price ÷ Gold price = oz of gold 1 BTC can buy (~30 now) */}
        {(() => {
          const delta = btcGoldV !== null && btcGoldP !== null ? btcGoldV - btcGoldP : null
          return (
            <GaugeCard title="Bitcoin/Gold Ratio (oz gold per BTC)"
              subtitle="How many oz of gold 1 BTC buys. <15=BTC undervalued vs gold; >30=BTC repricing"
              source="FRED BTC ÷ Yahoo GC=F"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}oz`}>
              {/* inverted=true: left=red (<15 = BTC cheap), right=green (>30 = BTC expensive) */}
              <GaugeChart value={btcGoldV} min={0} max={60}
                greenMax={30} redMin={15}
                inverted
                format={(v) => `${v.toFixed(1)}oz`} loading={btc.loading || gcf.loading}
                greenLabel="BTC Re-pricing" yellowLabel="Balanced" redLabel="Rotate Gold" />
            </GaugeCard>
          )
        })()}

        {/* 20 ── Bitcoin DVOL ── falling=good, green at low ────────────────── */}
        {(() => {
          const delta = bviv.value !== null && bviv.prev !== null ? bviv.value - bviv.prev : null
          return (
            <GaugeCard title="Bitcoin Volatility — DVOL"
              subtitle="Deribit BTC 30-day implied vol (equiv. BVIV). <40=calm; >70=extreme"
              source="Deribit DVOL"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(1)}`}>
              <GaugeChart value={bviv.value} min={0} max={150} greenMax={40} redMin={70}
                format={(v) => v.toFixed(1)} loading={bviv.loading}
                greenLabel="Calm" yellowLabel="Elevated" redLabel="Extreme" />
            </GaugeCard>
          )
        })()}

      </div>

      {/* Contextual notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-bg-card border border-bg-border rounded-xl px-4 py-3 text-[10.5px] text-text-muted leading-relaxed">
          <span className="text-text-secondary font-semibold">Howell Gold/Oil ratio: </span>
          Michael Howell (CrossBorder Capital) uses Gold ÷ WTI as a liquidity barometer.
          A rising ratio means monetary liquidity accumulates in stores of value faster than real
          economic demand. Above ~30× historically coincides with late-cycle monetary excess.
        </div>
        <div className="bg-bg-card border border-bg-border rounded-xl px-4 py-3 text-[10.5px] text-text-muted leading-relaxed">
          <span className="text-text-secondary font-semibold">Credit Pulse gauge — why expansion is green: </span>
          When bank loans grow rapidly ({'>'} 8% YoY), credit flows into the real economy — funding
          capex, hiring, and productive investment. From a financial-asset perspective this
          competes with markets for capital, but from a macro-health standpoint it confirms
          genuine economic expansion rather than financial engineering.
        </div>
        <div className="bg-bg-card border border-bg-border rounded-xl px-4 py-3 text-[10.5px] text-text-muted leading-relaxed">
          <span className="text-text-secondary font-semibold">Buffett Indicator: </span>
          Warren Buffett's preferred valuation gauge: total US equity market cap (Wilshire 5000,
          ~$B) ÷ GDP (~$B) × 100. Below 100% = fair/undervalued (Buffett has called this
          "playing with fire" above 100%). Above 150% has historically preceded significant
          corrections (dot-com 190%, 2021 peak ~220%).
        </div>
      </div>
    </div>
  )
}
