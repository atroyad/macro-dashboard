import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { useYahoo } from '../hooks/useYahoo'
import { GaugeChart, zoneColor } from '../components/charts/GaugeChart'

// ─── GaugeCard ───────────────────────────────────────────────────────────────
interface GaugeCardProps {
  title: string
  subtitle: string
  children: React.ReactNode   // the <GaugeChart /> element
  delta: number | null
  deltaColor: string
  formatDelta: (d: number) => string
  source?: string
}

function GaugeCard({ title, subtitle, children, delta, deltaColor, formatDelta, source }: GaugeCardProps) {
  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-start justify-between gap-1 min-h-[2.2rem]">
        <p className="text-[11px] font-semibold text-text-primary leading-tight">{title}</p>
        {delta !== null && (
          <span className="text-[11px] font-mono whitespace-nowrap shrink-0 leading-tight" style={{ color: deltaColor }}>
            ({delta >= 0 ? '+' : ''}{formatDelta(delta)})
          </span>
        )}
      </div>

      {children}

      <div className="flex items-center justify-between text-[9.5px] font-mono mt-0.5">
        <span className="text-text-muted truncate">{subtitle}</span>
        {source && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-muted shrink-0 ml-1">{source}</span>
        )}
      </div>
    </div>
  )
}

// ─── OverviewSection ─────────────────────────────────────────────────────────
export function OverviewSection() {
  const { fredApiKey } = useApp()

  // ── FRED data ────────────────────────────────────────────────────────────
  const S = '2025-01-01'

  // VIX, SOFR, IORB, US yields — FRED
  const vix    = useFRED('VIXCLS',           fredApiKey, { frequency: 'd', observationStart: S })
  const sofr   = useFRED('SOFR',             fredApiKey, { frequency: 'd', observationStart: S })
  const iorb   = useFRED('IORB',             fredApiKey, { frequency: 'd', observationStart: S })
  const us30y  = useFRED('DGS30',            fredApiKey, { frequency: 'd', observationStart: S })
  const us10y  = useFRED('DGS10',            fredApiKey, { frequency: 'd', observationStart: S })
  const usdjpy = useFRED('DEXJPUS',          fredApiKey, { frequency: 'd', observationStart: S })

  // Commodities
  const gold   = useFRED('GOLDAMGBD228NLBM', fredApiKey, { frequency: 'd', observationStart: S })
  const wti    = useFRED('DCOILWTICO',       fredApiKey, { frequency: 'd', observationStart: S })
  const brent  = useFRED('DCOILBRENTEU',     fredApiKey, { frequency: 'd', observationStart: S })
  const silver = useFRED('SLVPRUSD',         fredApiKey, { frequency: 'd', observationStart: S })
  const copper = useFRED('PCOPPUSDM',        fredApiKey, { frequency: 'm', observationStart: '2024-01-01' })
  const cny    = useFRED('DEXCHUS',          fredApiKey, { frequency: 'd', observationStart: S })

  // Bitcoin
  const btc    = useFRED('CBBTCUSD',         fredApiKey, { frequency: 'd', observationStart: S })

  // ── Yahoo Finance — for ICE DXY and MOVE (not freely available on FRED) ──
  // DX-Y.NYB = ICE US Dollar Index futures (continuous)
  const dxy  = useYahoo('DX-Y.NYB')
  // ^MOVE = ICE BofA MOVE Treasury Volatility Index
  const move = useYahoo('^MOVE')
  // Front-month WTI and Brent futures (for the "equivalent delivery" gauge)
  const clf  = useYahoo('CL=F')   // NYMEX WTI front-month
  const bzf  = useYahoo('BZ=F')   // ICE Brent front-month

  // ── Derived metrics ──────────────────────────────────────────────────────

  const sofrIorbLast = sofr.lastValue !== null && iorb.lastValue !== null
    ? sofr.lastValue - iorb.lastValue : null
  const sofrIorbPrev = sofr.prevValue !== null && iorb.prevValue !== null
    ? sofr.prevValue - iorb.prevValue : null

  // Gold/CNY
  const goldCnyLast = gold.lastValue !== null && cny.lastValue !== null
    ? gold.lastValue * cny.lastValue : null
  const goldCnyPrev = gold.prevValue !== null && cny.prevValue !== null
    ? gold.prevValue * cny.prevValue : null

  // Gold/Oil (Howell uses WTI — how many barrels of WTI per troy oz of gold)
  const goldOilLast = gold.lastValue !== null && wti.lastValue !== null && wti.lastValue > 0
    ? gold.lastValue / wti.lastValue : null
  const goldOilPrev = gold.prevValue !== null && wti.prevValue !== null && wti.prevValue > 0
    ? gold.prevValue / wti.prevValue : null

  // Gold/Silver ratio
  const goldSilverLast = gold.lastValue !== null && silver.lastValue !== null && silver.lastValue > 0
    ? gold.lastValue / silver.lastValue : null
  const goldSilverPrev = gold.prevValue !== null && silver.prevValue !== null && silver.prevValue > 0
    ? gold.prevValue / silver.prevValue : null

  // Copper/Silver (copper lb = PCOPPUSDM / 2204.62 USD/lb)
  const cuLb     = copper.lastValue !== null ? copper.lastValue / 2204.62 : null
  const cuLbPrev = copper.prevValue !== null ? copper.prevValue / 2204.62 : null
  const cuAgLast = cuLb     !== null && silver.lastValue !== null && silver.lastValue > 0
    ? cuLb     / silver.lastValue : null
  const cuAgPrev = cuLbPrev !== null && silver.prevValue !== null && silver.prevValue > 0
    ? cuLbPrev / silver.prevValue : null

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
      <p className="text-[11px] text-text-muted leading-relaxed">
        Macro risk gauges — colored arc: <span className="text-green-500">green = safe</span>,{' '}
        <span className="text-yellow-500">yellow = caution</span>,{' '}
        <span className="text-red-500">red = stress</span>.
        MOVE &amp; DXY via Yahoo Finance (ICE). All others via FRED API.
        Daily change shown in parentheses.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">

        {/* ─── 1. MOVE ──────────────────────────────────────────────────── */}
        <GaugeCard
          title="Bond Volatility — MOVE"
          subtitle="ICE BofA MOVE Index. >100=elevated; >150=crisis"
          source="Yahoo: ^MOVE"
          delta={move.value !== null && move.prev !== null ? move.value - move.prev : null}
          deltaColor={zoneColor(move.value, 70, 140)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(1)}`}
        >
          <GaugeChart
            value={move.value}
            min={0} max={200} greenMax={70} redMin={140}
            format={(v) => v.toFixed(1)}
            loading={move.loading}
            greenLabel="Calm" yellowLabel="Elevated" redLabel="Crisis"
          />
        </GaugeCard>

        {/* ─── 2. VIX ───────────────────────────────────────────────────── */}
        <GaugeCard
          title="Equity Volatility — VIX"
          subtitle="CBOE Volatility Index. >28=fear; >40=panic"
          source="FRED: VIXCLS"
          delta={vix.lastValue !== null && vix.prevValue !== null ? vix.lastValue - vix.prevValue : null}
          deltaColor={zoneColor(vix.lastValue, 14, 28)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(2)}`}
        >
          <GaugeChart
            value={vix.lastValue}
            min={0} max={80} greenMax={14} redMin={28}
            format={(v) => v.toFixed(1)}
            loading={vix.loading}
            greenLabel="Calm" yellowLabel="Caution" redLabel="Panic"
          />
        </GaugeCard>

        {/* ─── 3. SOFR − IORB ───────────────────────────────────────────── */}
        <GaugeCard
          title="US Banking Stress — SOFR−IORB"
          subtitle="Repo stress. Negative=excess reserves; >0.10=scarce"
          source="FRED: SOFR, IORB"
          delta={sofrIorbLast !== null && sofrIorbPrev !== null ? sofrIorbLast - sofrIorbPrev : null}
          deltaColor={zoneColor(sofrIorbLast, 0, 0.1)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(3)}%`}
        >
          <GaugeChart
            value={sofrIorbLast}
            min={-0.2} max={0.5} greenMax={0} redMin={0.1}
            format={(v) => `${v.toFixed(3)}%`}
            loading={sofr.loading || iorb.loading}
            greenLabel="Easy" yellowLabel="Tighter" redLabel="Stress"
          />
        </GaugeCard>

        {/* ─── 4. US 30Y ────────────────────────────────────────────────── */}
        <GaugeCard
          title="US Fiscal Pressure — 30Y"
          subtitle="30Y Treasury yield. >5%=fiscal dominance risk"
          source="FRED: DGS30"
          delta={us30y.lastValue !== null && us30y.prevValue !== null ? us30y.lastValue - us30y.prevValue : null}
          deltaColor={zoneColor(us30y.lastValue, 2.5, 5)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)} bps`}
        >
          <GaugeChart
            value={us30y.lastValue}
            min={0} max={8} greenMax={2.5} redMin={5}
            format={(v) => `${v.toFixed(2)}%`}
            loading={us30y.loading}
            greenLabel="Low" yellowLabel="Normal" redLabel="High"
          />
        </GaugeCard>

        {/* ─── 5. US 10Y ────────────────────────────────────────────────── */}
        <GaugeCard
          title="US Fiscal Pressure — 10Y"
          subtitle="10Y Treasury yield. >4.5%=refinancing pressure"
          source="FRED: DGS10"
          delta={us10y.lastValue !== null && us10y.prevValue !== null ? us10y.lastValue - us10y.prevValue : null}
          deltaColor={zoneColor(us10y.lastValue, 2, 4.5)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)} bps`}
        >
          <GaugeChart
            value={us10y.lastValue}
            min={0} max={7} greenMax={2} redMin={4.5}
            format={(v) => `${v.toFixed(2)}%`}
            loading={us10y.loading}
            greenLabel="Low" yellowLabel="Normal" redLabel="High"
          />
        </GaugeCard>

        {/* ─── 6. USD/JPY ───────────────────────────────────────────────── */}
        <GaugeCard
          title="JPY Hyperinflation — USD/JPY"
          subtitle="Yen per USD. >160=BoJ stress / carry trade unwind risk"
          source="FRED: DEXJPUS"
          delta={usdjpy.lastValue !== null && usdjpy.prevValue !== null ? usdjpy.lastValue - usdjpy.prevValue : null}
          deltaColor={zoneColor(usdjpy.lastValue, 100, 160)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(2)}`}
        >
          <GaugeChart
            value={usdjpy.lastValue}
            min={80} max={200} greenMax={100} redMin={160}
            format={(v) => v.toFixed(1)}
            loading={usdjpy.loading}
            greenLabel="Strong ¥" yellowLabel="Weak" redLabel="Crisis"
          />
        </GaugeCard>

        {/* ─── 7. DXY (ICE) ─────────────────────────────────────────────── */}
        <GaugeCard
          title="USD Strength — DXY (ICE)"
          subtitle="ICE US Dollar Index. <80=weak; >100=strong dollar pressure"
          source="Yahoo: DX-Y.NYB"
          delta={dxy.value !== null && dxy.prev !== null ? dxy.value - dxy.prev : null}
          deltaColor={zoneColor(dxy.value, 80, 100)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(2)}`}
        >
          <GaugeChart
            value={dxy.value}
            min={70} max={120} greenMax={80} redMin={100}
            format={(v) => v.toFixed(1)}
            loading={dxy.loading}
            greenLabel="Weak $" yellowLabel="Normal" redLabel="Strong $"
          />
        </GaugeCard>

        {/* ─── 8. Gold USD ──────────────────────────────────────────────── */}
        <GaugeCard
          title="Gold Renaissance — Gold (USD)"
          subtitle="LBMA Gold spot USD/oz. Rising=monetary remonetization"
          source="FRED: GOLDAMGBD228NLBM"
          delta={gold.lastValue !== null && gold.prevValue !== null ? gold.lastValue - gold.prevValue : null}
          deltaColor={zoneColor(gold.lastValue, 4000, 5500)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}$${Math.abs(d).toFixed(0)}`}
        >
          <GaugeChart
            value={gold.lastValue}
            min={1500} max={7000} greenMax={4000} redMin={5500}
            format={(v) => `$${(v / 1000).toFixed(1)}k`}
            loading={gold.loading}
            greenLabel="Fair" yellowLabel="Rich" redLabel="Extreme"
          />
        </GaugeCard>

        {/* ─── 9. Gold/CNY ──────────────────────────────────────────────── */}
        <GaugeCard
          title="Gold/CNY — Yuan per Oz"
          subtitle="Gold priced in Chinese Yuan. Petrogold transition proxy"
          source="FRED: GOLD × DEXCHUS"
          delta={goldCnyLast !== null && goldCnyPrev !== null ? goldCnyLast - goldCnyPrev : null}
          deltaColor={zoneColor(goldCnyLast, 30000, 35000)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}¥${Math.abs(d / 1000).toFixed(1)}k`}
        >
          <GaugeChart
            value={goldCnyLast}
            min={10000} max={50000} greenMax={30000} redMin={35000}
            format={(v) => `¥${(v / 1000).toFixed(0)}k`}
            loading={gold.loading || cny.loading}
            greenLabel="Low" yellowLabel="Elevated" redLabel="High"
          />
        </GaugeCard>

        {/* ─── 10. Oil — Spot (WTI + Brent, two needles) ───────────────── */}
        <GaugeCard
          title="Energy — Oil Spot Prices"
          subtitle="WTI (Cushing) & Brent spot, USD/bbl — same-day equivalents"
          source="FRED: DCOILWTICO, DCOILBRENTEU"
          delta={wti.lastValue !== null && wti.prevValue !== null ? wti.lastValue - wti.prevValue : null}
          deltaColor={zoneColor(wti.lastValue, 60, 120)}
          formatDelta={(d) => `WTI ${d >= 0 ? '+' : ''}$${Math.abs(d).toFixed(2)}`}
        >
          <GaugeChart
            needles={[
              { value: wti.lastValue,   color: '#3b82f6', label: 'WTI' },
              { value: brent.lastValue, color: '#f59e0b', label: 'Brent' },
            ]}
            min={0} max={200} greenMax={60} redMin={120}
            format={(v) => `$${v.toFixed(0)}`}
            loading={wti.loading || brent.loading}
            greenLabel="Cheap" yellowLabel="Normal" redLabel="Expensive"
          />
        </GaugeCard>

        {/* ─── 11. Oil — Front Month (WTI CL=F + Brent BZ=F) ──────────── */}
        <GaugeCard
          title="Energy — Oil Futures (Front Month)"
          subtitle="WTI CL=F & Brent BZ=F front-month — equivalent delivery horizon"
          source="Yahoo: CL=F, BZ=F"
          delta={clf.value !== null && clf.prev !== null ? clf.value - clf.prev : null}
          deltaColor={zoneColor(clf.value, 60, 120)}
          formatDelta={(d) => `WTI ${d >= 0 ? '+' : ''}$${Math.abs(d).toFixed(2)}`}
        >
          <GaugeChart
            needles={[
              { value: clf.value, color: '#3b82f6', label: 'WTI F1' },
              { value: bzf.value, color: '#f59e0b', label: 'Brent F1' },
            ]}
            min={0} max={200} greenMax={60} redMin={120}
            format={(v) => `$${v.toFixed(0)}`}
            loading={clf.loading || bzf.loading}
            greenLabel="Cheap" yellowLabel="Normal" redLabel="Expensive"
          />
        </GaugeCard>

        {/* ─── 12. Gold/Oil (Howell) ────────────────────────────────────── */}
        <GaugeCard
          title="Gold/Oil Ratio (Howell)"
          subtitle="Barrels of WTI per oz gold. Howell: rising=excess dollar liquidity; signals gold outperforming real economy"
          source="FRED: GOLD ÷ WTI"
          delta={goldOilLast !== null && goldOilPrev !== null ? goldOilLast - goldOilPrev : null}
          deltaColor={zoneColor(goldOilLast, 20, 40)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(2)}`}
        >
          <GaugeChart
            value={goldOilLast}
            min={5} max={65} greenMax={20} redMin={40}
            format={(v) => v.toFixed(1)}
            loading={gold.loading || wti.loading}
            greenLabel="Normal" yellowLabel="Elevated" redLabel="Extreme"
          />
        </GaugeCard>

        {/* ─── 13. Gold/Silver ──────────────────────────────────────────── */}
        <GaugeCard
          title="Gold/Silver Ratio"
          subtitle="Oz of gold per oz of silver. <25=silver bull; >120=extreme silver undervaluation"
          source="FRED: GOLD ÷ SLVPRUSD"
          delta={goldSilverLast !== null && goldSilverPrev !== null ? goldSilverLast - goldSilverPrev : null}
          deltaColor={zoneColor(goldSilverLast, 25, 120)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(2)}`}
        >
          <GaugeChart
            value={goldSilverLast}
            min={0} max={150} greenMax={25} redMin={120}
            format={(v) => v.toFixed(1)}
            loading={gold.loading || silver.loading}
            greenLabel="Silver Bull" yellowLabel="Normal" redLabel="Extreme"
          />
        </GaugeCard>

        {/* ─── 14. Copper/Silver ────────────────────────────────────────── */}
        <GaugeCard
          title="Copper/Silver Ratio (Cu/Ag)"
          subtitle="(Cu USD/lb) ÷ (Ag USD/oz). Ratio < 0.10 = silver expensive vs copper"
          source="FRED: PCOPPUSDM ÷ SLVPRUSD"
          delta={cuAgLast !== null && cuAgPrev !== null ? cuAgLast - cuAgPrev : null}
          deltaColor={zoneColor(cuAgLast, 0.1, 0.3)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}${d.toFixed(4)}`}
        >
          <GaugeChart
            value={cuAgLast}
            min={0} max={0.4} greenMax={0.1} redMin={0.3}
            format={(v) => v.toFixed(3)}
            loading={copper.loading || silver.loading}
            greenLabel="Low" yellowLabel="Normal" redLabel="High"
          />
        </GaugeCard>

        {/* ─── 15. Bitcoin ──────────────────────────────────────────────── */}
        <GaugeCard
          title="Bitcoin Bear Market Thermometer"
          subtitle="BTC/USD. <$65k=bull; >$95k=blow-off top risk"
          source="FRED: CBBTCUSD"
          delta={btc.lastValue !== null && btc.prevValue !== null ? btc.lastValue - btc.prevValue : null}
          deltaColor={zoneColor(btc.lastValue, 65000, 95000)}
          formatDelta={(d) => `${d >= 0 ? '+' : ''}$${Math.abs(d / 1000).toFixed(1)}k`}
        >
          <GaugeChart
            value={btc.lastValue}
            min={0} max={200000} greenMax={65000} redMin={95000}
            format={(v) => `$${(v / 1000).toFixed(0)}k`}
            loading={btc.loading}
            greenLabel="Bull" yellowLabel="Frothy" redLabel="Blow-off"
          />
        </GaugeCard>

      </div>

      {/* Howell Gold/Oil note */}
      <div className="bg-bg-card border border-bg-border rounded-xl px-4 py-3 text-[11px] text-text-muted leading-relaxed">
        <span className="text-text-secondary font-medium">Howell Gold/Oil framework: </span>
        Michael Howell (CrossBorder Capital) uses the Gold/Oil ratio as a liquidity indicator.
        Rising ratio (gold outperforming WTI) = financial liquidity accumulating in stores of value faster
        than real economic activity — signals expansionary monetary conditions or declining physical demand.
        He tracks this alongside his Global Liquidity Index (Fed + ECB + PBoC + BoJ balance sheets minus sterilization).
        A ratio above ~30× historically coincides with late-cycle excess liquidity or disinflationary impulse.
      </div>
    </div>
  )
}
