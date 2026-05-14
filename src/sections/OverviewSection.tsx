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
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
function SectionLabel({ title }: { title: string }) {
  return (
    <div className="col-span-full flex items-center gap-3 pt-3 pb-0.5">
      <div className="h-px flex-1 bg-bg-border" />
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
        {title}
      </span>
      <div className="h-px flex-1 bg-bg-border" />
    </div>
  )
}

// ─── GaugeCard ───────────────────────────────────────────────────────────────
interface GaugeCardProps {
  title: string
  subtitle: string
  source?: string
  delta: number | null
  deltaColor: string
  formatDelta: (d: number) => string
  headerNote?: string
  children: React.ReactNode
}
function GaugeCard({ title, subtitle, source, delta, deltaColor, formatDelta, headerNote, children }: GaugeCardProps) {
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

  // ── FRED ─────────────────────────────────────────────────────────────────
  const vix     = useFRED('VIXCLS',       fredApiKey, { frequency: 'd', observationStart: S })
  const sofr    = useFRED('SOFR',         fredApiKey, { frequency: 'd', observationStart: S })
  const iorb    = useFRED('IORB',         fredApiKey, { frequency: 'd', observationStart: S })
  const us30y   = useFRED('DGS30',        fredApiKey, { frequency: 'd', observationStart: S })
  const us10y   = useFRED('DGS10',        fredApiKey, { frequency: 'd', observationStart: S })
  const effr    = useFRED('DFF',          fredApiKey, { frequency: 'd', observationStart: S })
  const usdjpy  = useFRED('DEXJPUS',      fredApiKey, { frequency: 'd', observationStart: S })
  const wtiS    = useFRED('DCOILWTICO',   fredApiKey, { frequency: 'd', observationStart: S })
  const brentS  = useFRED('DCOILBRENTEU', fredApiKey, { frequency: 'd', observationStart: S })
  const btc     = useFRED('CBBTCUSD',     fredApiKey, { frequency: 'd', observationStart: S })
  const loans   = useFRED('LOANS',        fredApiKey, { units: 'pc1', observationStart: '2024-01-01' })
  const m2      = useFRED('M2SL',         fredApiKey, { units: 'pc1', observationStart: '2024-01-01' })
  const baa     = useFRED('DBAA',         fredApiKey, { frequency: 'd', observationStart: S })
  const t5yie   = useFRED('T5YIE',        fredApiKey, { frequency: 'd', observationStart: S })
  const t10yie  = useFRED('T10YIE',       fredApiKey, { frequency: 'd', observationStart: S })
  const t30yie  = useFRED('T30YIEM',      fredApiKey, { frequency: 'm', observationStart: '2024-01-01' })
  // Buffett / Gromen: quarterly
  const mktcap  = useFRED('NCBCEL',       fredApiKey, { frequency: 'q', observationStart: '2000-01-01' })
  const fedDebt = useFRED('GFDEBTN',      fredApiKey, { frequency: 'q', observationStart: '2000-01-01' })
  const gdp     = useFRED('GDP',          fredApiKey, { frequency: 'q', observationStart: '2000-01-01' })
  const debtGdp = useFRED('GFDEGDQ188S',  fredApiKey, { frequency: 'q', observationStart: '2000-01-01' })

  // ── Yahoo Finance ─────────────────────────────────────────────────────────
  const move  = useYahoo('^MOVE')
  const dxy   = useYahoo('DX-Y.NYB')
  const gcf   = useYahoo('GC=F')
  const sif   = useYahoo('SI=F')
  const hgf   = useYahoo('HG=F')
  const cnyx  = useYahoo('CNY=X')
  const clf   = useYahoo('CL=F')
  const bzf   = useYahoo('BZ=F')
  const spx   = useYahoo('^GSPC')
  const ndx   = useYahoo('^NDX')
  const rut   = useYahoo('^RUT')

  // ── Yahoo history (ATH) ───────────────────────────────────────────────────
  const gcfH  = useYahooHistory('GC=F',     '5y')
  const btcH  = useYahooHistory('BTC-USD',  '5y')
  const spxH  = useYahooHistory('^GSPC',    '5y')
  const ndxH  = useYahooHistory('^NDX',     '5y')
  const rutH  = useYahooHistory('^RUT',     '5y')

  // ── Deribit ───────────────────────────────────────────────────────────────
  const bviv  = useDeribitDVOL()

  // ── Derived ───────────────────────────────────────────────────────────────

  const sofrIorbV = sofr.lastValue !== null && iorb.lastValue !== null ? sofr.lastValue - iorb.lastValue : null
  const sofrIorbP = sofr.prevValue !== null && iorb.prevValue !== null ? sofr.prevValue - iorb.prevValue : null

  const spreadV = us10y.lastValue !== null && effr.lastValue !== null ? us10y.lastValue - effr.lastValue : null
  const spreadP = us10y.prevValue !== null && effr.prevValue !== null ? us10y.prevValue - effr.prevValue : null

  // Gromen Buffett: (US mktcap - US federal debt) / GDP × 100
  // Both NCBCEL and GFDEBTN are in $M → /1000 = $B; GDP already $B
  const { gromenV, gromenP } = useMemo(() => ({
    gromenV: mktcap.lastValue !== null && fedDebt.lastValue !== null && gdp.lastValue !== null
      ? ((mktcap.lastValue - fedDebt.lastValue) / 1000 / gdp.lastValue) * 100 : null,
    gromenP: mktcap.prevValue !== null && fedDebt.prevValue !== null && gdp.prevValue !== null
      ? ((mktcap.prevValue - fedDebt.prevValue) / 1000 / gdp.prevValue) * 100 : null,
  }), [mktcap.lastValue, mktcap.prevValue, fedDebt.lastValue, fedDebt.prevValue, gdp.lastValue, gdp.prevValue])

  // BAA − EFFR spread (Moody's Baa minus fed funds = corporate credit premium)
  const baaffV = baa.lastValue !== null && effr.lastValue !== null ? baa.lastValue - effr.lastValue : null
  const baaffP = baa.prevValue !== null && effr.prevValue !== null ? baa.prevValue - effr.prevValue : null

  // Gold in CNY
  const goldCnyV = gcf.value !== null && cnyx.value !== null ? gcf.value * cnyx.value : null
  const goldCnyP = gcf.prev  !== null && cnyx.prev  !== null ? gcf.prev  * cnyx.prev  : null

  // Gold/Oil (Howell)
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

  // % from ATH (gold)
  const goldPct     = gcf.value      !== null && gcfH.ath !== null ? (gcf.value      / gcfH.ath - 1) * 100 : null
  const goldPrevPct = gcf.prev       !== null && gcfH.ath !== null ? (gcf.prev       / gcfH.ath - 1) * 100 : null

  // % from ATH (bitcoin)
  const btcPct      = btc.lastValue  !== null && btcH.ath !== null ? (btc.lastValue  / btcH.ath - 1) * 100 : null
  const btcPrevPct  = btc.prevValue  !== null && btcH.ath !== null ? (btc.prevValue  / btcH.ath - 1) * 100 : null

  // % from ATH (equity indices)
  const spxPct      = spx.value !== null && spxH.ath !== null ? (spx.value / spxH.ath - 1) * 100 : null
  const spxPrevPct  = spx.prev  !== null && spxH.ath !== null ? (spx.prev  / spxH.ath - 1) * 100 : null
  const ndxPct      = ndx.value !== null && ndxH.ath !== null ? (ndx.value / ndxH.ath - 1) * 100 : null
  const rutPct      = rut.value !== null && rutH.ath !== null ? (rut.value / rutH.ath - 1) * 100 : null

  // ATH header notes
  const goldAthNote = gcfH.ath
    ? `ATH $${gcfH.ath.toFixed(0)}/oz — ${fmtDate(gcfH.athDate)} (${daysAgo(gcfH.athDate)}d ago) · Now $${gcf.value?.toFixed(0) ?? '…'}`
    : gcfH.loading ? 'Calculating ATH…' : undefined

  const btcAthNote = btcH.ath
    ? `ATH $${(btcH.ath / 1000).toFixed(1)}k — ${fmtDate(btcH.athDate)} (${daysAgo(btcH.athDate)}d ago) · Now $${btc.lastValue ? (btc.lastValue / 1000).toFixed(1) + 'k' : '…'}`
    : btcH.loading ? 'Calculating ATH…' : undefined

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
        Macro risk gauges — green = favorable reading, red = stress. Delta color matches the arc:
        for stress metrics falling is green; for wealth assets rising is green.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">

        {/* ═══════════════════════════════════════════════════════════════════
            0 — OVERALL ECONOMY
        ═══════════════════════════════════════════════════════════════════ */}
        <SectionLabel title="Overall Economy" />

        {/* Inflation Expectations — TIPS 5Y / 10Y / 30Y multi-needle */}
        {(() => {
          const delta = t10yie.lastValue !== null && t10yie.prevValue !== null ? t10yie.lastValue - t10yie.prevValue : null
          return (
            <GaugeCard title="Inflation Expectations (TIPS)"
              subtitle="Breakeven inflation: nominal minus TIPS yield. <1%=deflation risk; >2%=hot"
              source="FRED T5YIE T10YIE T30YIEM"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}%`}>
              <GaugeChart
                needles={[
                  { value: t5yie.lastValue,  color: '#38bdf8', label: '5Y'  },
                  { value: t10yie.lastValue, color: '#fb923c', label: '10Y' },
                  { value: t30yie.lastValue, color: '#a78bfa', label: '30Y' },
                ]}
                min={-0.5} max={5} greenMax={1} redMin={2}
                format={(v) => `${v.toFixed(2)}%`}
                loading={t5yie.loading || t10yie.loading}
                greenLabel="Low" yellowLabel="Target" redLabel="Hot" />
            </GaugeCard>
          )
        })()}

        {/* US Debt / GDP */}
        {(() => {
          const delta = debtGdp.lastValue !== null && debtGdp.prevValue !== null ? debtGdp.lastValue - debtGdp.prevValue : null
          return (
            <GaugeCard title="US Debt / GDP"
              subtitle="Federal debt as % of GDP. >100%=unsustainable; >130%=crisis trajectory"
              source="FRED GFDEGDQ188S"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(1)}%`}>
              <GaugeChart value={debtGdp.lastValue} min={0} max={200} greenMax={40} redMin={100}
                format={(v) => `${v.toFixed(0)}%`} loading={debtGdp.loading}
                greenLabel="Healthy" yellowLabel="Elevated" redLabel="Crisis" />
            </GaugeCard>
          )
        })()}

        {/* Gold/Oil ratio (Howell) */}
        {(() => {
          const delta = goldOilV !== null && goldOilP !== null ? goldOilV - goldOilP : null
          return (
            <GaugeCard title="Gold/Oil Ratio (Howell)"
              subtitle="Barrels of WTI per oz of gold. Rising = monetary liquidity excess"
              source="Yahoo GC=F ÷ CL=F"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}×`}>
              <GaugeChart value={goldOilV} min={5} max={60} greenMax={20} redMin={40}
                format={(v) => `${v.toFixed(1)}×`} loading={gcf.loading || clf.loading}
                greenLabel="Normal" yellowLabel="Elevated" redLabel="Extreme" />
            </GaugeCard>
          )
        })()}

        {/* M2 YoY */}
        {(() => {
          const delta = m2.lastValue !== null && m2.prevValue !== null ? m2.lastValue - m2.prevValue : null
          return (
            <GaugeCard title="M2 Money Supply YoY"
              subtitle="Broad money supply YoY % change. <5%=low monetary inflation; >10%=high"
              source="FRED M2SL pc1"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}%`}>
              <GaugeChart value={m2.lastValue} min={-5} max={30} greenMax={5} redMin={10}
                format={(v) => `${v.toFixed(1)}%`} loading={m2.loading}
                greenLabel="Low" yellowLabel="Moderate" redLabel="High" />
            </GaugeCard>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════════════
            1 — BOND MARKET
        ═══════════════════════════════════════════════════════════════════ */}
        <SectionLabel title="Bond Market" />

        {/* MOVE */}
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

        {/* US 30Y */}
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

        {/* US 10Y */}
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

        {/* 10Y − EFFR */}
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

        {/* ═══════════════════════════════════════════════════════════════════
            2 — PLUMBING
        ═══════════════════════════════════════════════════════════════════ */}
        <SectionLabel title="Plumbing" />

        {/* SOFR − IORB */}
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

        {/* ═══════════════════════════════════════════════════════════════════
            3 — CORPORATE CREDIT
        ═══════════════════════════════════════════════════════════════════ */}
        <SectionLabel title="Corporate Credit" />

        {/* Loans & Leases YoY */}
        {(() => {
          const delta = loans.lastValue !== null && loans.prevValue !== null ? loans.lastValue - loans.prevValue : null
          return (
            <GaugeCard title="Credit Pulse — Loans & Leases YoY"
              subtitle="Commercial bank loans YoY %. Expansion=green: credit flows to real economy."
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

        {/* Corporate credit — BAA minus Fed Funds Rate */}
        {/* High spread = credit stress / money leaving corps = green (liquidity signal) */}
        {/* Low spread  = compressed risk premia = red (liquidity into financial assets) */}
        {(() => {
          const delta = baaffV !== null && baaffP !== null ? baaffV - baaffP : null
          return (
            <GaugeCard title="Corporate Credit — BAA minus EFFR"
              subtitle="Moody's Baa yield − Fed Funds. High=credit stress/green: liquidity leaving financial assets"
              source="FRED DBAA, DFF"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}%`}>
              <GaugeChart value={baaffV} min={-1} max={6}
                greenMax={2.5} redMin={1.5} inverted
                format={(v) => `${v.toFixed(2)}%`} loading={baa.loading || effr.loading}
                greenLabel="Credit Stress" yellowLabel="Normal" redLabel="Compressed" />
            </GaugeCard>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════════════
            4 — EQUITY MARKET
        ═══════════════════════════════════════════════════════════════════ */}
        <SectionLabel title="Equity Market" />

        {/* VIX */}
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

        {/* Gromen Buffett Indicator: (Mktcap − Fed Debt) / GDP */}
        {(() => {
          const delta = gromenV !== null && gromenP !== null ? gromenV - gromenP : null
          return (
            <GaugeCard title="Buffett Indicator (Gromen)"
              subtitle="(US mktcap − federal debt) ÷ GDP. Adjusts for QE-era monetization. >100%=overvalued"
              source="FRED NCBCEL, GFDEBTN, GDP"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(1)}%`}>
              <GaugeChart value={gromenV} min={-50} max={200} greenMax={50} redMin={100}
                format={(v) => `${v.toFixed(0)}%`}
                loading={mktcap.loading || fedDebt.loading || gdp.loading}
                greenLabel="Fair Value" yellowLabel="Elevated" redLabel="Overvalued" />
            </GaugeCard>
          )
        })()}

        {/* Equity indices % from ATH — multi-needle: SPX / NDX / RUT */}
        {(() => {
          const delta = spxPct !== null && spxPrevPct !== null ? spxPct - spxPrevPct : null
          return (
            <GaugeCard title="US Equity — % from ATH"
              subtitle="S&P 500 / Nasdaq 100 / Russell 2000 vs 5-year ATH. Green=within 5%; Red=15%+ below"
              source="Yahoo ^GSPC ^NDX ^RUT"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `SPX ${Math.abs(d).toFixed(2)}%`}>
              <GaugeChart
                needles={[
                  { value: spxPct, color: '#3b82f6', label: 'SPX' },
                  { value: ndxPct, color: '#8b5cf6', label: 'NDX' },
                  { value: rutPct, color: '#f59e0b', label: 'RUT' },
                ]}
                min={-60} max={0}
                greenMax={-5} redMin={-15} inverted
                format={(v) => `${v.toFixed(1)}%`}
                loading={spx.loading || spxH.loading}
                greenLabel="Near ATH" yellowLabel="Recovery" redLabel="Bear Zone" />
            </GaugeCard>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════════════
            5 — CURRENCY
        ═══════════════════════════════════════════════════════════════════ */}
        <SectionLabel title="Currency" />

        {/* DXY */}
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

        {/* USD/JPY */}
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

        {/* ═══════════════════════════════════════════════════════════════════
            6 — OIL
        ═══════════════════════════════════════════════════════════════════ */}
        <SectionLabel title="Oil" />

        {/* Oil Spot */}
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

        {/* Oil Futures */}
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

        {/* ═══════════════════════════════════════════════════════════════════
            7 — METALS
        ═══════════════════════════════════════════════════════════════════ */}
        <SectionLabel title="Metals" />

        {/* Gold % from ATH */}
        {(() => {
          const delta = goldPct !== null && goldPrevPct !== null ? goldPct - goldPrevPct : null
          return (
            <GaugeCard title="Gold — % from ATH"
              subtitle="COMEX front-month vs 5-year ATH. Near ATH=bull confirmation; deep below=value zone."
              source="Yahoo GC=F (5y)"
              headerNote={goldAthNote}
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

        {/* Gold/CNY */}
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

        {/* Gold/Silver */}
        {(() => {
          const delta = gsV !== null && gsP !== null ? gsV - gsP : null
          return (
            <GaugeCard title="Gold/Silver Ratio"
              subtitle="High=monetary demand for gold dominant; Low=silver commodity speculation"
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

        {/* Copper/Silver */}
        {(() => {
          const delta = cuAgV !== null && cuAgP !== null ? cuAgV - cuAgP : null
          return (
            <GaugeCard title="Copper/Silver Ratio (Cu/Ag)"
              subtitle="HG=F / SI=F. High=industrial expansion dominant; Low=monetary silver demand"
              source="Yahoo HG=F ÷ SI=F"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(4)}`}>
              <GaugeChart value={cuAgV} min={0} max={0.4} greenMax={0.1} redMin={0.3}
                format={(v) => v.toFixed(3)} loading={hgf.loading || sif.loading}
                greenLabel="Commodity Speculation" yellowLabel="Mixed" redLabel="Industrial Expansion" />
            </GaugeCard>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════════════
            8 — BITCOIN
        ═══════════════════════════════════════════════════════════════════ */}
        <SectionLabel title="Bitcoin" />

        {/* Bitcoin % from ATH */}
        {(() => {
          const delta = btcPct !== null && btcPrevPct !== null ? btcPct - btcPrevPct : null
          return (
            <GaugeCard title="Bitcoin — % from ATH"
              subtitle="BTC/USD vs 5-year ATH. Near ATH=bull signal; Deep below=accumulation zone."
              source="FRED BTC (5y ATH: Yahoo)"
              headerNote={btcAthNote}
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

        {/* Bitcoin DVOL */}
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

        {/* Bitcoin/Gold ratio */}
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

      </div>

      {/* Contextual notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
        <div className="bg-bg-card border border-bg-border rounded-xl px-4 py-3 text-[10.5px] text-text-muted leading-relaxed">
          <span className="text-text-secondary font-semibold">Gromen Buffett Indicator: </span>
          Luke Gromen's adjustment subtracts US federal debt from market cap before dividing by GDP.
          The thesis: in the QE era the Fed has signaled it will monetize the national debt
          ("print the difference"), so the nominal market cap embeds a debt-inflation premium.
          Stripping it out gives a truer picture of equity valuation relative to the real economy.
          Formula: (NCBCEL − GFDEBTN) ÷ GDP × 100.
        </div>
        <div className="bg-bg-card border border-bg-border rounded-xl px-4 py-3 text-[10.5px] text-text-muted leading-relaxed">
          <span className="text-text-secondary font-semibold">Corporate credit (BAA−EFFR): </span>
          When the Baa spread over the fed funds rate <em>rises</em>, credit risk premia widen —
          money is leaving corporate bonds for safer assets. Counterintuitively this is green here:
          a wider spread means liquidity is flowing away from financial-asset inflation and back
          toward real credit analysis. A compressed spread ({'<'} 1.5%) signals euphoric risk-on
          conditions where capital is chasing yield regardless of fundamentals.
        </div>
        <div className="bg-bg-card border border-bg-border rounded-xl px-4 py-3 text-[10.5px] text-text-muted leading-relaxed">
          <span className="text-text-secondary font-semibold">TIPS breakeven inflation: </span>
          Computed by the Fed as the difference between nominal Treasury yields and TIPS yields
          of the same maturity. The 5Y and 10Y series are daily; 30Y is monthly. A reading
          above 2% signals the market expects inflation to run above the Fed's target, potentially
          forcing the Fed's hand on rates. Below 1% suggests deflation risk or demand collapse.
          No 2Y FRED series exists; 5Y/10Y/30Y cover the curve adequately.
        </div>
      </div>
    </div>
  )
}
