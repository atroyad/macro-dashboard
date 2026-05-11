import { TradingViewChart } from '../components/charts/TradingViewChart'
import { ChartCard } from '../components/cards/MetricCard'

const CHART_HEIGHT = 380

const fxCharts = [
  { symbol: 'TVC:DXY', title: 'DXY — Dollar Index', subtitle: 'Broad USD strength vs. major currencies', interval: 'W' },
  { symbol: 'FX:EURUSD', title: 'EUR/USD', subtitle: 'Euro — ECB policy divergence', interval: 'W' },
  { symbol: 'FX:USDJPY', title: 'USD/JPY', subtitle: 'Yen — carry trade / BoJ pressure', interval: 'W' },
  { symbol: 'FX:USDCHF', title: 'USD/CHF', subtitle: 'Swiss Franc — safe haven flow', interval: 'W' },
  { symbol: 'FX:USDCNH', title: 'USD/CNH (Offshore)', subtitle: 'Offshore yuan — PBoC devaluation risk', interval: 'W' },
  { symbol: 'FX:GBPUSD', title: 'GBP/USD', subtitle: 'Cable — UK stagflation watch', interval: 'W' },
  { symbol: 'FX:USDBRL', title: 'USD/BRL', subtitle: 'Brazilian Real — EM liquidity signal', interval: 'W' },
  { symbol: 'FX:USDINR', title: 'USD/INR', subtitle: 'Indian Rupee — de-dollarization watch', interval: 'W' },
  { symbol: 'FX:USDKRW', title: 'USD/KRW', subtitle: 'Korean Won — Asia risk-off proxy', interval: 'W' },
  { symbol: 'TVC:GOLD', title: 'Gold / USD (XAU)', subtitle: 'Gold as reserve currency competitor', interval: 'W' },
]

export function CurrenciesSection() {
  return (
    <div className="section-enter flex flex-col gap-6">
      {/* Context */}
      <div className="bg-bg-card border border-bg-border rounded-xl p-4">
        <h4 className="text-sm font-medium text-text-secondary mb-2">
          FX & Monetary System Transition
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-text-muted">
          <div>
            <p className="text-text-secondary font-medium mb-1">Petrodollar Erosion</p>
            <p className="leading-relaxed">
              Saudi Arabia pricing some oil in CNY/EUR. BRICS local currency settlement growing.
              DXY as key metric — sustained decline = accelerating dollar reserve erosion.
            </p>
          </div>
          <div>
            <p className="text-text-secondary font-medium mb-1">JPY Carry Unwind Risk</p>
            <p className="leading-relaxed">
              $4T+ USD/JPY carry trades. BoJ rate hikes force unwind = USD selling, JPY buying,
              global risk-off. Monitor USD/JPY above 160 as extreme stress signal.
            </p>
          </div>
          <div>
            <p className="text-text-secondary font-medium mb-1">CHF Safe Haven</p>
            <p className="leading-relaxed">
              Swiss National Bank: 20%+ gold reserves, negative rates history. CHF strengthens
              during European stress events. SNB FX reserves = geopolitical positioning indicator.
            </p>
          </div>
        </div>
      </div>

      {/* DXY prominently */}
      <ChartCard
        title="DXY — US Dollar Index"
        subtitle="Weighted basket: EUR 57.6%, JPY 13.6%, GBP 11.9%, CAD 9.1%, SEK 4.2%, CHF 3.6%"
        height={420}
        badge="TradingView"
        badgeColor="#3b82f6"
        note="DXY declining = global dollar liquidity tightening easing. Watch for break of key support levels."
      >
        <TradingViewChart symbol="TVC:DXY" interval="W" height={360} />
      </ChartCard>

      {/* FX grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {fxCharts.slice(1).map((c) => (
          <ChartCard
            key={c.symbol}
            title={c.title}
            subtitle={c.subtitle}
            height={CHART_HEIGHT}
            badge="TradingView"
            badgeColor="#3b82f6"
          >
            <TradingViewChart symbol={c.symbol} interval={c.interval} height={CHART_HEIGHT - 60} />
          </ChartCard>
        ))}
      </div>

      {/* BRICS / De-dollarization tracker */}
      <div className="bg-bg-card border border-accent-orange/20 rounded-xl p-4">
        <h4 className="text-sm font-medium text-text-secondary mb-3">
          De-dollarization Scorecard
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              title: 'USD Global Reserve Share',
              value: '~59%',
              trend: '↓ from 73% in 2001',
              color: '#ef4444',
              note: 'Still dominant but structurally declining',
            },
            {
              title: 'BRICS+ Currency Settlements',
              value: 'Growing',
              trend: '↑ CNY share in trade finance',
              color: '#f59e0b',
              note: 'INR-RUB, CNY-SAR direct settlement growing',
            },
            {
              title: 'Central Bank USD Holdings',
              value: '~59%',
              trend: '↓ EUR, CNY, Gold gaining',
              color: '#f59e0b',
              note: 'Gold gaining most share',
            },
            {
              title: 'Oil Priced in USD',
              value: '~80%',
              trend: '↓ CNY pricing agreements',
              color: '#22c55e',
              note: 'Saudi-China CNY oil deals emerging',
            },
          ].map((item) => (
            <div key={item.title} className="bg-bg-elevated rounded-lg p-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-text-secondary">{item.title}</p>
                <span
                  className="text-lg font-mono font-medium"
                  style={{ color: item.color }}
                >
                  {item.value}
                </span>
              </div>
              <p className="text-xs" style={{ color: item.color }}>{item.trend}</p>
              <p className="text-xs text-text-muted">{item.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
