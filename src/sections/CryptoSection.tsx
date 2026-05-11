import { TradingViewChart } from '../components/charts/TradingViewChart'
import { ChartCard } from '../components/cards/MetricCard'

const CHART_HEIGHT = 420

export function CryptoSection() {
  return (
    <div className="section-enter flex flex-col gap-6">
      {/* Thesis box */}
      <div className="bg-bg-card border border-accent-orange/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">₿</span>
          <h3 className="text-sm font-semibold text-text-primary">Bitcoin as Reserve Asset Thesis</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-text-muted">
          <div className="space-y-1.5 leading-relaxed">
            <p>→ US Strategic Bitcoin Reserve (Executive Order 2025): no selling, accumulation via budget-neutral methods</p>
            <p>→ Lyn Alden: BTC correlates with global M2 expansion (12–18 month lag)</p>
            <p>→ Michael Saylor: institutional adoption as treasury reserve asset</p>
            <p>→ 4-year halving cycle aligns with liquidity cycles (next halving ~2028)</p>
          </div>
          <div className="space-y-1.5 leading-relaxed">
            <p>→ BTC 30-day implied vol tracks risk appetite (DVOL from Deribit)</p>
            <p>→ BTC/Gold ratio: rising = risk-on / monetary transition accelerating</p>
            <p>→ Hash rate = security + miner confidence indicator</p>
            <p>→ ETF flows (BlackRock IBIT, Fidelity FBTC) = institutional demand</p>
          </div>
        </div>
      </div>

      {/* Main BTC chart */}
      <ChartCard
        title="Bitcoin / USD"
        subtitle="BITSTAMP — weekly, log scale recommended"
        height={CHART_HEIGHT + 50}
        badge="TradingView"
        badgeColor="#f59e0b"
        note="Switch to log scale (right-click → Scale → Logarithmic) for long-term halvings view."
      >
        <TradingViewChart
          symbol="BITSTAMP:BTCUSD"
          interval="W"
          height={CHART_HEIGHT}
          studies={['Volume@tv-basicstudies']}
        />
      </ChartCard>

      {/* BTC/Gold ratio & implied vol */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard
          title="BTC / Gold Ratio"
          subtitle="Monetary transition indicator — rising = BTC gaining vs gold"
          height={CHART_HEIGHT}
          badge="TradingView"
          badgeColor="#f59e0b"
        >
          <TradingViewChart symbol="BITSTAMP:BTCUSD/TVC:GOLD" interval="W" height={CHART_HEIGHT - 60} />
        </ChartCard>

        <ChartCard
          title="Bitcoin Volatility Index (BVOL)"
          subtitle="BitMEX BVOL — 30-day realized volatility index"
          height={CHART_HEIGHT}
          badge="TradingView"
          badgeColor="#f59e0b"
          note="BVOL > 80 = elevated risk / fear. For Deribit DVOL (deeper options data) visit deribit.com/statistics."
        >
          <TradingViewChart symbol="BITMEX:BVOL" interval="D" height={CHART_HEIGHT - 60} />
        </ChartCard>

        <ChartCard
          title="Bitcoin Dominance"
          subtitle="BTC.D — rising = risk-off within crypto; falling = altseason"
          height={CHART_HEIGHT}
          badge="TradingView"
          badgeColor="#f59e0b"
        >
          <TradingViewChart symbol="CRYPTOCAP:BTC.D" interval="W" height={CHART_HEIGHT - 60} />
        </ChartCard>

        <ChartCard
          title="Bitcoin Hash Rate (proxy: MARA / CLSK)"
          subtitle="Mining sector as on-chain security indicator"
          height={CHART_HEIGHT}
          badge="TradingView"
          badgeColor="#f59e0b"
          note="Use BTC.D and on-chain data from Glassnode/CryptoQuant for deeper analysis."
        >
          <TradingViewChart symbol="NASDAQ:MARA" interval="W" height={CHART_HEIGHT - 60} />
        </ChartCard>
      </div>

      {/* ETH and macro crypto */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard
          title="Ethereum / USD"
          subtitle="ETH — DeFi and tokenized asset infrastructure"
          height={CHART_HEIGHT}
          badge="TradingView"
          badgeColor="#8b5cf6"
        >
          <TradingViewChart symbol="COINBASE:ETHUSD" interval="W" height={CHART_HEIGHT - 60} />
        </ChartCard>

        <ChartCard
          title="Total Crypto Market Cap"
          subtitle="TOTAL — global crypto liquidity gauge"
          height={CHART_HEIGHT}
          badge="TradingView"
          badgeColor="#8b5cf6"
        >
          <TradingViewChart symbol="CRYPTOCAP:TOTAL" interval="W" height={CHART_HEIGHT - 60} />
        </ChartCard>
      </div>

      {/* On-chain metrics note */}
      <div className="bg-bg-card border border-bg-border rounded-xl p-4">
        <h4 className="text-sm font-medium text-text-secondary mb-3">
          On-Chain Metrics — Advanced Tracking
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {[
            {
              title: 'Glassnode (glassnode.com)',
              metrics: ['SOPR (Spent Output Profit Ratio)', 'Exchange reserves', 'MVRV Z-Score', 'Long/Short holder cost basis'],
              color: '#f59e0b',
            },
            {
              title: 'CryptoQuant (cryptoquant.com)',
              metrics: ['Exchange netflow', 'Miner reserves', 'Stablecoin supply ratio', 'Funding rates'],
              color: '#3b82f6',
            },
            {
              title: 'Bitcoin Magazine Pro',
              metrics: ['US Strategic Reserve tracking', 'Corporate treasury filings', 'ETF flow data', 'Halving cycle analysis'],
              color: '#00d4aa',
            },
          ].map((s) => (
            <div key={s.title} className="bg-bg-elevated rounded-lg p-3">
              <p className="text-xs font-medium mb-2" style={{ color: s.color }}>{s.title}</p>
              <ul className="space-y-1">
                {s.metrics.map((m) => (
                  <li key={m} className="text-text-muted">→ {m}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
