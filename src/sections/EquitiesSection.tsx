import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { TradingViewChart } from '../components/charts/TradingViewChart'
import { ChartCard, NoApiKeyCard } from '../components/cards/MetricCard'
import { MacroChart } from '../components/charts/MacroChart'

// E-mini futures are universally free on TradingView (CME data)
// Using these instead of index feeds which require exchange data subscriptions
const equityCharts = [
  { symbol: 'CME_MINI:ES1!',  title: 'S&P 500 (E-mini futures)',    subtitle: 'CME ES1! — free, real-time proxy', interval: 'W' },
  { symbol: 'CME_MINI:NQ1!',  title: 'NASDAQ 100 (E-mini futures)', subtitle: 'CME NQ1! — free, real-time proxy', interval: 'W' },
  { symbol: 'CME_MINI:RTY1!', title: 'Russell 2000 (E-mini futures)', subtitle: 'CME RTY1! — US small cap', interval: 'W' },
  { symbol: 'CME_MINI:YM1!',  title: 'Dow Jones (E-mini futures)',   subtitle: 'CME YM1! — blue chip industrial', interval: 'W' },
]

const sectorCharts = [
  { symbol: 'AMEX:XLE', title: 'Energy Sector (XLE)',    subtitle: 'Oil & gas majors', interval: 'W' },
  { symbol: 'AMEX:XLF', title: 'Financials (XLF)',       subtitle: 'Banks & insurers — credit cycle', interval: 'W' },
  { symbol: 'AMEX:XLI', title: 'Industrials (XLI)',      subtitle: 'Cyclical barometer', interval: 'W' },
  { symbol: 'AMEX:XLU', title: 'Utilities (XLU)',        subtitle: 'Defensive / rate-sensitive', interval: 'W' },
  { symbol: 'AMEX:XLK', title: 'Technology (XLK)',       subtitle: 'AI + semiconductors', interval: 'W' },
  { symbol: 'AMEX:GDX', title: 'Gold Miners (GDX)',      subtitle: 'Leveraged gold / M&A signal', interval: 'W' },
]

// iShares ETFs — always free on AMEX, USD-denominated
const intlCharts = [
  { symbol: 'XETR:DAX',  title: 'DAX (Germany)',   subtitle: 'Industrials + financials', interval: 'W' },
  { symbol: 'AMEX:EWQ',  title: 'CAC 40 proxy (EWQ — iShares MSCI France)', subtitle: 'USD-denominated ETF', interval: 'W' },
  { symbol: 'AMEX:EWU',  title: 'FTSE 100 proxy (EWU — iShares MSCI UK)',   subtitle: 'USD-denominated ETF', interval: 'W' },
  { symbol: 'CME:NKD1!', title: 'Nikkei 225 (CME NKD futures)',             subtitle: 'Yen-denominated index via CME', interval: 'W' },
]

export function EquitiesSection() {
  const { fredApiKey } = useApp()

  // VIX from FRED (CBOE VIX embed requires subscription)
  const vix      = useFRED('VIXCLS',       fredApiKey, { frequency: 'd', observationStart: '2005-01-01' })
  // Credit spreads
  const hySpread = useFRED('BAMLH0A0HYM2', fredApiKey, { frequency: 'd', observationStart: '2010-01-01' })
  // Commercial bank loans (billions)
  const bankLoans = useFRED('TOTLL',       fredApiKey, { frequency: 'w', observationStart: '2010-01-01' })

  const lastVix = vix.lastValue

  return (
    <div className="section-enter flex flex-col gap-6">
      {/* VIX (FRED) + MOVE context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {fredApiKey ? (
          <ChartCard
            title="VIX — Equity Fear Index (FRED: VIXCLS)"
            subtitle="CBOE Volatility Index, daily since 1990"
            height={360}
            badge="FRED"
            note="VIX > 30 = fear; > 40 = panic. CBOE embed requires subscription — using FRED feed."
          >
            {vix.data.length > 0 ? (
              <MacroChart
                data={vix.data}
                label="VIX"
                color="#ef4444"
                unit="%"
                type="area"
                refLine={30}
                refLabel="30"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                {vix.loading ? 'Loading…' : 'No data'}
              </div>
            )}
          </ChartCard>
        ) : (
          <NoApiKeyCard />
        )}

        {/* MOVE — no free embed */}
        <div className="bg-bg-card border border-accent-purple/30 rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-accent-purple text-lg">📊</span>
            <h3 className="text-sm font-semibold text-text-primary">MOVE Index — Treasury Volatility</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple font-mono ml-auto">
              ICE Subscription
            </span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            The ICE BofA MOVE Index (bond market's VIX equivalent) requires a Bloomberg or ICE
            data subscription. Cannot be freely embedded.
          </p>
          {fredApiKey && lastVix !== null && (
            <div className="bg-bg-elevated rounded-lg p-3">
              <p className="text-xs text-text-muted">Current VIX as cross-asset vol proxy</p>
              <p
                className="text-2xl font-mono font-semibold mt-1"
                style={{ color: lastVix > 40 ? '#ef4444' : lastVix > 30 ? '#f59e0b' : '#22c55e' }}
              >
                {lastVix.toFixed(1)}
              </p>
              <p className="text-xs mt-1" style={{ color: lastVix > 40 ? '#ef4444' : lastVix > 30 ? '#f59e0b' : '#22c55e' }}>
                {lastVix > 40 ? 'Panic — extreme stress' : lastVix > 30 ? 'Fear — elevated' : lastVix > 20 ? 'Caution' : 'Complacency zone'}
              </p>
            </div>
          )}
          <p className="text-xs text-text-muted">
            MOVE data via{' '}
            <a href="https://fred.stlouisfed.org" target="_blank" rel="noreferrer" className="text-accent-teal hover:underline">FRED (BAMLMOVE)</a>
            {' '}or{' '}
            <a href="https://www.ice.com" target="_blank" rel="noreferrer" className="text-accent-teal hover:underline">ice.com</a>
          </p>
        </div>
      </div>

      {/* US Indices — CME futures (universally free) */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">
          US Indices — CME E-mini Futures (free)
        </h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {equityCharts.map(c => (
            <ChartCard key={c.symbol} title={c.title} subtitle={c.subtitle} height={380} badge="TradingView" badgeColor="#3b82f6">
              <TradingViewChart symbol={c.symbol} interval={c.interval} height={320} />
            </ChartCard>
          ))}
        </div>
      </div>

      {/* FRED: credit spreads + bank loans */}
      {fredApiKey ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="High Yield Credit Spreads (BAMLH0A0HYM2)"
            subtitle="Widening = risk-off / credit cycle turning"
            height={300}
            badge="FRED"
            note="HY spreads lead equity declines by 3–6 months historically."
          >
            {hySpread.data.length > 0 ? (
              <MacroChart data={hySpread.data} label="HY OAS (bps)" color="#ef4444" unit="%" type="area" refLine={5} />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                {hySpread.loading ? 'Loading…' : 'No data'}
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Commercial Bank Loans & Leases (TOTLL)"
            subtitle="Bank credit in $B — rising = expansion, falling = contraction"
            height={300}
            badge="FRED"
            note="Credit contraction precedes recessions (Lyn Alden credit cycle framework)."
          >
            {bankLoans.data.length > 0 ? (
              <MacroChart
                data={bankLoans.data.map(d => ({ date: d.date, value: d.value / 1000 }))}
                label="Bank Loans ($T)"
                color="#3b82f6"
                unit="T"
                type="area"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                {bankLoans.loading ? 'Loading…' : 'No data'}
              </div>
            )}
          </ChartCard>
        </div>
      ) : (
        <NoApiKeyCard />
      )}

      {/* EU / International indices */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">
          International Indices
        </h3>
        <p className="text-xs text-text-muted mb-3">
          Note: CAC 40 and FTSE 100 exchange feeds require subscriptions — using iShares USD-denominated ETF proxies (EWQ, EWU).
          DAX via XETR and Nikkei via CME futures are free.
        </p>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {intlCharts.map(c => (
            <ChartCard key={c.symbol} title={c.title} subtitle={c.subtitle} height={380} badge="TradingView" badgeColor="#3b82f6">
              <TradingViewChart symbol={c.symbol} interval={c.interval} height={320} />
            </ChartCard>
          ))}
        </div>
      </div>

      {/* Sector ETFs */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">
          US Sector ETFs — Rotation Tracker
        </h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {sectorCharts.map(c => (
            <ChartCard key={c.symbol} title={c.title} subtitle={c.subtitle} height={360} badge="TradingView" badgeColor="#3b82f6">
              <TradingViewChart symbol={c.symbol} interval={c.interval} height={300} />
            </ChartCard>
          ))}
        </div>
      </div>

      {/* Business cycle */}
      <div className="bg-bg-card border border-bg-border rounded-xl p-4">
        <h4 className="text-sm font-medium text-text-secondary mb-3">Business Cycle Position</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { phase: 'Early Cycle',  chars: 'Credit expanding, rates low, earnings recovering', leaders: 'Financials, Consumer Disc., Industrials', color: '#22c55e' },
            { phase: 'Mid Cycle',    chars: 'GDP above trend, profits peak, rates rising',       leaders: 'Technology, Energy, Materials',           color: '#3b82f6' },
            { phase: 'Late Cycle',   chars: 'Inflation high, yield curve flat/inverted',         leaders: 'Energy, Materials, Staples',              color: '#f59e0b' },
            { phase: 'Recession',    chars: 'Credit contracts, unemployment rises, rates fall',  leaders: 'Utilities, Healthcare, Staples',          color: '#ef4444' },
          ].map(p => (
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
