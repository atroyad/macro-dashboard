import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { MetricCard, ChartCard, NoApiKeyCard } from '../components/cards/MetricCard'
import { MacroChart } from '../components/charts/MacroChart'
import { TickerTape } from '../components/charts/TradingViewChart'
import { TrendingUp, TrendingDown, Activity, Landmark, DollarSign, Zap } from 'lucide-react'

const TICKER_SYMBOLS = [
  { proName: 'SP:SPX', title: 'S&P 500' },
  { proName: 'NASDAQ:NDX', title: 'NASDAQ 100' },
  { proName: 'TVC:DXY', title: 'DXY' },
  { proName: 'TVC:GOLD', title: 'Gold' },
  { proName: 'TVC:SILVER', title: 'Silver' },
  { proName: 'TVC:USOIL', title: 'WTI Oil' },
  { proName: 'TVC:UKOIL', title: 'Brent Oil' },
  { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
  { proName: 'TVC:US10Y', title: 'US 10Y' },
  { proName: 'CBOE:VIX', title: 'VIX' },
  { proName: 'TVC:JP10Y', title: 'JGB 10Y' },
  { proName: 'TVC:DE10Y', title: 'Bund 10Y' },
  { proName: 'FX:USDJPY', title: 'USD/JPY' },
  { proName: 'FX:EURUSD', title: 'EUR/USD' },
]

function fmt(v: number | null, unit: string) {
  if (v === null) return null
  if (unit === 'B') return `$${(v / 1000).toFixed(1)}T`
  if (unit === 'T') return `$${v.toFixed(2)}T`
  if (unit === '%') return `${v.toFixed(2)}%`
  if (unit === 'M$') return `$${(v / 1e6).toFixed(2)}T`
  return v.toFixed(2)
}

function pctChange(last: number | null, prev: number | null) {
  if (!last || !prev) return null
  return ((last - prev) / Math.abs(prev)) * 100
}

export function OverviewSection() {
  const { fredApiKey } = useApp()

  // Key macro series
  const fedBs = useFRED('WALCL', fredApiKey, { frequency: 'w', observationStart: '2020-01-01' })
  const tga = useFRED('WTREGEN', fredApiKey, { frequency: 'w', observationStart: '2020-01-01' })
  const reserves = useFRED('TOTRESNS', fredApiKey, { frequency: 'w', observationStart: '2020-01-01' })
  const m2 = useFRED('M2SL', fredApiKey, { frequency: 'm', observationStart: '2020-01-01' })
  const us10y = useFRED('DGS10', fredApiKey, { frequency: 'd', observationStart: '2023-01-01' })
  const sofr = useFRED('SOFR', fredApiKey, { frequency: 'd', observationStart: '2023-01-01' })

  const cards = [
    {
      label: 'Fed Balance Sheet',
      value: fmt(fedBs.lastValue, 'B'),
      change: pctChange(fedBs.lastValue, fedBs.prevValue),
      changeLabel: '%',
      subtitle: 'WALCL — weekly, $B',
      color: '#3b82f6',
      icon: <Landmark size={14} />,
      loading: fedBs.loading,
    },
    {
      label: 'Treasury Gen. Account',
      value: fedBs.lastValue ? `$${(tga.lastValue ?? 0 / 1e3).toFixed(1)}B` : null,
      change: pctChange(tga.lastValue, tga.prevValue),
      changeLabel: '%',
      subtitle: 'WTREGEN — weekly',
      color: '#f59e0b',
      icon: <DollarSign size={14} />,
      loading: tga.loading,
    },
    {
      label: 'Bank Reserves',
      value: reserves.lastValue ? `$${(reserves.lastValue / 1000).toFixed(1)}T` : null,
      change: pctChange(reserves.lastValue, reserves.prevValue),
      changeLabel: '%',
      subtitle: 'TOTRESNS — weekly',
      color: '#00d4aa',
      icon: <Activity size={14} />,
      loading: reserves.loading,
    },
    {
      label: 'M2 Money Supply',
      value: m2.lastValue ? `$${(m2.lastValue / 1000).toFixed(1)}T` : null,
      change: pctChange(m2.lastValue, m2.prevValue),
      changeLabel: '%',
      subtitle: 'M2SL — monthly',
      color: '#8b5cf6',
      icon: <Zap size={14} />,
      loading: m2.loading,
    },
    {
      label: 'US 10Y Yield',
      value: fmt(us10y.lastValue, '%'),
      change: us10y.lastValue && us10y.prevValue ? us10y.lastValue - us10y.prevValue : null,
      changeLabel: ' bps',
      subtitle: 'DGS10 — daily',
      color: '#ef4444',
      icon: <TrendingUp size={14} />,
      loading: us10y.loading,
    },
    {
      label: 'SOFR',
      value: fmt(sofr.lastValue, '%'),
      change: sofr.lastValue && sofr.prevValue ? sofr.lastValue - sofr.prevValue : null,
      changeLabel: ' bps',
      subtitle: 'Secured Overnight Rate',
      color: '#22c55e',
      icon: <TrendingDown size={14} />,
      loading: sofr.loading,
    },
  ]

  return (
    <div className="section-enter flex flex-col gap-6">
      {/* Ticker Tape */}
      <div className="bg-bg-card border border-bg-border rounded-xl overflow-hidden">
        <TickerTape symbols={TICKER_SYMBOLS} />
      </div>

      {/* KPI Cards */}
      {fredApiKey ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {cards.map((c) => (
            <MetricCard key={c.label} {...c} />
          ))}
        </div>
      ) : (
        <div className="bg-bg-card border border-bg-border rounded-xl p-5 text-center">
          <p className="text-text-secondary text-sm">
            Add your{' '}
            <span className="text-accent-teal">free FRED API key</span>{' '}
            in Settings ⚙ to unlock macro data cards and charts
          </p>
        </div>
      )}

      {/* Liquidity proxy chart */}
      {fredApiKey ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Fed Balance Sheet"
            subtitle="Total Assets (WALCL)"
            height={280}
            badge="FRED"
            note="Denominator switching applies to FRED charts"
          >
            {fedBs.data.length > 0 ? (
              <MacroChart
                data={fedBs.data}
                label="Fed BS"
                color="#3b82f6"
                unit="B"
                denominate
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                {fedBs.loading ? 'Loading...' : 'No data'}
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Fed Reserves + TGA + M2"
            subtitle="Key USD liquidity gauges"
            height={280}
            badge="FRED"
          >
            {m2.data.length > 0 ? (
              <MacroChart
                data={m2.data}
                label="M2 ($B)"
                color="#8b5cf6"
                unit="B"
                denominate
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                {m2.loading ? 'Loading...' : 'No data'}
              </div>
            )}
          </ChartCard>
        </div>
      ) : (
        <NoApiKeyCard />
      )}

      {/* Monetary system context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: 'Petrodollar System',
            desc: 'Oil sold in USD → surplus recycled into US Treasuries → sustains US deficit spending and dollar hegemony (Triffin dilemma).',
            status: 'Eroding',
            color: '#ef4444',
          },
          {
            title: 'Gold / BIS Settlement',
            desc: 'China & BRICS accumulating gold reserves. BIS includes gold as Tier 1 capital. Central bank gold buying at record highs.',
            status: 'Rising',
            color: '#f59e0b',
          },
          {
            title: 'Bitcoin Reserve Asset',
            desc: 'US Strategic Bitcoin Reserve executive order. Nation-state adoption. Potential backing for digital dollar or debt restructuring.',
            status: 'Emerging',
            color: '#00d4aa',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-bg-card border border-bg-border rounded-xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-primary">{item.title}</h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-mono"
                style={{ background: `${item.color}20`, color: item.color }}
              >
                {item.status}
              </span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
