import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { useYahoo } from '../hooks/useYahoo'
import { useYahooHistory } from '../hooks/useYahooHistory'
import { useDeribitDVOL } from '../hooks/useDeribitDVOL'
import { GaugeChart, deltaColor as getDeltaColor } from '../components/charts/GaugeChart'

// ─── helpers ─────────────────────────────────────────────────────────────────
function daysAgo(isoDate: string | null): number | null {
  if (!isoDate) return null
  return Math.round((Date.now() - new Date(isoDate).getTime()) / 86_400_000)
}

function fmtDate(isoDate: string | null): string {
  if (!isoDate) return '—'
  const d = new Date(isoDate)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// ─── GaugeCard ───────────────────────────────────────────────────────────────
interface GaugeCardProps {
  title: string
  subtitle: string
  source?: string
  delta: number | null
  deltaColor: string
  formatDelta: (d: number) => string
  headerNote?: string   // small line shown below title (e.g. ATH info)
  children: React.ReactNode
}

function GaugeCard({
  title, subtitle, source, delta, deltaColor, formatDelta, headerNote, children,
}: GaugeCardProps) {
  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-start justify-between gap-1 min-h-[2.2rem]">
        <p className="text-[11px] font-semibold text-text-primary leading-tight">{title}</p>
        {delta !== null && (
          <span className="text-[11px] font-mono whitespace-nowrap shrink-0 leading-tight"
            style={{ color: deltaColor }}>
            ({delta >= 0 ? '+' : ''}{formatDelta(delta)})
          </span>
        )}
      </div>

      {headerNote && (
        <p className="text-[8.5px] font-mono text-text-muted leading-none -mt-0.5">{headerNote}</p>
      )}

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

  // ── FRED ───────────────────────────────────────────────────────────────────
  const vix    = useFRED('VIXCLS',         fredApiKey, { frequency: 'd', observationStart: S })
  const sofr   = useFRED('SOFR',           fredApiKey, { frequency: 'd', observationStart: S })
  const iorb   = useFRED('IORB',           fredApiKey, { frequency: 'd', observationStart: S })
  const us30y  = useFRED('DGS30',          fredApiKey, { frequency: 'd', observationStart: S })
  const us10y  = useFRED('DGS10',          fredApiKey, { frequency: 'd', observationStart: S })
  const effr   = useFRED('DFF',            fredApiKey, { frequency: 'd', observationStart: S })
  const usdjpy = useFRED('DEXJPUS',        fredApiKey, { frequency: 'd', observationStart: S })
  const wtiS   = useFRED('DCOILWTICO',     fredApiKey, { frequency: 'd', observationStart: S })
  const brentS = useFRED('DCOILBRENTEU',   fredApiKey, { frequency: 'd', observationStart: S })
  const btc    = useFRED('CBBTCUSD',       fredApiKey, { frequency: 'd', observationStart: S })
  const loans  = useFRED('LOANS',          fredApiKey, { units: 'pc1', observationStart: '2024-01-01' })
  // GDP for Buffett Indicator (quarterly)
  const gdp    = useFRED('GDP',            fredApiKey, { frequency: 'q', observationStart: '2020-01-01' })

  // ── Yahoo Finance ───────────────────────────────────────────────────────────
  const move   = useYahoo('^MOVE')        // ICE BofA MOVE Index
  const dxy    = useYahoo('DX-Y.NYB')    // ICE Dollar Index
  const gcf    = useYahoo('GC=F')        // Gold USD/oz  (current price)
  const sif    = useYahoo('SI=F')        // Silver USD/oz
  const hgf    = useYahoo('HG=F')        // Copper USD/lb
  const cnyx   = useYahoo('CNY=X')       // USD/CNY rate
  const clf    = useYahoo('CL=F')        // WTI front-month
  const bzf    = useYahoo('BZ=F')        // Brent front-month
  const w5000  = useYahoo('^W5000')      // Wilshire 5000 Total Market Index (Buffett numerator)

  // Historical weekly data for ATH calculation
  const gcfH   = useYahooHistory('GC=F',     '5y')   // Gold ATH in 5-year window
  const btcH   = useYahooHistory('BTC-USD',  '5y')   // BTC ATH in 5-year window

  // ── Deribit DVOL ───────────────────────────────────────────────────────────
  const bviv   = useDeribitDVOL()

  // ── Derived ────────────────────────────────────────────────────────────────

  // SOFR − IORB
  const sofrIorbV = sofr.lastValue !== null && iorb.lastValue !== null
    ? sofr.lastValue - iorb.lastValue : null
  const sofrIorbP = sofr.prevValue !== null && iorb.prevValue !== null
    ? sofr.prevValue - iorb.prevValue : null

  // 10Y − EFFR spread
  const spreadV = us10y.lastValue !== null && effr.lastValue !== null
    ? us10y.lastValue - effr.lastValue : null
  const spreadP = us10y.prevValue !== null && effr.prevValue !== null
    ? us10y.prevValue - effr.prevValue : null

  // Buffett Indicator: Wilshire 5000 index ÷ GDP ($B) × 100
  // (Wilshire was calibrated so 1 index pt ≈ $1B market cap at inception)
  const { buffettV, buffettP } = useMemo(() => ({
    buffettV: w5000.value !== null && gdp.lastValue !== null && gdp.lastValue > 0
      ? (w5000.value / gdp.lastValue) * 100 : null,
    buffettP: w5000.prev !== null && gdp.lastValue !== null && gdp.lastValue > 0
      ? (w5000.prev / gdp.lastValue) * 100 : null,
  }), [w5000.value, w5000.prev, gdp.lastValue])

  // Gold % from ATH
  const goldPct = gcf.value !== null && gcfH.ath !== null
    ? (gcf.value / gcfH.ath - 1) * 100 : null
  const goldPrevPct = gcf.prev !== null && gcfH.ath !== null
    ? (gcf.prev / gcfH.ath - 1) * 100 : null

  // Bitcoin % from ATH
  const btcPct = btc.lastValue !== null && btcH.ath !== null
    ? (btc.lastValue / btcH.ath - 1) * 100 : null
  const btcPrevPct = btc.prevValue !== null && btcH.ath !== null
    ? (btc.prevValue / btcH.ath - 1) * 100 : null

  // Gold in CNY
  const goldCnyV = gcf.value !== null && cnyx.value !== null ? gcf.value * cnyx.value : null
  const goldCnyP = gcf.prev  !== null && cnyx.prev  !== null ? gcf.prev  * cnyx.prev  : null

  // Gold/Oil
  const goldOilV = gcf.value !== null && clf.value !== null && clf.value > 0 ? gcf.value / clf.value : null
  const goldOilP = gcf.prev  !== null && clf.prev  !== null && clf.prev  > 0 ? gcf.prev  / clf.prev  : null

  // Gold/Silver
  const gsV = gcf.value !== null && sif.value !== null && sif.value > 0 ? gcf.value / sif.value : null
  const gsP = gcf.prev  !== null && sif.prev  !== null && sif.prev  > 0 ? gcf.prev  / sif.prev  : null

  // Copper/Silver
  const cuAgV = hgf.value !== null && sif.value !== null && sif.value > 0 ? hgf.value / sif.value : null
  const cuAgP = hgf.prev  !== null && sif.prev  !== null && sif.prev  > 0 ? hgf.prev  / sif.prev  : null

  // Bitcoin/Gold (oz of gold 1 BTC buys)
  const btcGoldV = btc.lastValue !== null && gcf.value !== null && gcf.value > 0 ? btc.lastValue / gcf.value : null
  const btcGoldP = btc.prevValue !== null && gcf.prev  !== null && gcf.prev  > 0 ? btc.prevValue / gcf.prev  : null

  // ATH header notes
  const goldAthNote = gcfH.ath
    ? `ATH $${gcfH.ath.toFixed(0)}/oz — ${fmtDate(gcfH.athDate)} (${daysAgo(gcfH.athDate)}d ago) • Now $${gcf.value?.toFixed(0) ?? '…'}`
    : gcfH.loading ? 'Calculating ATH…' : null

  const btcAthNote = btcH.ath
    ? `ATH $${(btcH.ath / 1000).toFixed(1)}k — ${fmtDate(btcH.athDate)} (${daysAgo(btcH.athDate)}d ago) • Now $${btc.lastValue ? (btc.lastValue / 1000).toFixed(1) + 'k' : '…'}`
    : btcH.loading ? 'Calculating ATH…' : null

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
        Macro risk gauges — arc and delta colors always agree: green = favorable, red = stress.
        For stress metrics (volatility, yields, DXY) falling is green; for wealth assets rising is green.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">

        {/* 1 ── MOVE — falling=good, green at low */}
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

        {/* 2 ── VIX — falling=good, green at low */}
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

        {/* 3 ── SOFR−IORB — falling=good, green at low */}
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

        {/* 4 ── US 30Y — falling=good, green at low */}
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

        {/* 5 ── US 10Y — falling=good, green at low */}
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

        {/* 6 ── 10Y − EFFR spread — rising=good (risk-on), green at high, inverted arc */}
        {(() => {
          const delta = spreadV !== null && spreadP !== null ? spreadV - spreadP : null
          return (
            <GaugeCard title="Risk Sentiment — 10Y minus EFFR"
              subtitle="Yield spread. <0 bps=risk-off (inverted curve); >100 bps=risk-on"
              source="FRED DGS10, DFF"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `${Math.abs(d * 100).toFixed(0)} bps`}>
              <GaugeChart value={spreadV} min={-2} max={4}
                greenMax={1} redMin={0} inverted
                format={(v) => `${(v * 100).toFixed(0)} bps`}
                loading={us10y.loading || effr.loading}
                greenLabel="Risk On" yellowLabel="Flat" redLabel="Risk Off" />
            </GaugeCard>
          )
        })()}

        {/* 7 ── Buffett Indicator — falling=good, green at low */}
        {/* Wilshire 5000 index (≈ market cap $B) ÷ GDP ($B) × 100                 */}
        {(() => {
          const delta = buffettV !== null && buffettP !== null ? buffettV - buffettP : null
          return (
            <GaugeCard title="Buffett Indicator — Market / GDP"
              subtitle="Wilshire 5000 ÷ GDP. <100%=fair; >150%=overvalued; >200%=extreme"
              source="Yahoo ^W5000, FRED GDP"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(1)}%`}>
              <GaugeChart value={buffettV} min={50} max={250} greenMax={100} redMin={150}
                format={(v) => `${v.toFixed(0)}%`}
                loading={w5000.loading || gdp.loading}
                greenLabel="Undervalued" yellowLabel="Elevated" redLabel="Overvalued" />
            </GaugeCard>
          )
        })()}

        {/* 8 ── USD/JPY — falling=good, green at low */}
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

        {/* 9 ── DXY — falling=good, green at low */}
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

        {/* 10 ── Loans & Leases YoY — rising=good (expansion=green), inverted arc */}
        {(() => {
          const delta = loans.lastValue !== null && loans.prevValue !== null ? loans.lastValue - loans.prevValue : null
          return (
            <GaugeCard title="Credit Pulse — Loans & Leases YoY"
              subtitle="Commercial bank loans YoY %. Expansion=green: credit flows to real economy, not financial assets."
              source="FRED LOANS pc1"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}%`}>
              <GaugeChart value={loans.lastValue} min={-5} max={20}
                greenMax={8} redMin={4} inverted
                format={(v) => `${v.toFixed(1)}%`} loading={loans.loading}
                greenLabel="Expansion" yellowLabel="Tepid" redLabel="Contraction" />
            </GaugeCard>
          )
        })()}

        {/* 11 ── Gold % from ATH — rising=good (closer to ATH), inverted arc */}
        {(() => {
          const delta = goldPct !== null && goldPrevPct !== null ? goldPct - goldPrevPct : null
          return (
            <GaugeCard title="Gold — % from ATH"
              subtitle="COMEX front-month. Deep Value when far from ATH; Toward ATH = bull confirmation."
              source="Yahoo GC=F (5y)"
              headerNote={goldAthNote ?? undefined}
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}%`}>
              <GaugeChart value={goldPct} min={-60} max={0}
                greenMax={-10} redMin={-50} inverted
                format={(v) => `${v.toFixed(1)}%`}
                loading={gcf.loading || gcfH.loading}
                greenLabel="Toward ATH" yellowLabel="Recovery" redLabel="Deep Value" />
            </GaugeCard>
          )
        })()}

        {/* 12 ── Gold/CNY — rising=good, inverted arc */}
        {(() => {
          const delta = goldCnyV !== null && goldCnyP !== null ? goldCnyV - goldCnyP : null
          return (
            <GaugeCard title="Gold/CNY — Yuan per Oz"
              subtitle="Gold in Chinese Yuan. High=repricing / de-dollarization; Low=deep value"
              source="Yahoo GC=F × CNY=X"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `¥${Math.abs(d / 1000).toFixed(1)}k`}>
              <GaugeChart value={goldCnyV} min={20000} max={50000}
                greenMax={35000} redMin={25000} inverted
                format={(v) => `¥${(v / 1000).toFixed(0)}k`} loading={gcf.loading || cnyx.loading}
                greenLabel="Repricing" yellowLabel="Consolidation" redLabel="Deep Value" />
            </GaugeCard>
          )
        })()}

        {/* 13 ── Oil Spot — falling=good, green at low */}
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

        {/* 14 ── Oil Futures — falling=good, green at low */}
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

        {/* 15 ── Gold/Oil (Howell) — rising=good, green at high */}
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

        {/* 16 ── Gold/Silver ratio                                                  */}
        {/* High ratio → gold outperforms silver → monetary demand dominates         */}
        {/* Low ratio  → silver outperforms gold → commodity speculation dominates   */}
        {/* Rising = green (monetary expansion confirmed); inverted arc               */}
        {(() => {
          const delta = gsV !== null && gsP !== null ? gsV - gsP : null
          return (
            <GaugeCard title="Gold/Silver Ratio"
              subtitle="High ratio = monetary demand for gold; Low ratio = silver commodity speculation"
              source="Yahoo GC=F ÷ SI=F"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}`}>
              <GaugeChart value={gsV} min={0} max={150}
                greenMax={120} redMin={25} inverted
                format={(v) => v.toFixed(1)} loading={gcf.loading || sif.loading}
                greenLabel="Monetary Expansion" yellowLabel="Normal" redLabel="Commodity Speculation" />
            </GaugeCard>
          )
        })()}

        {/* 17 ── Copper/Silver ratio                                                */}
        {/* High ratio → copper outperforms → industrial expansion dominates (red)   */}
        {/* Low ratio  → silver outperforms → commodity speculation (green)          */}
        {/* Falling = good; normal arc                                               */}
        {(() => {
          const delta = cuAgV !== null && cuAgP !== null ? cuAgV - cuAgP : null
          return (
            <GaugeCard title="Copper/Silver Ratio (Cu/Ag)"
              subtitle="HG=F / SI=F. High = industrial demand dominates; Low = monetary/spec silver demand"
              source="Yahoo HG=F ÷ SI=F"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(4)}`}>
              <GaugeChart value={cuAgV} min={0} max={0.4} greenMax={0.1} redMin={0.3}
                format={(v) => v.toFixed(3)} loading={hgf.loading || sif.loading}
                greenLabel="Commodity Speculation" yellowLabel="Mixed" redLabel="Industrial Expansion" />
            </GaugeCard>
          )
        })()}

        {/* 18 ── Bitcoin % from ATH — rising=good (closer to ATH), inverted arc */}
        {(() => {
          const delta = btcPct !== null && btcPrevPct !== null ? btcPct - btcPrevPct : null
          return (
            <GaugeCard title="Bitcoin — % from ATH"
              subtitle="BTC/USD vs 5-year ATH. Deep Value when far below ATH; Toward ATH = bull signal."
              source="FRED BTC (5y ATH: Yahoo)"
              headerNote={btcAthNote ?? undefined}
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}%`}>
              <GaugeChart value={btcPct} min={-90} max={0}
                greenMax={-20} redMin={-50} inverted
                format={(v) => `${v.toFixed(1)}%`}
                loading={btc.loading || btcH.loading}
                greenLabel="Toward ATH" yellowLabel="Recovery" redLabel="Deep Value" />
            </GaugeCard>
          )
        })()}

        {/* 19 ── Bitcoin/Gold ratio — rising=good (BTC outperforms), inverted arc */}
        {(() => {
          const delta = btcGoldV !== null && btcGoldP !== null ? btcGoldV - btcGoldP : null
          return (
            <GaugeCard title="Bitcoin/Gold Ratio (oz gold per BTC)"
              subtitle="How many oz of gold 1 BTC buys. <15=gold re-pricing; >30=BTC re-pricing"
              source="FRED BTC ÷ Yahoo GC=F"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}oz`}>
              <GaugeChart value={btcGoldV} min={0} max={60}
                greenMax={30} redMin={15} inverted
                format={(v) => `${v.toFixed(1)}oz`} loading={btc.loading || gcf.loading}
                greenLabel="BTC Re-pricing" yellowLabel="Balanced" redLabel="Gold Re-pricing" />
            </GaugeCard>
          )
        })()}

        {/* 20 ── Bitcoin DVOL — falling=good, green at low */}
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
          <span className="text-text-secondary font-semibold">Buffett Indicator: </span>
          Warren Buffett's preferred valuation gauge: Wilshire 5000 Total Market Index
          (≈ total US equity market cap in billions) ÷ nominal GDP ($B) × 100. Below 100% =
          fair/undervalued. Above 150% = significantly overvalued. 2000 dot-com peak ~190%;
          2021–2022 peak ~210–220%. Computed via Yahoo Finance ^W5000 and FRED GDP.
        </div>
        <div className="bg-bg-card border border-bg-border rounded-xl px-4 py-3 text-[10.5px] text-text-muted leading-relaxed">
          <span className="text-text-secondary font-semibold">Gold/Silver vs Cu/Ag ratios: </span>
          Gold/Silver high (gold outperforms) = monetary demand dominates = green. Gold/Silver
          low (silver outperforms) = commodity speculation = red. Copper/Silver high (copper
          outperforms) = industrial expansion = red. Cu/Ag low (silver outperforms) = monetary /
          speculative silver demand = green. Both ratios give complementary readings on whether
          the cycle is driven by monetary or industrial forces.
        </div>
        <div className="bg-bg-card border border-bg-border rounded-xl px-4 py-3 text-[10.5px] text-text-muted leading-relaxed">
          <span className="text-text-secondary font-semibold">Credit Pulse — why expansion is green: </span>
          When bank loans grow {'>'} 8% YoY, credit flows into the real economy — funding capex,
          hiring, and productive investment. While this competes with markets for capital, it
          confirms genuine economic expansion rather than financial-asset inflation or central
          bank balance sheet expansion alone.
        </div>
      </div>
    </div>
  )
}
