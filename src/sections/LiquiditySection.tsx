import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { ChartCard, NoApiKeyCard, MetricCard } from '../components/cards/MetricCard'
import { MacroChart, MultiMacroChart } from '../components/charts/MacroChart'
import { Droplets, Activity, TrendingDown } from 'lucide-react'

const START = '2015-01-01'

export function LiquiditySection() {
  const { fredApiKey } = useApp()

  const fedBs = useFRED('WALCL', fredApiKey, { frequency: 'w', observationStart: START })
  const tga = useFRED('WTREGEN', fredApiKey, { frequency: 'w', observationStart: START })
  const rrp = useFRED('WLRRAL', fredApiKey, { frequency: 'w', observationStart: START })
  const reserves = useFRED('TOTRESNS', fredApiKey, { frequency: 'w', observationStart: START })
  const m2 = useFRED('M2SL', fredApiKey, { frequency: 'm', observationStart: START })
  const m0 = useFRED('BOGMBASE', fredApiKey, { frequency: 'm', observationStart: START })
  const sofr = useFRED('SOFR', fredApiKey, { frequency: 'd', observationStart: '2018-01-01' })
  const iorb = useFRED('IORB', fredApiKey, { frequency: 'd', observationStart: '2021-07-01' })

  // Net liquidity = Fed BS - TGA - RRP
  const netLiquidity = useMemo(() => {
    if (!fedBs.data.length || !tga.data.length || !rrp.data.length) return []
    const tgaMap = new Map(tga.data.map((d) => [d.date, d.value]))
    const rrpMap = new Map(rrp.data.map((d) => [d.date, d.value]))
    return fedBs.data
      .map((d) => {
        const t = tgaMap.get(d.date) ?? 0
        const r = rrpMap.get(d.date) ?? 0
        // Fed BS in $M, TGA in $M, RRP in $B → convert
        return { date: d.date, value: d.value - t / 1000 - r }
      })
      .filter((d) => d.value > 0)
  }, [fedBs.data, tga.data, rrp.data])

  // SOFR - IORB spread
  const sofrIorbSpread = useMemo(() => {
    if (!sofr.data.length || !iorb.data.length) return []
    const iorbMap = new Map(iorb.data.map((d) => [d.date, d.value]))
    return sofr.data
      .filter((d) => iorbMap.has(d.date))
      .map((d) => ({
        date: d.date,
        value: d.value - (iorbMap.get(d.date) ?? d.value),
      }))
  }, [sofr.data, iorb.data])

  // M2/M0 multiplier
  const moneyMultiplier = useMemo(() => {
    if (!m2.data.length || !m0.data.length) return []
    const m0Map = new Map(m0.data.map((d) => [d.date, d.value]))
    return m2.data
      .filter((d) => m0Map.has(d.date) && (m0Map.get(d.date) ?? 0) > 0)
      .map((d) => ({
        date: d.date,
        value: d.value / (m0Map.get(d.date) ?? 1),
      }))
  }, [m2.data, m0.data])

  const lastSpread = sofrIorbSpread.length
    ? sofrIorbSpread[sofrIorbSpread.length - 1].value
    : null

  if (!fredApiKey) return (
    <div className="section-enter">
      <NoApiKeyCard />
    </div>
  )

  return (
    <div className="section-enter flex flex-col gap-6">
      {/* Top cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Net Fed Liquidity"
          value={netLiquidity.length ? `$${(netLiquidity[netLiquidity.length - 1].value / 1000).toFixed(1)}T` : null}
          subtitle="Fed BS − TGA − RRP"
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
          subtitle="M2SL — broad money"
          color="#8b5cf6"
          loading={m2.loading}
        />
        <MetricCard
          label="Money Multiplier"
          value={moneyMultiplier.length ? `${moneyMultiplier[moneyMultiplier.length - 1].value.toFixed(2)}x` : null}
          subtitle="M2 / M0 (monetary base)"
          color="#00d4aa"
          loading={m2.loading || m0.loading}
          icon={<TrendingDown size={14} />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Net Federal Reserve Liquidity"
          subtitle="Fed Balance Sheet − Treasury General Account − Reverse Repo"
          height={300}
          badge="FRED"
          note="Howell-style net liquidity proxy. Positive = money injected into banking system."
        >
          {netLiquidity.length > 0 ? (
            <MacroChart data={netLiquidity} label="Net Liq" color="#3b82f6" unit="B" denominate />
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              {fedBs.loading ? 'Loading…' : 'Waiting for data…'}
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Fed Balance Sheet Components"
          subtitle="Total Assets vs. TGA drawdown vs. RRP"
          height={300}
          badge="FRED"
        >
          {fedBs.data.length > 0 ? (
            <MacroChart data={fedBs.data} label="Fed Assets ($B)" color="#3b82f6" unit="B" denominate />
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              Loading…
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="M2 vs. Monetary Base (M0)"
          subtitle="Broad money supply expansion vs. base money"
          height={300}
          badge="FRED"
        >
          {m2.data.length > 0 && m0.data.length > 0 ? (
            (() => {
              const m0Map = new Map(m0.data.map((d) => [d.date, d.value]))
              const combined = m2.data
                .filter((d) => m0Map.has(d.date))
                .map((d) => ({
                  date: d.date,
                  M2: d.value / 1000,
                  M0: (m0Map.get(d.date) ?? 0) / 1000,
                }))
              return (
                <MultiMacroChart
                  data={combined}
                  series={[
                    { key: 'M2', label: 'M2 ($T)', color: '#8b5cf6' },
                    { key: 'M0', label: 'M0 / Base ($T)', color: '#00d4aa' },
                  ]}
                />
              )
            })()
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              Loading…
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Bank Reserves at Fed"
          subtitle="Reserve balances — key plumbing metric"
          height={300}
          badge="FRED"
          note="Reserves below ~$3T historically signal repo stress risk."
        >
          {reserves.data.length > 0 ? (
            <MacroChart data={reserves.data} label="Reserves ($B)" color="#00d4aa" unit="B" denominate />
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              Loading…
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="SOFR − IORB Spread"
          subtitle="Repo market stress indicator (bps from IORB floor)"
          height={300}
          badge="FRED"
          note="Persistent positive spread signals reserves scarcity / repo stress. Negative = excess liquidity."
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
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              Loading…
            </div>
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
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              Loading…
            </div>
          )}
        </ChartCard>
      </div>

      {/* Context note */}
      <div className="bg-bg-card border border-bg-border rounded-xl p-4">
        <h4 className="text-sm font-medium text-text-secondary mb-2">
          Michael Howell / Lyn Alden Liquidity Framework
        </h4>
        <p className="text-xs text-text-muted leading-relaxed">
          Global liquidity = Central bank balance sheets + shadow banking + private credit creation.
          The <strong className="text-text-secondary">net Fed liquidity</strong> metric above (Fed BS − TGA − RRP) approximates the
          dollars available in the banking system. When TGA is drawn down (Treasury spending) or RRP decreases
          (money leaves the Fed's overnight facility), liquidity expands. Bitcoin and risk assets historically
          lead this cycle by ~3–6 months. A full Howell global liquidity index also requires ECB,
          PBoC, and BoJ balance sheet data — covered in the Central Banks section.
        </p>
      </div>
    </div>
  )
}
