import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { useYahoo } from '../hooks/useYahoo'
import { useYahooHistory } from '../hooks/useYahooHistory'
import { useDeribitDVOL } from '../hooks/useDeribitDVOL'
import { GaugeChart, deltaColor as getDeltaColor } from '../components/charts/GaugeChart'
import { GaugeCard, SectionLabel } from '../components/charts/GaugeCard'

// ─── helpers ─────────────────────────────────────────────────────────────────
function daysAgo(isoDate: string | null): number | null {
  if (!isoDate) return null
  return Math.round((Date.now() - new Date(isoDate).getTime()) / 86_400_000)
}
function fmtDate(isoDate: string | null): string {
  if (!isoDate) return '—'
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// ─── OverviewSection ─────────────────────────────────────────────────────────
export function OverviewSection() {
  const { fredApiKey } = useApp()
  const S = '2025-01-01'

  // ── FRED — daily/monthly ──────────────────────────────────────────────────
  const vix     = useFRED('VIXCLS',           fredApiKey, { frequency: 'd', observationStart: S })
  const sofr    = useFRED('SOFR',             fredApiKey, { frequency: 'd', observationStart: S })
  const iorb    = useFRED('IORB',             fredApiKey, { frequency: 'd', observationStart: S })
  const us30y   = useFRED('DGS30',            fredApiKey, { frequency: 'd', observationStart: S })
  const us10y   = useFRED('DGS10',            fredApiKey, { frequency: 'd', observationStart: S })
  const effr    = useFRED('DFF',              fredApiKey, { frequency: 'd', observationStart: S })
  const usdjpy  = useFRED('DEXJPUS',          fredApiKey, { frequency: 'd', observationStart: S })
  const wtiS    = useFRED('DCOILWTICO',       fredApiKey, { frequency: 'd', observationStart: S })
  const brentS  = useFRED('DCOILBRENTEU',     fredApiKey, { frequency: 'd', observationStart: S })
  const btc     = useFRED('CBBTCUSD',         fredApiKey, { frequency: 'd', observationStart: S })
  const t5yie   = useFRED('T5YIE',            fredApiKey, { frequency: 'd', observationStart: S })
  const t10yie  = useFRED('T10YIE',           fredApiKey, { frequency: 'd', observationStart: S })
  const baa     = useFRED('DBAA',             fredApiKey, { frequency: 'd', observationStart: S })
  // Bank reserves (weekly, $M)
  const reserves= useFRED('WRBWFRBL',         fredApiKey, { frequency: 'w', observationStart: S })

  // ── FRED — monthly ────────────────────────────────────────────────────────
  const cpi     = useFRED('CPIAUCSL',         fredApiKey, { units: 'pc1', observationStart: '2024-01-01' })
  const coreCpi = useFRED('CPILFESL',         fredApiKey, { units: 'pc1', observationStart: '2024-01-01' })
  const ppi     = useFRED('PPIFID',           fredApiKey, { units: 'pc1', observationStart: '2024-01-01' })
  const unrate  = useFRED('UNRATE',           fredApiKey, { frequency: 'm', observationStart: '2024-01-01' })
  const cfnai   = useFRED('CFNAI',            fredApiKey, { frequency: 'm', observationStart: '2024-01-01' })
  const loans   = useFRED('LOANS',            fredApiKey, { units: 'pc1', observationStart: '2024-01-01' })
  const m2      = useFRED('M2SL',             fredApiKey, { units: 'pc1', observationStart: '2024-01-01' })
  // ── FRED — economy behind the headlines ───────────────────────────────────
  const mortgage= useFRED('MORTGAGE30US',     fredApiKey, { frequency: 'm', observationStart: '2024-01-01' })
  const mspus   = useFRED('MSPUS',            fredApiKey, { frequency: 'q', observationStart: '2020-01-01' })
  const emSpread= useFRED('BAMLEMCBPIOAS',    fredApiKey, { frequency: 'd', observationStart: '2024-01-01' })
  const jolts   = useFRED('JTSJOL',           fredApiKey, { frequency: 'm', observationStart: '2024-01-01' })
  const unemploy= useFRED('UNEMPLOY',         fredApiKey, { frequency: 'm', observationStart: '2024-01-01' })
  const ahetpi  = useFRED('AHETPI',           fredApiKey, { units: 'pc1', observationStart: '2024-01-01' })

  // ── FRED — quarterly ──────────────────────────────────────────────────────
  const mktcap  = useFRED('NCBCEL',           fredApiKey, { frequency: 'q', observationStart: '2000-01-01' })
  const fedDebt = useFRED('GFDEBTN',          fredApiKey, { frequency: 'q', observationStart: '2000-01-01' })
  const gdp     = useFRED('GDP',              fredApiKey, { frequency: 'q', observationStart: '2000-01-01' })
  const debtGdp = useFRED('GFDEGDQ188S',      fredApiKey, { frequency: 'q', observationStart: '2000-01-01' })
  // ── FRED — bond market 2Y-10Y ─────────────────────────────────────────────
  const t10y2y  = useFRED('T10Y2Y',           fredApiKey, { frequency: 'd', observationStart: S })
  // ── FRED — fiscal (for US Fiscal gauge row) ───────────────────────────────
  const taxRec       = useFRED('W006RC1Q027SBEA', fredApiKey, { frequency: 'q', observationStart: '2020-01-01' })
  const interestRatio= useFRED('A091RC1Q027SBEA', fredApiKey, { frequency: 'q', observationStart: '2020-01-01' })
  const deficitPct   = useFRED('FYFSGDA188S',     fredApiKey, { frequency: 'a', observationStart: '2020-01-01' })
  const tga          = useFRED('WTREGEN',          fredApiKey, { frequency: 'w', observationStart: '2025-01-01' })
  // ── FRED — annual (none currently needed here) ────────────────────────────

  // ── Yahoo Finance ─────────────────────────────────────────────────────────
  const move    = useYahoo('^MOVE')
  const dxy     = useYahoo('DX-Y.NYB')
  const gcf     = useYahoo('GC=F')
  const sif     = useYahoo('SI=F')
  const hgf     = useYahoo('HG=F')
  const cnyx    = useYahoo('CNY=X')
  const clf     = useYahoo('CL=F')
  const bzf     = useYahoo('BZ=F')
  const spx     = useYahoo('^GSPC')
  const ndx     = useYahoo('^NDX')
  const rut     = useYahoo('^RUT')

  // ── Yahoo history (ATH) ───────────────────────────────────────────────────
  const gcfH    = useYahooHistory('GC=F',    '5y')
  const btcH    = useYahooHistory('BTC-USD', '5y')
  const spxH    = useYahooHistory('^GSPC',   '5y')
  const ndxH    = useYahooHistory('^NDX',    '5y')
  const rutH    = useYahooHistory('^RUT',    '5y')

  // ── Deribit ───────────────────────────────────────────────────────────────
  const bviv    = useDeribitDVOL()

  // ── Derived ───────────────────────────────────────────────────────────────

  const sofrIorbV = sofr.lastValue !== null && iorb.lastValue !== null ? sofr.lastValue - iorb.lastValue : null
  const sofrIorbP = sofr.prevValue !== null && iorb.prevValue !== null ? sofr.prevValue - iorb.prevValue : null

  const spreadV = us10y.lastValue !== null && effr.lastValue !== null ? us10y.lastValue - effr.lastValue : null
  const spreadP = us10y.prevValue !== null && effr.prevValue !== null ? us10y.prevValue - effr.prevValue : null

  // Gromen Buffett: (mktcap $M − fedDebt $M) / 1000 / gdp $B × 100
  const { gromenV, gromenP } = useMemo(() => ({
    gromenV: mktcap.lastValue !== null && fedDebt.lastValue !== null && gdp.lastValue !== null
      ? ((mktcap.lastValue - fedDebt.lastValue) / 1000 / gdp.lastValue) * 100 : null,
    gromenP: mktcap.prevValue !== null && fedDebt.prevValue !== null && gdp.prevValue !== null
      ? ((mktcap.prevValue - fedDebt.prevValue) / 1000 / gdp.prevValue) * 100 : null,
  }), [mktcap.lastValue, mktcap.prevValue, fedDebt.lastValue, fedDebt.prevValue, gdp.lastValue, gdp.prevValue])

  // Bank reserves to GDP %: WRBWFRBL ($M) / 1000 / GDP ($B) × 100
  const resGdpV = reserves.lastValue !== null && gdp.lastValue !== null
    ? (reserves.lastValue / 1000 / gdp.lastValue) * 100 : null
  const resGdpP = reserves.prevValue !== null && gdp.lastValue !== null
    ? (reserves.prevValue / 1000 / gdp.lastValue) * 100 : null

  // BAA − EFFR spread
  const baaffV = baa.lastValue !== null && effr.lastValue !== null ? baa.lastValue - effr.lastValue : null
  const baaffP = baa.prevValue !== null && effr.prevValue !== null ? baa.prevValue - effr.prevValue : null

  // Fiscal derived
  const intExpRatioV = interestRatio.lastValue !== null && taxRec.lastValue !== null && taxRec.lastValue > 0
    ? (interestRatio.lastValue / taxRec.lastValue) * 100 : null
  const intExpRatioP = interestRatio.prevValue !== null && taxRec.prevValue !== null && taxRec.prevValue > 0
    ? (interestRatio.prevValue / taxRec.prevValue) * 100 : null
  const deficitV = deficitPct.lastValue !== null ? -deficitPct.lastValue : null
  const deficitP = deficitPct.prevValue !== null ? -deficitPct.prevValue : null

  // Housing affordability: monthly payment (80% LTV, 30Y fixed) as % of $7k/month median income
  const affordV = useMemo(() => {
    if (!mortgage.lastValue || !mspus.lastValue) return null
    const r = mortgage.lastValue / 1200
    const payment = mspus.lastValue * 0.8 * r / (1 - Math.pow(1 + r, -360))
    return (payment / 7000) * 100  // % of $7k/month ≈ current US median
  }, [mortgage.lastValue, mspus.lastValue])
  const affordP = useMemo(() => {
    if (!mortgage.prevValue || !mspus.prevValue) return null
    const r = mortgage.prevValue / 1200
    const payment = mspus.prevValue * 0.8 * r / (1 - Math.pow(1 + r, -360))
    return (payment / 7000) * 100
  }, [mortgage.prevValue, mspus.prevValue])

  // Labor market ratio: JOLTS openings / unemployed persons (both in thousands)
  const laborRatioV = jolts.lastValue !== null && unemploy.lastValue !== null && unemploy.lastValue > 0
    ? jolts.lastValue / unemploy.lastValue : null
  const laborRatioP = jolts.prevValue !== null && unemploy.prevValue !== null && unemploy.prevValue > 0
    ? jolts.prevValue / unemploy.prevValue : null

  // Real wage growth: nominal wage YoY − CPI YoY
  const realWageV = ahetpi.lastValue !== null && cpi.lastValue !== null ? ahetpi.lastValue - cpi.lastValue : null
  const realWageP = ahetpi.prevValue !== null && cpi.prevValue !== null ? ahetpi.prevValue - cpi.prevValue : null

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

  // Bitcoin/Gold
  const btcGoldV = btc.lastValue !== null && gcf.value !== null && gcf.value > 0 ? btc.lastValue / gcf.value : null
  const btcGoldP = btc.prevValue !== null && gcf.prev  !== null && gcf.prev  > 0 ? btc.prevValue / gcf.prev  : null

  // % from ATH
  const goldPct    = gcf.value     !== null && gcfH.ath !== null ? (gcf.value     / gcfH.ath - 1) * 100 : null
  const goldPrevPct= gcf.prev      !== null && gcfH.ath !== null ? (gcf.prev      / gcfH.ath - 1) * 100 : null
  const btcPct     = btc.lastValue !== null && btcH.ath !== null ? (btc.lastValue / btcH.ath - 1) * 100 : null
  const btcPrevPct = btc.prevValue !== null && btcH.ath !== null ? (btc.prevValue / btcH.ath - 1) * 100 : null
  const spxPct     = spx.value !== null && spxH.ath !== null ? (spx.value / spxH.ath - 1) * 100 : null
  const spxPrevPct = spx.prev  !== null && spxH.ath !== null ? (spx.prev  / spxH.ath - 1) * 100 : null
  const ndxPct     = ndx.value !== null && ndxH.ath !== null ? (ndx.value / ndxH.ath - 1) * 100 : null
  const rutPct     = rut.value !== null && rutH.ath !== null ? (rut.value / rutH.ath - 1) * 100 : null

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
        Macro risk gauges — green = favorable, red = stress. Delta color matches the arc.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">

        {/* ═══════════════════════════════════════════════════════════════════
            US HEADLINE ECONOMY & FISCAL
        ═══════════════════════════════════════════════════════════════════ */}
        <SectionLabel title="US Headline Economy" />

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

        {/* Inflation — CPI + Core CPI + PPI multi-needle */}
        {(() => {
          const delta = cpi.lastValue !== null && cpi.prevValue !== null ? cpi.lastValue - cpi.prevValue : null
          return (
            <GaugeCard title="Inflation — CPI / Core / PPI YoY"
              subtitle="Headline CPI, Core CPI, & PPI YoY %. PPI leads CPI by 3–6 months."
              source="FRED CPIAUCSL, CPILFESL, PPIFID"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `CPI ${Math.abs(d).toFixed(2)}%`}>
              <GaugeChart
                needles={[
                  { value: cpi.lastValue,     color: '#f87171', label: 'CPI'  },
                  { value: coreCpi.lastValue, color: '#fb923c', label: 'Core' },
                  { value: ppi.lastValue,     color: '#a78bfa', label: 'PPI'  },
                ]}
                min={-1} max={12} greenMax={2} redMin={3}
                format={(v) => `${v.toFixed(2)}%`}
                loading={cpi.loading || coreCpi.loading || ppi.loading}
                greenLabel="Target" yellowLabel="Above Target" redLabel="Hot" />
            </GaugeCard>
          )
        })()}

        {/* Unemployment */}
        {(() => {
          const delta = unrate.lastValue !== null && unrate.prevValue !== null ? unrate.lastValue - unrate.prevValue : null
          return (
            <GaugeCard title="Unemployment Rate"
              subtitle="US headline unemployment. <4%=tight labor market; >6%=slack/recession signal"
              source="FRED UNRATE"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(1)}%`}>
              <GaugeChart value={unrate.lastValue} min={0} max={15} greenMax={4} redMin={6}
                format={(v) => `${v.toFixed(1)}%`} loading={unrate.loading}
                greenLabel="Tight" yellowLabel="Softening" redLabel="Slack" />
            </GaugeCard>
          )
        })()}

        {/* Business Cycle — CFNAI (composite proxy for PMI) */}
        {(() => {
          const delta = cfnai.lastValue !== null && cfnai.prevValue !== null ? cfnai.lastValue - cfnai.prevValue : null
          return (
            <GaugeCard title="Business Cycle — CFNAI"
              subtitle="Chicago Fed 85-indicator composite. 0=trend; >+0.5=strong; <-0.3=contraction"
              source="FRED CFNAI"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}`}>
              {/* inverted: right=green (high CFNAI=growth), left=red (contraction) */}
              <GaugeChart value={cfnai.lastValue} min={-3} max={3}
                greenMax={0.5} redMin={-0.3} inverted
                format={(v) => v.toFixed(2)} loading={cfnai.loading}
                greenLabel="Expansion" yellowLabel="Trend" redLabel="Contraction" />
            </GaugeCard>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════════════
            US FISCAL
        ═══════════════════════════════════════════════════════════════════ */}
        <SectionLabel title="US Fiscal" />

        {/* Interest / Tax Receipts */}
        {(() => {
          const delta = intExpRatioV !== null && intExpRatioP !== null ? intExpRatioV - intExpRatioP : null
          return (
            <GaugeCard title="Interest / Tax Receipts"
              subtitle="Federal interest payments as % of tax revenue. >25%=severely stressed per OMB"
              source="FRED A091RC1Q027SBEA, W006RC1Q027SBEA"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(1)}%`}>
              <GaugeChart value={intExpRatioV} min={0} max={60} greenMax={15} redMin={25}
                format={(v) => `${v.toFixed(1)}%`}
                loading={interestRatio.loading || taxRec.loading}
                greenLabel="Healthy" yellowLabel="Elevated" redLabel="Unsustainable" />
            </GaugeCard>
          )
        })()}

        {/* Deficit / GDP */}
        {(() => {
          const delta = deficitV !== null && deficitP !== null ? deficitV - deficitP : null
          return (
            <GaugeCard title="Federal Deficit / GDP"
              subtitle="Annual deficit as % of GDP (sign flipped: high = large deficit). >5%=fiscal dominance"
              source="FRED FYFSGDA188S"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(1)}%`}>
              <GaugeChart value={deficitV} min={0} max={20} greenMax={3} redMin={5}
                format={(v) => `${v.toFixed(1)}%`} loading={deficitPct.loading}
                greenLabel="Contained" yellowLabel="Expansionary" redLabel="Dominance" />
            </GaugeCard>
          )
        })()}

        {/* TGA Balance */}
        {(() => {
          const tgaB = tga.lastValue !== null ? tga.lastValue / 1000 : null
          return (
            <GaugeCard title="TGA Balance"
              subtitle="Treasury General Account. <$100B=depleted (forced issuance / market stress)"
              source="FRED WTREGEN"
              delta={null} deltaColor="#64748b"
              formatDelta={() => ''}>
              <GaugeChart value={tgaB} min={0} max={1000} greenMax={500} redMin={100}
                format={(v) => `$${v.toFixed(0)}B`} loading={tga.loading}
                greenLabel="Ample" yellowLabel="Low" redLabel="Depleted" />
            </GaugeCard>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════════════
            ECONOMY BEHIND THE HEADLINES
        ═══════════════════════════════════════════════════════════════════ */}
        <SectionLabel title="Economy Behind the Headlines" />

        {/* Inflation Expectations — TIPS 5Y / 10Y */}
        {(() => {
          const delta = t10yie.lastValue !== null && t10yie.prevValue !== null ? t10yie.lastValue - t10yie.prevValue : null
          return (
            <GaugeCard title="Inflation Expectations (TIPS)"
              subtitle="Breakeven: nominal minus TIPS yield. <1%=deflation risk; >2%=above target"
              source="FRED T5YIE, T10YIE"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}%`}>
              <GaugeChart
                needles={[
                  { value: t5yie.lastValue,  color: '#38bdf8', label: '5Y'  },
                  { value: t10yie.lastValue, color: '#fb923c', label: '10Y' },
                ]}
                min={-0.5} max={5} greenMax={1} redMin={2}
                format={(v) => `${v.toFixed(2)}%`}
                loading={t5yie.loading || t10yie.loading}
                greenLabel="Low" yellowLabel="Target" redLabel="Hot" />
            </GaugeCard>
          )
        })()}

        {/* Gold/Oil ratio (Howell) */}
        {(() => {
          const delta = goldOilV !== null && goldOilP !== null ? goldOilV - goldOilP : null
          return (
            <GaugeCard title="Gold/Oil Ratio (Howell)"
              subtitle="Barrels of WTI per oz of gold. Rising = monetary liquidity excess vs real economy"
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
              subtitle="Broad money YoY % change. <5%=low monetary inflation; >10%=high"
              source="FRED M2SL pc1"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}%`}>
              <GaugeChart value={m2.lastValue} min={-5} max={30} greenMax={5} redMin={10}
                format={(v) => `${v.toFixed(1)}%`} loading={m2.loading}
                greenLabel="Low" yellowLabel="Moderate" redLabel="High" />
            </GaugeCard>
          )
        })()}

        {/* Housing Affordability — derived monthly payment as % of median income */}
        {(() => {
          const delta = affordV !== null && affordP !== null ? affordV - affordP : null
          return (
            <GaugeCard title="Housing Affordability"
              subtitle="Monthly mortgage (80% LTV, 30Y) as % of $7k/month median income. >35%=unaffordable."
              source="FRED MORTGAGE30US, MSPUS"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(1)}%`}>
              <GaugeChart value={affordV} min={0} max={60} greenMax={25} redMin={38}
                format={(v) => `${v.toFixed(1)}%`}
                loading={mortgage.loading || mspus.loading}
                greenLabel="Affordable" yellowLabel="Stretched" redLabel="Unaffordable" />
            </GaugeCard>
          )
        })()}

        {/* EM Credit Spreads */}
        {(() => {
          const delta = emSpread.lastValue !== null && emSpread.prevValue !== null ? emSpread.lastValue - emSpread.prevValue : null
          return (
            <GaugeCard title="EM Credit Spreads (OAS)"
              subtitle="Emerging market corporate bond option-adjusted spread. Wide=dollar squeeze/stress."
              source="FRED BAMLEMCBPIOAS"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(0)} bps`}>
              <GaugeChart value={emSpread.lastValue} min={0} max={10} greenMax={3} redMin={6}
                format={(v) => `${v.toFixed(2)}%`} loading={emSpread.loading}
                greenLabel="Tight/Risk-On" yellowLabel="Normal" redLabel="Stress/Risk-Off" />
            </GaugeCard>
          )
        })()}

        {/* Labor Market Ratio — JOLTS openings / unemployed */}
        {(() => {
          const delta = laborRatioV !== null && laborRatioP !== null ? laborRatioV - laborRatioP : null
          return (
            <GaugeCard title="Labor Demand — Openings/Unemployed"
              subtitle="JOLTS job openings ÷ unemployed persons. >1.5=very tight; <0.8=slack labor market."
              source="FRED JTSJOL, UNEMPLOY"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}×`}>
              {/* inverted: high ratio (right) = good (green); low ratio = slack (red) */}
              <GaugeChart value={laborRatioV} min={0} max={3}
                greenMax={1.5} redMin={0.8} inverted
                format={(v) => `${v.toFixed(2)}×`}
                loading={jolts.loading || unemploy.loading}
                greenLabel="Tight" yellowLabel="Balanced" redLabel="Slack" />
            </GaugeCard>
          )
        })()}

        {/* Real Wages — nominal wage growth minus CPI */}
        {(() => {
          const delta = realWageV !== null && realWageP !== null ? realWageV - realWageP : null
          return (
            <GaugeCard title="Real Wage Growth"
              subtitle="Nominal avg hourly earnings YoY minus CPI YoY. Positive=real purchasing power growing."
              source="FRED AHETPI, CPIAUCSL (pc1)"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}%`}>
              {/* inverted: right side = positive real wages = green */}
              <GaugeChart value={realWageV} min={-5} max={5}
                greenMax={1} redMin={0} inverted
                format={(v) => `${v.toFixed(2)}%`}
                loading={ahetpi.loading || cpi.loading}
                greenLabel="Real Growth" yellowLabel="Flat" redLabel="Real Decline" />
            </GaugeCard>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════════════
            BOND MARKET
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

        {/* Yield Curve — 10Y minus 2Y */}
        {(() => {
          const delta = t10y2y.lastValue !== null && t10y2y.prevValue !== null ? t10y2y.lastValue - t10y2y.prevValue : null
          return (
            <GaugeCard title="Yield Curve — 10Y minus 2Y"
              subtitle="Classic recession predictor. Inversion (<0) precedes recessions by 6–18 months; watch the re-steepening."
              source="FRED T10Y2Y"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `${Math.abs(d * 100).toFixed(0)} bps`}>
              {/* inverted arc: right=green (positive spread=normal), left=red (negative=inverted curve) */}
              <GaugeChart value={t10y2y.lastValue} min={-3} max={3}
                greenMax={0.5} redMin={0} inverted
                format={(v) => `${(v * 100).toFixed(0)} bps`}
                loading={t10y2y.loading}
                greenLabel="Normal" yellowLabel="Flat" redLabel="Inverted" />
            </GaugeCard>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════════════
            PLUMBING
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

        {/* Bank Reserves to GDP */}
        {/* 2019 repo crisis: reserves ~$1.5T on ~$21T GDP = ~7%. Stress <7%, ample >10% */}
        {(() => {
          const delta = resGdpV !== null && resGdpP !== null ? resGdpV - resGdpP : null
          return (
            <GaugeCard title="Bank Reserves / GDP"
              subtitle="Fed reserve balances as % of GDP. <7%=stress (2019 repo crisis); >10%=ample"
              source="FRED WRBWFRBL, GDP"
              delta={delta} deltaColor={getDeltaColor(delta, false)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}%`}>
              {/* inverted: right=green (high reserves=ample), left=red (low=stress) */}
              <GaugeChart value={resGdpV} min={0} max={20}
                greenMax={10} redMin={7} inverted
                format={(v) => `${v.toFixed(1)}%`}
                loading={reserves.loading || gdp.loading}
                greenLabel="Ample" yellowLabel="Adequate" redLabel="Stress" />
            </GaugeCard>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════════════
            CORPORATE CREDIT
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

        {/* Corporate credit BAA − EFFR */}
        {(() => {
          const delta = baaffV !== null && baaffP !== null ? baaffV - baaffP : null
          return (
            <GaugeCard title="Corporate Credit — BAA minus EFFR"
              subtitle="Moody's Baa minus fed funds. Low=compressed spreads; High=credit stress"
              source="FRED DBAA, DFF"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}%`}>
              <GaugeChart value={baaffV} min={-1} max={6}
                greenMax={1.5} redMin={2.5}
                format={(v) => `${v.toFixed(2)}%`} loading={baa.loading || effr.loading}
                greenLabel="Compressed" yellowLabel="Normal" redLabel="Stress" />
            </GaugeCard>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════════════
            EQUITY MARKET
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

        {/* Gromen Buffett */}
        {(() => {
          const delta = gromenV !== null && gromenP !== null ? gromenV - gromenP : null
          return (
            <GaugeCard title="Buffett Indicator (Gromen)"
              subtitle="(US mktcap − federal debt) ÷ GDP. Strips QE-era debt premium. >100%=overvalued"
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

        {/* Equity % from ATH — SPX / NDX / RUT */}
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
                min={-60} max={0} greenMax={-5} redMin={-15} inverted
                format={(v) => `${v.toFixed(1)}%`}
                loading={spx.loading || spxH.loading}
                greenLabel="Near ATH" yellowLabel="Recovery" redLabel="Bear Zone" />
            </GaugeCard>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════════════
            CURRENCY
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
            OIL
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
            METALS
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
            BITCOIN
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
          <span className="text-text-secondary font-semibold">Business Cycle — CFNAI: </span>
          ISM Manufacturing PMI is not available via free APIs (ISM charges for distribution).
          The Chicago Fed National Activity Index (CFNAI) is the best free substitute — a
          weighted composite of 85 monthly indicators covering production, employment, personal
          consumption, and sales. Zero = historical trend growth. Above +0.5 = strong expansion;
          below −0.3 = contraction risk; sustained below −0.7 = likely recession.
        </div>
        <div className="bg-bg-card border border-bg-border rounded-xl px-4 py-3 text-[10.5px] text-text-muted leading-relaxed">
          <span className="text-text-secondary font-semibold">Bank Reserves / GDP: </span>
          In September 2019, reserve balances fell to ~$1.5T (~7% of ~$21T GDP) triggering the
          repo market crisis and forcing the Fed to restart asset purchases. The level at which
          reserves become structurally insufficient is estimated at 8–10% of GDP by the New York
          Fed. Below 7% is considered stress territory. Current: ~9.6% (adequate but declining).
        </div>
        <div className="bg-bg-card border border-bg-border rounded-xl px-4 py-3 text-[10.5px] text-text-muted leading-relaxed">
          <span className="text-text-secondary font-semibold">Interest Expense / Tax Receipts: </span>
          Net federal interest payments (SAAR) as a share of total federal tax receipts (SAAR).
          Currently ~33% — meaning 1 in 3 dollars of tax revenue goes purely to service existing
          debt, before any spending. At ~25% the OMB classifies debt as "severely stressed."
          Gromen argues this is the single most important fiscal metric: once it exceeds 30%
          governments historically must choose between default, inflation, or monetization.
        </div>
      </div>
    </div>
  )
}
