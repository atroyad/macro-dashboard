import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | null
  change?: number | null
  changeLabel?: string
  subtitle?: string
  color?: string
  loading?: boolean
  icon?: ReactNode
}

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  subtitle,
  color = '#00d4aa',
  loading = false,
  icon,
}: MetricCardProps) {
  const isUp = change !== null && change !== undefined && change > 0
  const isDown = change !== null && change !== undefined && change < 0

  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-4 flex flex-col gap-1 hover:border-bg-elevated transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted uppercase tracking-wider font-medium">
          {label}
        </span>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>

      {loading ? (
        <div className="h-8 w-24 bg-bg-elevated rounded animate-pulse mt-1" />
      ) : (
        <div className="font-mono text-2xl font-medium mt-1" style={{ color }}>
          {value ?? '—'}
        </div>
      )}

      {(change !== null && change !== undefined) && !loading && (
        <div className={`flex items-center gap-1 text-xs font-mono ${isUp ? 'text-accent-green' : isDown ? 'text-accent-red' : 'text-text-muted'}`}>
          {isUp ? <TrendingUp size={12} /> : isDown ? <TrendingDown size={12} /> : <Minus size={12} />}
          <span>{isUp ? '+' : ''}{change?.toFixed(2)}{changeLabel ?? '%'}</span>
        </div>
      )}

      {subtitle && (
        <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
      )}
    </div>
  )
}

interface ChartCardProps {
  title: string
  subtitle?: string
  height?: number
  children: ReactNode
  badge?: string
  badgeColor?: string
  note?: string
}

export function ChartCard({
  title,
  subtitle,
  height = 300,
  children,
  badge,
  badgeColor = '#00d4aa',
  note,
}: ChartCardProps) {
  return (
    <div className="bg-bg-card border border-bg-border rounded-xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-text-primary">{title}</h3>
            {badge && (
              <span
                className="text-xs px-1.5 py-0.5 rounded font-mono"
                style={{ background: `${badgeColor}20`, color: badgeColor }}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div style={{ height }} className="px-2 pb-2">
        {children}
      </div>
      {note && (
        <p className="text-xs text-text-muted px-4 pb-3 italic">{note}</p>
      )}
    </div>
  )
}

export function LoadingCard({ height = 300 }: { height?: number }) {
  return (
    <div
      className="bg-bg-card border border-bg-border rounded-xl animate-pulse"
      style={{ height }}
    />
  )
}

export function NoApiKeyCard() {
  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[200px]">
      <div className="text-accent-orange text-2xl">🔑</div>
      <p className="text-text-secondary text-sm">
        FRED API key required for this chart
      </p>
      <p className="text-text-muted text-xs">
        Get a free key at{' '}
        <a
          href="https://fred.stlouisfed.org/docs/api/api_key.html"
          target="_blank"
          rel="noreferrer"
          className="text-accent-teal hover:underline"
        >
          fred.stlouisfed.org
        </a>{' '}
        and enter it in Settings ⚙
      </p>
    </div>
  )
}
