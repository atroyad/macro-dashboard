import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { TradingViewChart } from '../components/charts/TradingViewChart'
import { ChartCard, NoApiKeyCard } from '../components/cards/MetricCard'
import { MacroChart } from '../components/charts/MacroChart'

const equityCharts = [
  { symbol: 'FOREXCOM:SPXUSD', title: 'S&P 500', subtitle: 'Large cap US equities', interval: 'W' },
  { symbol: 'NASDAQ:NDX', title: 'NASDAQ 100', subtitle: 'Tech-heavy large cap growth', interval: 'W' },
  { symbol: 'TVC:RUT', title: 'Russell 2000', subtitle: 'US small cap — domestic cycle proxy', interval: 'W' },
  { symbol: 'DJ:DJI', title: 'Dow Jones Industrial', subtitle: 'Blue chip industrial bellwether', interval: 'W' },
]

const euCharts = [
  { symbol: 'XETR:DAX', title: 'DAX (Germany)', subtitle: 'Export-heavy industrials + financials', interval: 'W' },
  { symbol: 'EURONEXT:CAC40', title: 'CAC 40 (France)', subtitle: 'Luxury goods + energy', interval: 'W' },
  { symbol: 'LSE:UKX', title: 'FTSE 100 (UK)', subtitle: 'Resources + financials heavy', interval: 'W' },
  { symbol: 'INDEX:NKY', title: 'Nikkei 225 (Japan)', subtitle: 'JPY-hedged risk; BoJ policy proxy', interval: 'W' },
]

const sectorCharts = [
  { symbol: 'AMEX:XLE', title: 'Energy Sector (XLE)', subtitle: 'Oil & gas majors', interval: 'W' },
  { symbol: 'AMEX:XLF', title: 'Financials (XLF)', subtitle: 'Banks & insurers — credit cycle', interval: 'W' },
  { symbol: 'AMEX:XLI', title: 'Industrials (XLI)', subtitle: 'Cyclical barometer', interval: 'W' },
  { symbol: 'AMEX:XLU', title: 'Utilities (XLU)', subtitle: 'Defensive / rate-sensitive', interval: 'W' },
  { symbol: 'AMEX:XLK', title: 'Technology (XLK)', subtitle: 'AI + semiconductors', interval: 'W' },
  { symbol: 'AMEX:GDX', title: 'Gold Miners (GDX)', subtitle: 'Leveraged gold play / M&A activity', interval: 'W' },
]

export function EquitiesSection() {
  const { fredApiKey } = useApp()

  // Credit spreads as equity leading indicator
  const hySpread = useFRED('BAMLH0A0HYM2', fredApiKey, { frequency: 'd', observationStart: '2010-01-01' })
  // Commercial bank loans
  const bankLoans = useFRED('TOTLL', fredApiKey, { frequency: 'w', observationStart: '2010-01-01' })

  return (
    <div className="section-enter flex flex-col gap-6">
      {/* VIX — prominent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="VIX — Equity Fear Index"
          subtitle="CBOE Volatility Index: 30-day implied vol of S&P 500 options"
          height={360}
          badge="TradingView"
          badgeColor="#3b82f6"
          note="VIX > 30 = fear; > 40 = panic. Inversely correlated with S&P 500. Spikes signal max pain."
        >
          <TradingViewChart symbol="CBOE:VIX" interval="D" height={300} />
        </ChartCard>

        <ChartCard
          title="MOVE Index — Bond Volatility"
          subtitle="Treasury vol — high MOVE + high VIX = systemic stress"
          height={360}
          badge="TradingView"
          badgeColor="#3b82f6"
        >
          <TradingViewChart symbol="CBOE:MOVE" interval="D" height={300} />
        </ChartCard>
      </div>

      {/* US Equity markets */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">
          US Indices
        </h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {equityCharts.map((c) => (
            <ChartCard
              key={c.symbol}
              title={c.title}
              subtitle={c.subtitle}
              height={380}
              badge="TradingView"
              badgeColor="#3b82f6"
            >
              <TradingViewChart symbol={c.symbol} interval={c.interval} height={320} />
            </ChartCard>
          ))}
        </div>
      </div>

      {/* FRED credit + loan data */}
      {fredApiKey ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="High Yield Credit Spreads"
            subtitle="Widening spreads = risk-off / credit cycle turning"
            height={300}
            badge="FRED"
            note="Credit spreads lead equity declines by 3–6 months historically."
          >
            {hySpread.data.length > 0 ? (
              <MacroChart
                data={hySpread.data}
                label="HY Spread (bps)"
                color="#ef4444"
                unit="%"
                type="area"
                refLine={5}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                Loading…
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Commercial Bank Total Loans & Leases"
            subtitle="Credit creation: rising = expansion; falling = contraction"
            height={300}
            badge="FRED"
            note="Bank credit contraction precedes recessions — Lyn Alden's credit cycle framework."
          >
            {bankLoans.data.length > 0 ? (
              <MacroChart
                data={bankLoans.data.map((d) => ({ date: d.date, value: d.value / 1000 }))}
                label="Bank Loans ($T)"
                color="#3b82f6"
                unit="T"
                type="area"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                Loading…
              </div>
            )}
          </ChartCard>
        </div>
      ) : (
        <NoApiKeyCard />
      )}

      {/* European indices */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">
          European & Asia Indices
        </h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {euCharts.map((c) => (
            <ChartCard
              key={c.symbol}
              title={c.title}
              subtitle={c.subtitle}
              height={380}
              badge="TradingView"
              badgeColor="#3b82f6"
            >
              <TradingViewChart symbol={c.symbol} interval={c.interval} height={320} />
            </ChartCard>
          ))}
        </div>
      </div>

      {/* Sector rotation */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">
          US Sector ETFs — Rotation Tracker
        </h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {sectorCharts.map((c) => (
            <ChartCard
              key={c.symbol}
              title={c.title}
              subtitle={c.subtitle}
              height={360}
              badge="TradingView"
              badgeColor="#3b82f6"
            >
              <TradingViewChart symbol={c.symbol} interval={c.interval} height={300} />
            </ChartCard>
          ))}
        </div>
      </div>

      {/* Cycle context */}
      <div className="bg-bg-card border border-bg-border rounded-xl p-4">
        <h4 className="text-sm font-medium text-text-secondary mb-3">Business Cycle Position</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { phase: 'Early Cycle', chars: 'Credit expanding, rates low, earnings recovering', leaders: 'Financials, Consumer Disc., Industrials', color: '#22c55e' },
            { phase: 'Mid Cycle', chars: 'GDP above trend, profits peak, rates rising', leaders: 'Technology, Energy, Materials', color: '#3b82f6' },
            { phase: 'Late Cycle', chars: 'Inflation high, yield curve flat/inverted', leaders: 'Energy, Materials, Staples', color: '#f59e0b' },
            { phase: 'Recession', chars: 'Credit contracts, unemployment rises, rates fall', leaders: 'Utilities, Healthcare, Staples', color: '#ef4444' },
          ].map((p) => (
            <div key={p.phase} className="bg-bg-elevated rounded-lg p-3">
              <p className="font-medium mb-1.5" style={{ color: p.color }}>{p.phase}</p>
              <p className="text-text-muted mb-1.5 leading-relaxed">{p.chars}</p>
              <p className="text-text-secondary">↑ {p.leaders}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
