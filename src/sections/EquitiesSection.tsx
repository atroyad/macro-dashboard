import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { useYahoo } from '../hooks/useYahoo'
import { useYahooHistory } from '../hooks/useYahooHistory'
import { TradingViewChart } from '../components/charts/TradingViewChart'
import { ChartCard, NoApiKeyCard } from '../components/cards/MetricCard'
import { MacroChart } from '../components/charts/MacroChart'
import { GaugeChart, deltaColor as getDeltaColor } from '../components/charts/GaugeChart'
import { GaugeCard } from '../components/charts/GaugeCard'

// US index ETFs — always free in TradingView embeds (NYSE/NASDAQ/AMEX listed)
// CME E-mini futures (ES1!, NQ1!, RTY1!, YM1!) and index feeds (SP:SPX) require
// exchange data subscriptions for embedded charts — ETFs are the free alternative.
const equityCharts = [
  { symbol: 'AMEX:SPY',    title: 'S&P 500 — SPY ETF',         subtitle: 'iShares S&P 500 — largest equity ETF', interval: 'W' },
  { symbol: 'NASDAQ:QQQ',  title: 'NASDAQ 100 — QQQ ETF',       subtitle: 'Invesco QQQ — tech / growth proxy', interval: 'W' },
  { symbol: 'AMEX:IWM',    title: 'Russell 2000 — IWM ETF',     subtitle: 'iShares Russell 2000 — US small cap', interval: 'W' },
  { symbol: 'AMEX:DIA',    title: 'Dow Jones — DIA ETF',        subtitle: 'SPDR DJIA — 30 blue-chip industrials', interval: 'W' },
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
  { symbol: 'AMEX:EWJ',  title: 'Nikkei proxy — EWJ (iShares MSCI Japan)', subtitle: 'USD-denominated ETF — BoJ/JPY dynamics', interval: 'W' },
]

export function EquitiesSection() {
  const { fredApiKey } = useApp()

  // VIX from FRED (CBOE VIX embed requires subscription)
  const vix      = useFRED('VIXCLS',       fredApiKey, { frequency: 'd', observationStart: '2005-01-01' })
  // Credit spreads
  const hySpread = useFRED('BAMLH0A0HYM2', fredApiKey, { frequency: 'd', observationStart: '2010-01-01' })
  // Commercial bank loans (billions)
  const bankLoans = useFRED('TOTLL',       fredApiKey, { frequency: 'w', observationStart: '2010-01-01' })
  // Buffett Indicator (Gromen)
  const mktcap  = useFRED('NCBCEL', fredApiKey, { frequency: 'q', observationStart: '2000-01-01' })
  const fedDebt = useFRED('GFDEBTN', fredApiKey, { frequency: 'q', observationStart: '2000-01-01' })
  const gdp     = useFRED('GDP',    fredApiKey, { frequency: 'q', observationStart: '2000-01-01' })
  // Yahoo indices for ATH gauges
  const spx  = useYahoo('^GSPC')
  const ndx  = useYahoo('^NDX')
  const rut  = useYahoo('^RUT')
  const spxH = useYahooHistory('^GSPC', '5y')
  const ndxH = useYahooHistory('^NDX',  '5y')
  const rutH = useYahooHistory('^RUT',  '5y')

  const lastVix = vix.lastValue

  // Gromen Buffett: (mktcap $M − fedDebt $M) / 1000 / gdp $B × 100
  const { gromenV, gromenP } = useMemo(() => ({
    gromenV: mktcap.lastValue !== null && fedDebt.lastValue !== null && gdp.lastValue !== null
      ? ((mktcap.lastValue - fedDebt.lastValue) / 1000 / gdp.lastValue) * 100 : null,
    gromenP: mktcap.prevValue !== null && fedDebt.prevValue !== null && gdp.prevValue !== null
      ? ((mktcap.prevValue - fedDebt.prevValue) / 1000 / gdp.prevValue) * 100 : null,
  }), [mktcap.lastValue, mktcap.prevValue, fedDebt.lastValue, fedDebt.prevValue, gdp.lastValue, gdp.prevValue])

  // % from ATH
  const spxPct     = spx.value !== null && spxH.ath !== null ? (spx.value / spxH.ath - 1) * 100 : null
  const spxPrevPct = spx.prev  !== null && spxH.ath !== null ? (spx.prev  / spxH.ath - 1) * 100 : null
  const ndxPct     = ndx.value !== null && ndxH.ath !== null ? (ndx.value / ndxH.ath - 1) * 100 : null
  const rutPct     = rut.value !== null && rutH.ath !== null ? (rut.value / rutH.ath - 1) * 100 : null

  return (
    <div className="section-enter flex flex-col gap-6">

      {/* ── Gauge summary ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10.5px] text-text-muted leading-relaxed mb-3">
          Equity gauges — green = favorable conditions, red = stress / overvaluation.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

          {/* VIX */}
          {(() => {
            const delta = vix.lastValue !== null && vix.prevValue !== null ? vix.lastValue - vix.prevValue : null
            return (
              <GaugeCard
                title="Equity Volatility — VIX"
                subtitle="CBOE VIX. >14=caution; >28=fear; >40=panic"
                source="FRED VIXCLS"
                delta={delta} deltaColor={getDeltaColor(delta, true)}
                formatDelta={(d) => `${Math.abs(d).toFixed(2)}`}
              >
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
              <GaugeCard
                title="Buffett Indicator (Gromen)"
                subtitle="(US mktcap − federal debt) ÷ GDP. >100%=overvalued"
                source="FRED NCBCEL, GFDEBTN, GDP"
                delta={delta} deltaColor={getDeltaColor(delta, true)}
                formatDelta={(d) => `${Math.abs(d).toFixed(1)}%`}
              >
                <GaugeChart value={gromenV} min={-50} max={200} greenMax={50} redMin={100}
                  format={(v) => `${v.toFixed(0)}%`}
                  loading={mktcap.loading || fedDebt.loading || gdp.loading}
                  greenLabel="Fair Value" yellowLabel="Elevated" redLabel="Overvalued" />
              </GaugeCard>
            )
          })()}

          {/* Equity % from ATH */}
          {(() => {
            const delta = spxPct !== null && spxPrevPct !== null ? spxPct - spxPrevPct : null
            return (
              <GaugeCard
                title="US Equity — % from ATH"
                subtitle="S&P 500 / Nasdaq 100 / Russell 2000 vs 5-year ATH."
                source="Yahoo ^GSPC ^NDX ^RUT"
                delta={delta} deltaColor={getDeltaColor(delta, false)}
                formatDelta={(d) => `SPX ${Math.abs(d).toFixed(2)}%`}
              >
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

        </div>
      </div>

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
          US Indices — ETF Proxies (free embed)
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
          DAX via XETR is free. Nikkei via EWJ (iShares MSCI Japan) — CME NKD1! futures require subscription for embeds.
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
