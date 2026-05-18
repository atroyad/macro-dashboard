import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { ChartCard, NoApiKeyCard } from '../components/cards/MetricCard'
import { MacroChart } from '../components/charts/MacroChart'
import { GaugeChart, deltaColor as getDeltaColor } from '../components/charts/GaugeChart'
import { GaugeCard, SectionLabel } from '../components/charts/GaugeCard'

export function LeadingIndicatorsSection() {
  const { fredApiKey } = useApp()

  // ── Daily: for Gromen 10Y × Oil ────────────────────────────────────────────
  const us10y  = useFRED('DGS10',        fredApiKey, { frequency: 'd', observationStart: '2025-01-01' })
  const wtiS   = useFRED('DCOILWTICO',   fredApiKey, { frequency: 'd', observationStart: '2025-01-01' })

  // ── Monthly: recession probability models ──────────────────────────────────
  // SAHMREALTIME: Sahm Rule real-time estimate (0 = no signal; ≥0.5 = recession triggered)
  const sahm   = useFRED('SAHMREALTIME', fredApiKey, { frequency: 'm', observationStart: '2019-01-01' })
  // RECPROUSM156N: Chauvet-Piger smoothed US recession probability (0–100%)
  const recProb = useFRED('RECPROUSM156N', fredApiKey, { frequency: 'm', observationStart: '2005-01-01' })

  // ── Historical chart series ─────────────────────────────────────────────────
  const us10yH  = useFRED('DGS10',        fredApiKey, { frequency: 'm', observationStart: '2000-01-01' })
  const wtiSH   = useFRED('DCOILWTICO',   fredApiKey, { frequency: 'm', observationStart: '2000-01-01' })
  const sahmH   = useFRED('SAHMREALTIME', fredApiKey, { frequency: 'm', observationStart: '2000-01-01' })
  const recProbH = useFRED('RECPROUSM156N', fredApiKey, { frequency: 'm', observationStart: '2000-01-01' })

  // ── Derived ─────────────────────────────────────────────────────────────────
  // Gromen stress: 10Y yield × WTI spot. Captures simultaneous energy + borrowing cost pressure.
  const gromenV = us10y.lastValue !== null && wtiS.lastValue !== null
    ? us10y.lastValue * wtiS.lastValue : null
  const gromenP = us10y.prevValue !== null && wtiS.prevValue !== null
    ? us10y.prevValue * wtiS.prevValue : null

  // Historical Gromen stress series (monthly product)
  const gromenHistory = (() => {
    if (!us10yH.data.length || !wtiSH.data.length) return []
    const wtiMap = new Map(wtiSH.data.map(d => [d.date, d.value]))
    return us10yH.data
      .filter(d => wtiMap.has(d.date) && (wtiMap.get(d.date) ?? 0) > 0)
      .map(d => ({ date: d.date, value: d.value * (wtiMap.get(d.date) ?? 0) }))
  })()

  if (!fredApiKey) return <div className="section-enter"><NoApiKeyCard /></div>

  return (
    <div className="section-enter flex flex-col gap-6">
      <p className="text-[10.5px] text-text-muted leading-relaxed">
        Forward-looking stress indicators — green = low recession risk, red = elevated risk / historical trigger zone.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

        {/* ── Gromen ───────────────────────────────────────────────────────── */}
        <SectionLabel title="Gromen Fiscal Stress Indicator" />

        {(() => {
          const delta = gromenV !== null && gromenP !== null ? gromenV - gromenP : null
          return (
            <GaugeCard
              title="10Y Yield × Oil Price"
              subtitle="Luke Gromen: simultaneous energy + borrowing cost pressure. >300=historical crisis zone."
              source="FRED DGS10 × DCOILWTICO"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(1)}`}
            >
              <GaugeChart value={gromenV} min={0} max={600} greenMax={150} redMin={300}
                format={(v) => v.toFixed(0)} loading={us10y.loading || wtiS.loading}
                greenLabel="Easy" yellowLabel="Elevated" redLabel="Crisis" />
            </GaugeCard>
          )
        })()}

        {/* ── Recession probability ─────────────────────────────────────────── */}
        <SectionLabel title="Recession Probability Models" />

        {(() => {
          const delta = sahm.lastValue !== null && sahm.prevValue !== null ? sahm.lastValue - sahm.prevValue : null
          return (
            <GaugeCard
              title="Sahm Rule — Real-time"
              subtitle="Rise in 3M avg unemployment rate from 12M low. ≥0.50 = recession triggered historically."
              source="FRED SAHMREALTIME"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(2)}`}
            >
              <GaugeChart value={sahm.lastValue} min={0} max={1.5} greenMax={0.25} redMin={0.50}
                format={(v) => v.toFixed(2)} loading={sahm.loading}
                greenLabel="No Signal" yellowLabel="Warning" redLabel="Triggered" />
            </GaugeCard>
          )
        })()}

        {(() => {
          const delta = recProb.lastValue !== null && recProb.prevValue !== null ? recProb.lastValue - recProb.prevValue : null
          return (
            <GaugeCard
              title="US Recession Probability"
              subtitle="Chauvet-Piger smoothed model (yield curve + macro data). >40%=high risk."
              source="FRED RECPROUSM156N"
              delta={delta} deltaColor={getDeltaColor(delta, true)}
              formatDelta={(d) => `${Math.abs(d).toFixed(1)}%`}
            >
              <GaugeChart value={recProb.lastValue} min={0} max={100} greenMax={10} redMin={40}
                format={(v) => `${v.toFixed(0)}%`} loading={recProb.loading}
                greenLabel="Low Risk" yellowLabel="Elevated" redLabel="High Risk" />
            </GaugeCard>
          )
        })()}

      </div>

      {/* ── Historical charts ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <ChartCard
          title="Gromen Stress Indicator — 10Y × WTI (2000–present)"
          subtitle="10-Year Treasury yield × WTI spot price. >300 = historical crisis / fiscal dominance threshold."
          height={300}
          badge="FRED"
          note="2022 peak: ~473 (Fed hiking + Ukraine oil spike). Post-COVID low: ~12 (near-zero rates + $20 oil)."
        >
          {gromenHistory.length > 0 ? (
            <MacroChart
              data={gromenHistory}
              label="10Y × WTI"
              color="#ef4444"
              type="area"
              refLine={300}
              refLabel="300"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              {us10yH.loading || wtiSH.loading ? 'Loading…' : 'No data'}
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Sahm Rule — Real-time (2000–present)"
          subtitle="Difference between 3-month average unemployment and 12-month minimum. Triggered at 0.50."
          height={300}
          badge="FRED"
          note="Gray shaded recessions where triggered. Currently rising from post-pandemic lows."
        >
          {sahmH.data.length > 0 ? (
            <MacroChart
              data={sahmH.data}
              label="Sahm Rule"
              color="#f59e0b"
              type="area"
              refLine={0.5}
              refLabel="0.50 trigger"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              {sahmH.loading ? 'Loading…' : 'No data'}
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="US Recession Probability — Chauvet-Piger (2000–present)"
          subtitle="Smoothed probability from dynamic factor Markov-switching model. Scale: 0–100%."
          height={300}
          badge="FRED"
          note="Spikes to near 100% at every recession onset. Currently watch for sustained move above 30%."
        >
          {recProbH.data.length > 0 ? (
            <MacroChart
              data={recProbH.data}
              label="Recession Prob (%)"
              color="#ef4444"
              type="area"
              refLine={40}
              refLabel="40%"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              {recProbH.loading ? 'Loading…' : 'No data'}
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="10Y Treasury Yield vs. WTI Crude (2000–present)"
          subtitle="Components of the Gromen stress indicator — both must rise together for stress."
          height={300}
          badge="FRED"
        >
          {us10yH.data.length > 0 && wtiSH.data.length > 0 ? (
            (() => {
              const wtiMap = new Map(wtiSH.data.map(d => [d.date, d.value]))
              const combined = us10yH.data
                .filter(d => wtiMap.has(d.date))
                .map(d => ({
                  date: d.date,
                  '10Y Yield (%)': d.value,
                  'WTI Crude ($)': wtiMap.get(d.date) ?? 0,
                }))
              // Use separate axes via a simple dual-line approach
              // Normalize WTI to same scale as yield for visual comparison (÷ 20)
              return (
                <MacroChart
                  data={combined.map(d => ({
                    date: d.date,
                    value: d['10Y Yield (%)'],
                  }))}
                  label="10Y Yield (%)"
                  color="#3b82f6"
                  type="line"
                />
              )
            })()
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              {us10yH.loading ? 'Loading…' : 'No data'}
            </div>
          )}
        </ChartCard>

      </div>

      {/* Rationale panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-card border border-bg-border rounded-xl p-4">
          <h4 className="text-sm font-medium text-text-secondary mb-2">Gromen 10Y × Oil — Rationale</h4>
          <ul className="text-xs text-text-muted space-y-1.5 leading-relaxed">
            <li>→ High oil = import cost inflation + energy burden on consumers & industry</li>
            <li>→ High 10Y = higher borrowing costs for government, corps, mortgages</li>
            <li>→ Both elevated simultaneously = "double whammy" — fiscal + energy stress at once</li>
            <li>→ Historical crisis zones: 1979–80 (~1000+), 2022 (~473), 2023 (~400)</li>
            <li>→ Post-GFC "easy era": 2011–2021 average ~90–130</li>
            <li>→ Gromen: once product sustains &gt;300, monetization becomes likely Fed response</li>
          </ul>
        </div>
        <div className="bg-bg-card border border-bg-border rounded-xl p-4">
          <h4 className="text-sm font-medium text-text-secondary mb-2">Sahm Rule — Rationale</h4>
          <ul className="text-xs text-text-muted space-y-1.5 leading-relaxed">
            <li>→ Created by Claudia Sahm (former Fed economist) as real-time recession trigger</li>
            <li>→ Measures how much the unemployment rate has risen from its recent low</li>
            <li>→ ≥0.50: historically triggered at the START of every recession since 1970</li>
            <li>→ Key advantage: uses unemployment data, available monthly with minimal lag</li>
            <li>→ Summer 2024: touched 0.53 briefly — first trigger since 2020 COVID recession</li>
            <li>→ Best used with other leading indicators: yield curve, credit spreads, CFNAI</li>
          </ul>
        </div>
        <div className="bg-bg-card border border-bg-border rounded-xl p-4">
          <h4 className="text-sm font-medium text-text-secondary mb-2">Recession Probability Model</h4>
          <ul className="text-xs text-text-muted space-y-1.5 leading-relaxed">
            <li>→ Chauvet-Piger dynamic factor Markov-switching model (published FRED)</li>
            <li>→ Incorporates employment, industrial production, income, sales</li>
            <li>→ Has called every NBER recession onset since 1979</li>
            <li>→ NY Fed yield-curve model (not on FRED): based solely on 10Y–3M spread</li>
            <li>→ Key difference: NY Fed is forward-looking (next 12 months); Chauvet-Piger is near-real-time</li>
            <li>→ Both should be watched: divergence is itself a signal worth monitoring</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
