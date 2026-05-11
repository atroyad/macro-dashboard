import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useFRED } from '../hooks/useFRED'
import { TradingViewChart } from '../components/charts/TradingViewChart'
import { ChartCard, MetricCard, NoApiKeyCard } from '../components/cards/MetricCard'
import { MacroChart, MultiMacroChart } from '../components/charts/MacroChart'
import { Building2 } from 'lucide-react'

const START = '2010-01-01'

export function CentralBanksSection() {
  const { fredApiKey } = useApp()

  // Fed
  const fedBs    = useFRED('WALCL',    fredApiKey, { frequency: 'w', observationStart: START })
  const tga      = useFRED('WTREGEN',  fredApiKey, { frequency: 'w', observationStart: START })
  const rrp      = useFRED('RRPONTSYD',fredApiKey, { frequency: 'w', observationStart: START })
  const fedFunds = useFRED('FEDFUNDS', fredApiKey, { frequency: 'm', observationStart: '1990-01-01' })

  // ECB — ECBASSETS: Total Assets of ECB, Millions of EUR, weekly
  const ecbBs = useFRED('ECBASSETS', fredApiKey, { frequency: 'w', observationStart: START })

  // Japan JGB 10Y (OECD long-term rate, monthly) — TVC:JP10Y restricted in embeds
  const jp10y = useFRED('IRLTLT01JPM156N', fredApiKey, { frequency: 'm', observationStart: '2000-01-01' })
  // China 10Y (OECD) — CN10Y TVC feed restricted in embeds
  const cn10y = useFRED('IRLTLT01CNM156N', fredApiKey, { frequency: 'm', observationStart: '2005-01-01' })

  // Gold central bank purchases proxy
  const goldCB = useFRED('GOLDAMGBD228NLBM', fredApiKey, { frequency: 'm', observationStart: '2000-01-01' })

  // WALCL is in millions → divide by 1000 for $B, /1e6 for $T
  const fedBsB = useMemo(() => fedBs.data.map(d => ({ date: d.date, value: d.value / 1000 })), [fedBs.data])
  const tgaB   = useMemo(() => tga.data.map(d => ({ date: d.date, value: d.value / 1000 })), [tga.data])

  return (
    <div className="section-enter flex flex-col gap-6">
      {fredApiKey ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Fed Total Assets"
            value={fedBs.lastValue ? `$${(fedBs.lastValue / 1e6).toFixed(1)}T` : null}
            subtitle="WALCL weekly"
            color="#3b82f6"
            loading={fedBs.loading}
            icon={<Building2 size={14} />}
          />
          <MetricCard
            label="ECB Total Assets"
            value={ecbBs.lastValue ? `€${(ecbBs.lastValue / 1e6).toFixed(1)}T` : null}
            subtitle="ECBASSETS weekly"
            color="#8b5cf6"
            loading={ecbBs.loading}
            icon={<Building2 size={14} />}
          />
          <MetricCard
            label="Fed Funds Rate"
            value={fedFunds.lastValue ? `${fedFunds.lastValue.toFixed(2)}%` : null}
            subtitle="FEDFUNDS monthly"
            color="#f59e0b"
            loading={fedFunds.loading}
          />
          <MetricCard
            label="TGA Balance"
            value={tga.lastValue ? `$${(tga.lastValue / 1000).toFixed(0)}B` : null}
            subtitle="Treasury Gen. Account"
            color="#00d4aa"
            loading={tga.loading}
          />
        </div>
      ) : (
        <NoApiKeyCard />
      )}

      {/* Fed: QE/QT cycles */}
      {fredApiKey && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Federal Reserve Balance Sheet"
            subtitle="Total Assets ($B) — QE and QT cycles"
            height={320}
            badge="FRED"
            note="QE1 (2008), QE2 (2010), QE3 (2012–14), COVID QE (2020–22), current QT."
          >
            {fedBsB.length > 0 ? (
              <MacroChart data={fedBsB} label="Fed BS ($B)" color="#3b82f6" unit="B" denominate />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading…</div>
            )}
          </ChartCard>

          <ChartCard
            title="Fed Funds Rate History"
            subtitle="Policy rate since 1990 — rate cycles and zero bound periods"
            height={320}
            badge="FRED"
          >
            {fedFunds.data.length > 0 ? (
              <MacroChart data={fedFunds.data} label="FFR" color="#f59e0b" unit="%" type="area" />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading…</div>
            )}
          </ChartCard>

          <ChartCard
            title="ECB Balance Sheet (ECBASSETS)"
            subtitle="Total Assets in €T — PSPP, PEPP, TLTRO programs visible"
            height={320}
            badge="FRED"
          >
            {ecbBs.data.length > 0 ? (
              <MacroChart
                data={ecbBs.data.map(d => ({ date: d.date, value: d.value / 1e6 }))}
                label="ECB BS (€T)"
                color="#8b5cf6"
                unit="T"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                {ecbBs.loading ? 'Loading…' : 'No data — ECB series may lag'}
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="TGA + RRP: Fed Liquidity Drain"
            subtitle="High TGA or RRP = less money in banking system"
            height={320}
            badge="FRED"
          >
            {tgaB.length > 0 && rrp.data.length > 0 ? (
              (() => {
                const rrpMap = new Map(rrp.data.map(d => [d.date, d.value]))
                const combined = tgaB
                  .filter(d => rrpMap.has(d.date))
                  .map(d => ({
                    date: d.date,
                    'TGA ($B)': d.value,
                    'RRP ($B)': rrpMap.get(d.date) ?? 0,
                  }))
                return (
                  <MultiMacroChart
                    data={combined}
                    series={[
                      { key: 'TGA ($B)', label: 'TGA ($B)', color: '#f59e0b' },
                      { key: 'RRP ($B)', label: 'Reverse Repo ($B)', color: '#ef4444' },
                    ]}
                  />
                )
              })()
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">Loading…</div>
            )}
          </ChartCard>
        </div>
      )}

      {/* BoJ / Japan section */}
      <div className="bg-bg-card border border-accent-red/30 rounded-xl p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🇯🇵</span>
          <h3 className="text-sm font-semibold text-text-primary">
            Bank of Japan — Yield Curve Control & JPY Crisis Watch
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent-red/20 text-accent-red font-mono ml-auto">
            High Risk
          </span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          Japan's debt-to-GDP exceeds 260%. The BoJ owns ~53% of all JGBs and has
          suppressed yields near zero for decades. YCC policy creates a binary trap:
          maintain → JPY collapse; exit → JGB crash. Monitor USD/JPY, JGB 10Y yield,
          and BoJ weekly asset purchases. A disorderly JPY unwind would trigger global carry
          trade unwind ($4T+ USD/JPY carry) — watch for JPY below 160 as stress signal.
        </p>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ChartCard
            title="USD/JPY"
            subtitle="JPY weakness = BoJ pressure / carry trade stress"
            height={320}
            badge="TradingView"
            badgeColor="#3b82f6"
          >
            <TradingViewChart symbol="FX:USDJPY" interval="W" height={260} />
          </ChartCard>
          <ChartCard
            title="Japan JGB 10Y Yield (OECD)"
            subtitle="IRLTLT01JPM156N — BoJ YCC cap: breaking higher = policy stress"
            height={320}
            badge="FRED"
            note="OECD long-term rate, monthly. TVC:JP10Y requires TradingView subscription for embeds."
          >
            {fredApiKey && jp10y.data.length > 0 ? (
              <MacroChart data={jp10y.data} label="Japan 10Y (%)" color="#ef4444" unit="%" type="line" refLine={1} refLabel="1%" />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                {!fredApiKey ? 'Add FRED key' : jp10y.loading ? 'Loading…' : 'No data'}
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* PBoC section */}
      <div className="bg-bg-card border border-accent-orange/30 rounded-xl p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🇨🇳</span>
          <h3 className="text-sm font-semibold text-text-primary">
            People's Bank of China — Liquidity Injections & Property Deflation
          </h3>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          PBoC uses MLF (Medium-term Lending Facility), LPR cuts, RRR reductions,
          and reverse repos to inject liquidity. China's property sector ($60T market)
          deflation creates credit contraction. Monitor MLF operations, CGB 10Y yield
          (currently ~1.7% — deflation signal), and CNH for capital flow pressure.
        </p>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ChartCard
            title="China CGB 10Y Yield (OECD)"
            subtitle="IRLTLT01CNM156N — sub-2% = deflationary pressure"
            height={320}
            badge="FRED"
            note="OECD long-term rate, monthly. TVC:CN10Y requires TradingView subscription for embeds."
          >
            {fredApiKey && cn10y.data.length > 0 ? (
              <MacroChart data={cn10y.data} label="China 10Y (%)" color="#f59e0b" unit="%" type="line" refLine={2} refLabel="2%" />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                {!fredApiKey ? 'Add FRED key' : cn10y.loading ? 'Loading…' : 'No data'}
              </div>
            )}
          </ChartCard>
          <ChartCard
            title="USD/CNH (Offshore Yuan)"
            subtitle="Capital flight / devaluation pressure indicator"
            height={320}
            badge="TradingView"
            badgeColor="#3b82f6"
          >
            <TradingViewChart symbol="FX:USDCNH" interval="W" height={260} />
          </ChartCard>
        </div>
      </div>

      {/* Gold reserves context */}
      <div className="bg-bg-card border border-accent-orange/20 rounded-xl p-4">
        <h4 className="text-sm font-medium text-text-secondary mb-3">
          Central Bank Gold Purchases — Remonetization Signal
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fredApiKey && goldCB.data.length > 0 ? (
            <ChartCard
              title="Gold Price (LBMA AM)"
              subtitle="Proxy for CB demand dynamics"
              height={260}
              badge="FRED"
            >
              <MacroChart data={goldCB.data} label="Gold" color="#f59e0b" unit="$" />
            </ChartCard>
          ) : null}
          <div className="flex flex-col gap-2 justify-center">
            {[
              { country: '🇨🇳 China PBoC', detail: 'Adding ~20–30t/month; official reserves likely understated' },
              { country: '🇮🇳 India RBI', detail: 'Record 800+ tonnes; diversification from USD' },
              { country: '🇵🇱 Poland NBP', detail: 'Largest European buyer; NATO border hedge' },
              { country: '🇹🇷 Turkey TCMB', detail: 'Volatile — retail + CB buying to defend lira' },
              { country: '🇸🇦 Saudi Arabia', detail: 'Petrogold signal: pricing oil in non-USD assets' },
            ].map(r => (
              <div key={r.country} className="flex gap-2 text-xs">
                <span className="text-text-primary whitespace-nowrap">{r.country}:</span>
                <span className="text-text-muted">{r.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
