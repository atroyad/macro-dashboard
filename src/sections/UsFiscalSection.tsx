import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { ChartCard, MetricCard, NoApiKeyCard } from '../components/cards/MetricCard'
import { MacroChart } from '../components/charts/MacroChart'
import { GaugeChart, deltaColor as getDeltaColor } from '../components/charts/GaugeChart'
import { AlertTriangle } from 'lucide-react'

const START = '2000-01-01'
const TRADE_START = '1992-01-01'

export function UsFiscalSection() {
  const { fredApiKey } = useApp()

  const taxRec    = useFRED('W006RC1Q027SBEA', fredApiKey, { frequency: 'q', observationStart: '2020-01-01' })
  const interestRatio = useFRED('A091RC1Q027SBEA', fredApiKey, { frequency: 'q', observationStart: '2020-01-01' })
  const deficitPct = useFRED('FYFSGDA188S', fredApiKey, { frequency: 'a', observationStart: '2000-01-01' })

  const fedDebt = useFRED('GFDEBTN', fredApiKey, { frequency: 'q', observationStart: '1960-01-01' })
  const debtGdp = useFRED('GFDEGDQ188S', fredApiKey, { frequency: 'q', observationStart: '1960-01-01' })
  const interestExp = useFRED('A091RC1Q027SBEA', fredApiKey, { frequency: 'q', observationStart: START })
  const deficitGdp = useFRED('FYFSGDA188S', fredApiKey, { frequency: 'a', observationStart: '1970-01-01' })
  const tga = useFRED('WTREGEN', fredApiKey, { frequency: 'w', observationStart: '2015-01-01' })
  const fedBs = useFRED('WALCL', fredApiKey, { frequency: 'w', observationStart: '2015-01-01' })
  // Trade balance & foreign holdings
  const tradeBal   = useFRED('BOPGSTB',  fredApiKey, { frequency: 'm', observationStart: TRADE_START })
  const foreignUST = useFRED('FDHBPIN',  fredApiKey, { frequency: 'm', observationStart: TRADE_START })

  // A091RC1Q027SBEA: Government interest payments, Billions USD, SAAR (annual rate)
  // Divide by 1000 to convert $B → $T
  const interestGdp = useMemo(() => {
    if (!interestExp.data.length) return []
    return interestExp.data.map((d) => ({
      date: d.date,
      value: d.value / 1000, // $B SAAR → $T
    }))
  }, [interestExp.data])

  const intExpRatioV = interestRatio.lastValue !== null && taxRec.lastValue !== null && taxRec.lastValue > 0
    ? (interestRatio.lastValue / taxRec.lastValue) * 100 : null
  const intExpRatioP = interestRatio.prevValue !== null && taxRec.prevValue !== null && taxRec.prevValue > 0
    ? (interestRatio.prevValue / taxRec.prevValue) * 100 : null
  const deficitV = deficitPct.lastValue !== null ? -deficitPct.lastValue : null
  const deficitP = deficitPct.prevValue !== null ? -deficitPct.prevValue : null

  const lastDebt = fedDebt.lastValue
  const lastDebtGdp = debtGdp.lastValue

  return (
    <div className="section-enter flex flex-col gap-6">
      {/* Fiscal Gauges */}
      {fredApiKey && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* US Debt / GDP */}
          <div className="bg-bg-card border border-bg-border rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-start justify-between gap-1 min-h-[2.2rem]">
              <p className="text-[11px] font-semibold text-text-primary leading-tight">US Debt / GDP</p>
              {debtGdp.lastValue !== null && debtGdp.prevValue !== null && (
                <span className="text-[11px] font-mono whitespace-nowrap shrink-0 leading-tight"
                  style={{ color: getDeltaColor(debtGdp.lastValue - debtGdp.prevValue, true) }}>
                  ({(debtGdp.lastValue - debtGdp.prevValue) >= 0 ? '+' : ''}{Math.abs(debtGdp.lastValue - debtGdp.prevValue).toFixed(1)}%)
                </span>
              )}
            </div>
            <GaugeChart value={debtGdp.lastValue} min={0} max={200} greenMax={40} redMin={100}
              format={(v) => `${v.toFixed(0)}%`} loading={debtGdp.loading}
              greenLabel="Healthy" yellowLabel="Elevated" redLabel="Crisis" />
            <p className="text-[9.5px] text-text-muted">Federal debt as % of GDP</p>
          </div>

          {/* Interest / Tax Receipts */}
          <div className="bg-bg-card border border-bg-border rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-start justify-between gap-1 min-h-[2.2rem]">
              <p className="text-[11px] font-semibold text-text-primary leading-tight">Interest / Tax Receipts</p>
              {intExpRatioV !== null && intExpRatioP !== null && (
                <span className="text-[11px] font-mono whitespace-nowrap shrink-0 leading-tight"
                  style={{ color: getDeltaColor(intExpRatioV - intExpRatioP, true) }}>
                  ({(intExpRatioV - intExpRatioP) >= 0 ? '+' : ''}{Math.abs(intExpRatioV - intExpRatioP).toFixed(1)}%)
                </span>
              )}
            </div>
            <GaugeChart value={intExpRatioV} min={0} max={60} greenMax={15} redMin={25}
              format={(v) => `${v.toFixed(1)}%`}
              loading={interestRatio.loading || taxRec.loading}
              greenLabel="Healthy" yellowLabel="Elevated" redLabel="Unsustainable" />
            <p className="text-[9.5px] text-text-muted">Interest payments as % of federal revenue (~33% now)</p>
          </div>

          {/* Deficit / GDP */}
          <div className="bg-bg-card border border-bg-border rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-start justify-between gap-1 min-h-[2.2rem]">
              <p className="text-[11px] font-semibold text-text-primary leading-tight">Deficit / GDP</p>
              {deficitV !== null && deficitP !== null && (
                <span className="text-[11px] font-mono whitespace-nowrap shrink-0 leading-tight"
                  style={{ color: getDeltaColor(deficitV - deficitP, true) }}>
                  ({(deficitV - deficitP) >= 0 ? '+' : ''}{Math.abs(deficitV - deficitP).toFixed(1)}%)
                </span>
              )}
            </div>
            <GaugeChart value={deficitV} min={0} max={20} greenMax={3} redMin={5}
              format={(v) => `${v.toFixed(1)}%`} loading={deficitPct.loading}
              greenLabel="Contained" yellowLabel="Expansionary" redLabel="Dominance" />
            <p className="text-[9.5px] text-text-muted">Annual federal deficit as % of GDP</p>
          </div>

          {/* TGA Balance */}
          <div className="bg-bg-card border border-bg-border rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-start justify-between gap-1 min-h-[2.2rem]">
              <p className="text-[11px] font-semibold text-text-primary leading-tight">TGA Balance</p>
            </div>
            <GaugeChart value={tga.lastValue ? tga.lastValue / 1000 : null} min={0} max={1000} greenMax={500} redMin={100}
              format={(v) => `$${v.toFixed(0)}B`} loading={tga.loading}
              greenLabel="Ample" yellowLabel="Low" redLabel="Depleted" />
            <p className="text-[9.5px] text-text-muted">Treasury General Account — fiscal buffer</p>
          </div>
        </div>
      )}

      {/* Warning banner */}
      <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle size={18} className="text-accent-red shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-accent-red font-medium">US Fiscal Trajectory</p>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            US federal debt exceeds $36T (~123% GDP). Annual interest expense approaches $1T — the
            fastest-growing budget line item, surpassing defense spending. At current trajectory,
            interest alone will consume ~25% of federal revenue by 2030 (CBO). This is the
            structural backdrop for Gromen's "fiscal dominance" thesis: the Fed must ultimately
            monetize debt to prevent a fiscal crisis.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      {fredApiKey ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Total Federal Debt"
            value={lastDebt ? `$${(lastDebt / 1e6).toFixed(1)}T` : null}
            subtitle="GFDEBTN — quarterly"
            color="#ef4444"
            loading={fedDebt.loading}
          />
          <MetricCard
            label="Debt / GDP"
            value={lastDebtGdp ? `${lastDebtGdp.toFixed(1)}%` : null}
            subtitle="GFDEGDQ188S"
            color={lastDebtGdp && lastDebtGdp > 100 ? '#ef4444' : '#f59e0b'}
            loading={debtGdp.loading}
          />
          <MetricCard
            label="Annual Interest (est.)"
            value={interestGdp.length ? `$${(interestGdp[interestGdp.length - 1].value).toFixed(2)}T` : null}
            subtitle="Annualized — fastest growing"
            color="#ef4444"
            loading={interestExp.loading}
          />
          <MetricCard
            label="TGA Balance"
            value={tga.lastValue ? `$${(tga.lastValue / 1000).toFixed(0)}B` : null}
            subtitle="WTREGEN — fiscal buffer"
            color="#f59e0b"
            loading={tga.loading}
          />
        </div>
      ) : (
        <NoApiKeyCard />
      )}

      {fredApiKey && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="US Federal Debt"
              subtitle="Total public debt ($B) — since 1960"
              height={320}
              badge="FRED"
              note="Exponential acceleration post-2008. Denominator switching shows debt in gold/BTC terms."
            >
              {fedDebt.data.length > 0 ? (
                <MacroChart
                  data={fedDebt.data.map((d) => ({ date: d.date, value: d.value / 1e6 }))}
                  label="Debt ($T)"
                  color="#ef4444"
                  unit="T"
                  denominate
                />
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading…</div>
              )}
            </ChartCard>

            <ChartCard
              title="Federal Debt as % of GDP"
              subtitle="Debt sustainability metric"
              height={320}
              badge="FRED"
              note="WWII peak ~108%. Current: ~123% and rising."
            >
              {debtGdp.data.length > 0 ? (
                <MacroChart
                  data={debtGdp.data}
                  label="Debt/GDP"
                  color="#f59e0b"
                  unit="%"
                  type="area"
                  refLine={100}
                  refLabel="100%"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading…</div>
              )}
            </ChartCard>

            <ChartCard
              title="Federal Interest Expense (Annualized)"
              subtitle="Net interest payments — now #1 growth budget item"
              height={320}
              badge="FRED"
            >
              {interestGdp.length > 0 ? (
                <MacroChart data={interestGdp} label="Interest ($T/yr)" color="#ef4444" unit="T" type="area" />
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading…</div>
              )}
            </ChartCard>

            <ChartCard
              title="Federal Deficit as % of GDP"
              subtitle="Annual fiscal deficit — peacetime record deficits"
              height={320}
              badge="FRED"
              note="Deficit > 5% GDP in non-recession = fiscal dominance. Gromen: this forces eventual monetization."
            >
              {deficitGdp.data.length > 0 ? (
                <MacroChart
                  data={deficitGdp.data}
                  label="Deficit/GDP"
                  color="#8b5cf6"
                  unit="%"
                  type="line"
                  refLine={0}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading…</div>
              )}
            </ChartCard>
          </div>

          {/* TGA & Treasury Buybacks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="Treasury General Account (TGA)"
              subtitle="Fed's cash account — drawdown = liquidity injection"
              height={320}
              badge="FRED"
              note="TGA drawdown = fiscal stimulus. Low TGA + debt ceiling = liquidity 'coiled spring'."
            >
              {tga.data.length > 0 ? (
                <MacroChart
                  data={tga.data.map((d) => ({ date: d.date, value: d.value / 1000 }))}
                  label="TGA ($B)"
                  color="#00d4aa"
                  unit="B"
                  type="area"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading…</div>
              )}
            </ChartCard>

            <ChartCard
              title="Fed Balance Sheet (QE Proxy)"
              subtitle="Expansion = QE / money creation; contraction = QT"
              height={320}
              badge="FRED"
            >
              {fedBs.data.length > 0 ? (
                <MacroChart data={fedBs.data.map(d => ({ date: d.date, value: d.value / 1000 }))} label="Fed Assets ($B)" color="#3b82f6" unit="B" denominate />
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading…</div>
              )}
            </ChartCard>
          </div>
        </>
      )}

      {/* Budget breakdown */}
      <div className="bg-bg-card border border-bg-border rounded-xl p-5">
        <h4 className="text-sm font-semibold text-text-primary mb-3">
          US Federal Budget — Key Line Items (FY 2024 est.)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Mandatory Spending</p>
            {[
              { item: 'Social Security', amount: '$1.35T', pct: '21%', color: '#3b82f6' },
              { item: 'Medicare + Medicaid', amount: '$1.65T', pct: '26%', color: '#8b5cf6' },
              { item: 'Other Mandatory', amount: '$0.65T', pct: '10%', color: '#475569' },
            ].map((r) => (
              <div key={r.item} className="flex items-center gap-2">
                <div className="w-1 h-4 rounded" style={{ background: r.color }} />
                <span className="text-xs text-text-secondary flex-1">{r.item}</span>
                <span className="text-xs font-mono text-text-primary">{r.amount}</span>
                <span className="text-xs text-text-muted">{r.pct}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Discretionary</p>
            {[
              { item: 'Defense', amount: '$0.89T', pct: '14%', color: '#ef4444' },
              { item: 'Net Interest', amount: '$0.95T', pct: '15%', color: '#f59e0b' },
              { item: 'Non-Defense Disc.', amount: '$0.87T', pct: '14%', color: '#22c55e' },
            ].map((r) => (
              <div key={r.item} className="flex items-center gap-2">
                <div className="w-1 h-4 rounded" style={{ background: r.color }} />
                <span className="text-xs text-text-secondary flex-1">{r.item}</span>
                <span className="text-xs font-mono text-text-primary">{r.amount}</span>
                <span className="text-xs text-text-muted">{r.pct}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-bg-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Total Outlays</span>
            <span className="font-mono text-text-primary">~$6.4T</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-text-secondary">Total Revenue</span>
            <span className="font-mono text-text-primary">~$4.9T</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-accent-red">Deficit</span>
            <span className="font-mono text-accent-red">~$1.5T (~5.5% GDP)</span>
          </div>
        </div>
      </div>

      {/* ── Trade Balance & Foreign Holdings ────────────────────────────────── */}
      {fredApiKey && (
        <>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-px flex-1 bg-bg-border" />
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
              Trade Balance &amp; External Demand for Treasuries
            </span>
            <div className="h-px flex-1 bg-bg-border" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="US Goods Trade Balance (BOPGSTB)"
              subtitle="Monthly goods imports minus exports, $M. Negative = deficit. Services not included."
              height={320}
              badge="FRED"
              note="US runs ~$90B/month goods deficit. Services surplus ~$22B/month partially offsets. Net current account ~-3.5% GDP."
            >
              {tradeBal.data.length > 0 ? (
                <MacroChart
                  data={tradeBal.data.map(d => ({ date: d.date, value: d.value / 1000 }))}
                  label="Trade Balance ($B)"
                  color="#ef4444"
                  unit="B"
                  type="area"
                  refLine={0}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">
                  {tradeBal.loading ? 'Loading…' : 'No data'}
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Foreign Holdings of US Treasuries (FDHBPIN)"
              subtitle="Total foreign-held USTs, $B. Declining share = rising domestic/Fed absorption required."
              height={320}
              badge="FRED"
              note="Peak ~$8.5T. Japan ~$1.1T, China ~$760B (down from $1.3T peak in 2013). Decline = structural fragility."
            >
              {foreignUST.data.length > 0 ? (
                <MacroChart
                  data={foreignUST.data.map(d => ({ date: d.date, value: d.value / 1000 }))}
                  label="Foreign UST Holdings ($T)"
                  color="#3b82f6"
                  unit="T"
                  type="area"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">
                  {foreignUST.loading ? 'Loading…' : 'No data'}
                </div>
              )}
            </ChartCard>
          </div>

          {/* Export/Import composition (static reference) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-bg-card border border-bg-border rounded-xl p-4">
              <h4 className="text-sm font-medium text-text-secondary mb-3">
                Top US Exports (~$3.0T/year)
              </h4>
              <div className="space-y-2">
                {[
                  { item: 'Petroleum Products & LNG', pct: '~12%', color: '#f97316' },
                  { item: 'Semiconductors & Electronics', pct: '~9%',  color: '#3b82f6' },
                  { item: 'Civilian Aircraft (Boeing)', pct: '~5%',  color: '#8b5cf6' },
                  { item: 'Pharmaceuticals',           pct: '~5%',  color: '#22c55e' },
                  { item: 'Agricultural (Soy/Corn)',   pct: '~5%',  color: '#f59e0b' },
                  { item: 'Capital Equipment',         pct: '~8%',  color: '#00d4aa' },
                  { item: 'Financial Services (surplus)', pct: '~9%', color: '#a3e635' },
                ].map(r => (
                  <div key={r.item} className="flex items-center gap-2">
                    <div className="w-1 h-3.5 rounded shrink-0" style={{ background: r.color }} />
                    <span className="text-xs text-text-secondary flex-1">{r.item}</span>
                    <span className="text-xs font-mono text-text-muted">{r.pct}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-bg-card border border-bg-border rounded-xl p-4">
              <h4 className="text-sm font-medium text-text-secondary mb-3">
                Top US Imports (~$3.2T goods/year)
              </h4>
              <div className="space-y-2">
                {[
                  { item: 'Consumer Electronics & Phones', pct: '~11%', color: '#ef4444' },
                  { item: 'Vehicles & Parts',              pct: '~10%', color: '#f97316' },
                  { item: 'Pharmaceuticals',               pct: '~8%',  color: '#22c55e' },
                  { item: 'Capital Equipment & Machinery', pct: '~8%',  color: '#3b82f6' },
                  { item: 'Crude Oil (heavy/sour)',         pct: '~6%',  color: '#f59e0b' },
                  { item: 'Apparel & Textiles',             pct: '~5%',  color: '#8b5cf6' },
                  { item: 'Steel, Aluminum, Metals',        pct: '~4%',  color: '#94a3b8' },
                ].map(r => (
                  <div key={r.item} className="flex items-center gap-2">
                    <div className="w-1 h-3.5 rounded shrink-0" style={{ background: r.color }} />
                    <span className="text-xs text-text-secondary flex-1">{r.item}</span>
                    <span className="text-xs font-mono text-text-muted">{r.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Stablecoins demand for T-bills */}
      <div className="bg-bg-card border border-accent-teal/20 rounded-xl p-4">
        <h4 className="text-sm font-medium text-text-secondary mb-2">
          Stablecoin Issuers as T-Bill Buyers — New Treasury Demand Base
        </h4>
        <p className="text-xs text-text-muted leading-relaxed mb-3">
          Tether (USDT) and Circle (USDC) collectively hold ~$100B+ in short-duration US
          Treasuries as backing. Combined stablecoin market cap ~$160B creates structural
          T-bill demand. The GENIUS Act (proposed US stablecoin legislation) would formalize
          this, requiring 1:1 backing with T-bills — potentially adding $500B+ in new T-bill
          demand as stablecoins grow. This supports the short end of the curve (favoring
          Treasury's preference for short-duration issuance).
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: 'USDT (Tether)', cap: '~$112B', backing: '~90% US T-bills', color: '#22c55e' },
            { name: 'USDC (Circle)', cap: '~$45B', backing: '~100% US T-bills', color: '#3b82f6' },
            { name: 'USAT / Others', cap: 'Growing', backing: 'Varies', color: '#8b5cf6' },
          ].map((s) => (
            <div key={s.name} className="bg-bg-elevated rounded-lg p-3">
              <p className="text-xs font-medium" style={{ color: s.color }}>{s.name}</p>
              <p className="text-sm font-mono text-text-primary mt-1">{s.cap}</p>
              <p className="text-xs text-text-muted mt-0.5">{s.backing}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
