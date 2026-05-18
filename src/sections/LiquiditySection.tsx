import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { ChartCard, NoApiKeyCard, MetricCard } from '../components/cards/MetricCard'
import { MacroChart, MultiMacroChart } from '../components/charts/MacroChart'
import { GaugeChart, deltaColor as getDeltaColor } from '../components/charts/GaugeChart'
import { GaugeCard } from '../components/charts/GaugeCard'
import { Droplets, Activity, TrendingDown } from 'lucide-react'

const START = '2015-01-01'

// FRED unit notes:
// WALCL  = Millions of USD  → divide by 1000 to get $B for charts, /1e6 for T label
// WTREGEN = Millions of USD → divide by 1000 to get $B for charts, /1000 for $B label
// RRPONTSYD = Billions of USD → use directly (ON RRP facility balance)
// M2SL    = Billions of USD  → use directly
// BOGMBASE = Billions of USD → use directly
// WRBWFRBL = Billions of USD → use directly (replaces discontinued TOTRESNS)

export function LiquiditySection() {
  const { fredApiKey } = useApp()

  const fedBs    = useFRED('WALCL',    fredApiKey, { frequency: 'w', observationStart: START })
  const tga      = useFRED('WTREGEN',  fredApiKey, { frequency: 'w', observationStart: START })
  const rrp      = useFRED('RRPONTSYD', fredApiKey, { frequency: 'w', observationStart: START })
  const reserves = useFRED('WRBWFRBL', fredApiKey, { frequency: 'w', observationStart: START })
  const m2       = useFRED('M2SL',     fredApiKey, { frequency: 'm', observationStart: START })
  const m0       = useFRED('BOGMBASE', fredApiKey, { frequency: 'm', observationStart: START })
  const sofr     = useFRED('SOFR',     fredApiKey, { frequency: 'd', observationStart: '2018-01-01' })
  const iorb     = useFRED('IORB',     fredApiKey, { frequency: 'd', observationStart: '2021-07-01' })
  const gdp      = useFRED('GDP',      fredApiKey, { frequency: 'q', observationStart: '2000-01-01' })
  // Financial conditions indices
  const nfci     = useFRED('NFCI',     fredApiKey, { frequency: 'w', observationStart: '2025-01-01' })
  const stlfsi   = useFRED('STLFSI',   fredApiKey, { frequency: 'w', observationStart: '2025-01-01' })

  // Normalise WALCL (millions) → billions
  const fedBsB = useMemo(() => fedBs.data.map(d => ({ date: d.date, value: d.value / 1000 })), [fedBs.data])
  // Normalise WTREGEN (millions) → billions
  const tgaB   = useMemo(() => tga.data.map(d => ({ date: d.date, value: d.value / 1000 })), [tga.data])

  // Net liquidity = Fed BS - TGA - RRP (all in $B after normalisation)
  const netLiquidity = useMemo(() => {
    if (!fedBsB.length || !tgaB.length || !rrp.data.length) return []
    const tgaMap = new Map(tgaB.map(d => [d.date, d.value]))
    const rrpMap = new Map(rrp.data.map(d => [d.date, d.value]))
    return fedBsB
      .map(d => ({
        date: d.date,
        value: d.value - (tgaMap.get(d.date) ?? 0) - (rrpMap.get(d.date) ?? 0),
      }))
      .filter(d => d.value > 0)
  }, [fedBsB, tgaB, rrp.data])

  // SOFR − IORB spread
  const sofrIorbSpread = useMemo(() => {
    if (!sofr.data.length || !iorb.data.length) return []
    const iorbMap = new Map(iorb.data.map(d => [d.date, d.value]))
    return sofr.data
      .filter(d => iorbMap.has(d.date))
      .map(d => ({ date: d.date, value: d.value - (iorbMap.get(d.date) ?? d.value) }))
  }, [sofr.data, iorb.data])

  // M2/M0 multiplier (both in $B)
  const moneyMultiplier = useMemo(() => {
    if (!m2.data.length || !m0.data.length) return []
    const m0Map = new Map(m0.data.map(d => [d.date, d.value]))
    return m2.data
      .filter(d => m0Map.has(d.date) && (m0Map.get(d.date) ?? 0) > 0)
      .map(d => ({ date: d.date, value: d.value / (m0Map.get(d.date) ?? 1) }))
  }, [m2.data, m0.data])

  const lastSpread = sofrIorbSpread.length ? sofrIorbSpread[sofrIorbSpread.length - 1].value : null
  const prevSpread = sofrIorbSpread.length > 1 ? sofrIorbSpread[sofrIorbSpread.length - 2].value : null
  const lastNetLiq = netLiquidity.length ? netLiquidity[netLiquidity.length - 1].value : null
  const lastReserves = reserves.lastValue  // already in $B

  // Bank reserves to GDP %: WRBWFRBL ($M) / 1000 / GDP ($B) × 100
  const resGdpV = reserves.lastValue !== null && gdp.lastValue !== null
    ? (reserves.lastValue / 1000 / gdp.lastValue) * 100 : null
  const resGdpP = reserves.prevValue !== null && gdp.lastValue !== null
    ? (reserves.prevValue / 1000 / gdp.lastValue) * 100 : null

  if (!fredApiKey) return <div className="section-enter"><NoApiKeyCard /></div>

  return (
    <div className="section-enter flex flex-col gap-6">

      {/* ── Gauge summary ───────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10.5px] text-text-muted leading-relaxed mb-3">
          Plumbing stress gauges — green = easy liquidity conditions, red = stress.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

          {/* SOFR − IORB */}
          {(() => {
            const delta = lastSpread !== null && prevSpread !== null ? lastSpread - prevSpread : null
            return (
              <GaugeCard
                title="US Banking Stress — SOFR−IORB"
                subtitle="Repo stress proxy. <0=excess reserves; >0.10%=reserves scarce"
                source="FRED SOFR, IORB"
                delta={delta} deltaColor={getDeltaColor(delta, true)}
                formatDelta={(d) => `${Math.abs(d).toFixed(3)}%`}
              >
                <GaugeChart value={lastSpread} min={-0.2} max={0.5} greenMax={0} redMin={0.1}
                  format={(v) => `${v.toFixed(3)}%`} loading={sofr.loading || iorb.loading}
                  greenLabel="Easy" yellowLabel="Tighter" redLabel="Stress" />
              </GaugeCard>
            )
          })()}

          {/* Bank Reserves / GDP */}
          {(() => {
            const delta = resGdpV !== null && resGdpP !== null ? resGdpV - resGdpP : null
            return (
              <GaugeCard
                title="Bank Reserves / GDP"
                subtitle="Fed reserve balances as % of GDP. <7%=stress (2019 repo crisis); >10%=ample"
                source="FRED WRBWFRBL, GDP"
                delta={delta} deltaColor={getDeltaColor(delta, false)}
                formatDelta={(d) => `${Math.abs(d).toFixed(2)}%`}
              >
                <GaugeChart value={resGdpV} min={0} max={20}
                  greenMax={10} redMin={7} inverted
                  format={(v) => `${v.toFixed(1)}%`}
                  loading={reserves.loading || gdp.loading}
                  greenLabel="Ample" yellowLabel="Adequate" redLabel="Stress" />
              </GaugeCard>
            )
          })()}

          {/* NFCI — Chicago Fed National Financial Conditions */}
          {(() => {
            const delta = nfci.lastValue !== null && nfci.prevValue !== null ? nfci.lastValue - nfci.prevValue : null
            return (
              <GaugeCard
                title="Financial Conditions — NFCI"
                subtitle="Chicago Fed: <0=loose/accommodative; >0=tight; >1=significantly tight"
                source="FRED NFCI"
                delta={delta} deltaColor={getDeltaColor(delta, true)}
                formatDelta={(d) => `${Math.abs(d).toFixed(3)}`}
              >
                {/* inverted: left=red (tight/high), right=green (loose/low) */}
                <GaugeChart value={nfci.lastValue} min={-1} max={3}
                  greenMax={-0.5} redMin={0.5} inverted
                  format={(v) => v.toFixed(3)} loading={nfci.loading}
                  greenLabel="Loose" yellowLabel="Neutral" redLabel="Tight" />
              </GaugeCard>
            )
          })()}

          {/* STLFSI — St. Louis Financial Stress */}
          {(() => {
            const delta = stlfsi.lastValue !== null && stlfsi.prevValue !== null ? stlfsi.lastValue - stlfsi.prevValue : null
            return (
              <GaugeCard
                title="Financial Conditions — STLFSI"
                subtitle="St. Louis Fed: <0=below-average stress; >1=elevated; >2=extreme stress"
                source="FRED STLFSI"
                delta={delta} deltaColor={getDeltaColor(delta, true)}
                formatDelta={(d) => `${Math.abs(d).toFixed(3)}`}
              >
                <GaugeChart value={stlfsi.lastValue} min={-2} max={5}
                  greenMax={-0.5} redMin={1} inverted
                  format={(v) => v.toFixed(3)} loading={stlfsi.loading}
                  greenLabel="Low Stress" yellowLabel="Normal" redLabel="High Stress" />
              </GaugeCard>
            )
          })()}

        </div>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Net Fed Liquidity"
          value={lastNetLiq !== null ? `$${(lastNetLiq / 1000).toFixed(1)}T` : null}
          subtitle="Fed BS − TGA − RRP ($B)"
          color="#3b82f6"
          loading={fedBs.loading || tga.loading || rrp.loading}
          icon={<Droplets size={14} />}
        />
        <MetricCard
          label="SOFR − IORB Spread"
          value={lastSpread !== null ? `${lastSpread.toFixed(3)}%` : null}
          subtitle="Repo market stress proxy"
          color={Math.abs(lastSpread ?? 0) > 0.1 ? '#ef4444' : '#22c55e'}
          loading={sofr.loading || iorb.loading}
          icon={<Activity size={14} />}
        />
        <MetricCard
          label="M2 Money Supply"
          value={m2.lastValue ? `$${(m2.lastValue / 1000).toFixed(1)}T` : null}
          change={m2.lastValue && m2.prevValue ? ((m2.lastValue - m2.prevValue) / m2.prevValue) * 100 : null}
          subtitle="M2SL — $B → T"
          color="#8b5cf6"
          loading={m2.loading}
        />
        <MetricCard
          label="Bank Reserves"
          value={lastReserves !== null ? `$${(lastReserves / 1000).toFixed(2)}T` : null}
          subtitle="WRBWFRBL — $B"
          color="#00d4aa"
          loading={reserves.loading}
          icon={<TrendingDown size={14} />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Net Federal Reserve Liquidity"
          subtitle="Fed Balance Sheet − TGA − Reverse Repo (all in $B)"
          height={300}
          badge="FRED"
          note="Howell-style proxy. Rising = more dollars in banking system → risk assets follow ~3–6 months later."
        >
          {netLiquidity.length > 0 ? (
            <MacroChart data={netLiquidity} label="Net Liq ($B)" color="#3b82f6" unit="B" denominate />
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              {fedBs.loading ? 'Loading…' : 'Waiting for data…'}
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Fed Balance Sheet (WALCL)"
          subtitle="Total Assets in $B — QE and QT cycles"
          height={300}
          badge="FRED"
        >
          {fedBsB.length > 0 ? (
            <MacroChart data={fedBsB} label="Fed Assets ($B)" color="#3b82f6" unit="B" denominate />
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading…</div>
          )}
        </ChartCard>

        <ChartCard
          title="M2 vs. Monetary Base (M0)"
          subtitle="Broad money vs. base money — both in $T"
          height={300}
          badge="FRED"
        >
          {m2.data.length > 0 && m0.data.length > 0 ? (
            (() => {
              const m0Map = new Map(m0.data.map(d => [d.date, d.value]))
              const combined = m2.data
                .filter(d => m0Map.has(d.date))
                .map(d => ({
                  date: d.date,
                  'M2 ($B)': d.value,
                  'M0 ($B)': m0Map.get(d.date) ?? 0,
                }))
              return (
                <MultiMacroChart
                  data={combined}
                  series={[
                    { key: 'M2 ($B)', label: 'M2 ($B)', color: '#8b5cf6' },
                    { key: 'M0 ($B)', label: 'M0 / Base ($B)', color: '#00d4aa' },
                  ]}
                />
              )
            })()
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading…</div>
          )}
        </ChartCard>

        <ChartCard
          title="Bank Reserves at Fed (WRBWFRBL)"
          subtitle="Reserve balances in $B — key plumbing metric"
          height={300}
          badge="FRED"
          note="Below ~$3T signals emerging repo stress risk."
        >
          {reserves.data.length > 0 ? (
            <MacroChart data={reserves.data} label="Reserves ($B)" color="#00d4aa" unit="B" denominate />
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              {reserves.loading ? 'Loading…' : 'No data'}
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="SOFR − IORB Spread"
          subtitle="Repo stress (positive = reserves scarce; negative = excess)"
          height={300}
          badge="FRED"
        >
          {sofrIorbSpread.length > 0 ? (
            <MacroChart
              data={sofrIorbSpread}
              label="SOFR−IORB"
              color={Math.abs(lastSpread ?? 0) > 0.1 ? '#ef4444' : '#22c55e'}
              unit="%"
              type="line"
              refLine={0}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading…</div>
          )}
        </ChartCard>

        <ChartCard
          title="Money Multiplier (M2/M0)"
          subtitle="Credit expansion efficiency — structural decline = QT pressure"
          height={300}
          badge="FRED"
        >
          {moneyMultiplier.length > 0 ? (
            <MacroChart data={moneyMultiplier} label="Multiplier" color="#f59e0b" type="line" />
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading…</div>
          )}
        </ChartCard>
      </div>

      <div className="bg-bg-card border border-bg-border rounded-xl p-4">
        <h4 className="text-sm font-medium text-text-secondary mb-2">
          Michael Howell / Lyn Alden Liquidity Framework
        </h4>
        <p className="text-xs text-text-muted leading-relaxed">
          Global liquidity = Central bank balance sheets + shadow banking + private credit creation.
          The <strong className="text-text-secondary">net Fed liquidity</strong> metric (Fed BS − TGA − RRP)
          shows dollars available in the banking system. TGA drawdown or RRP drainage → liquidity injection.
          Bitcoin and risk assets historically lead this cycle by ~3–6 months.
          A full Howell global liquidity index requires ECB, PBoC, and BoJ balance sheets — see Central Banks.
        </p>
      </div>
    </div>
  )
}
