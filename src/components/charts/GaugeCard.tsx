/**
 * Shared GaugeCard and SectionLabel components — used in OverviewSection and
 * individual section pages to display gauge summaries at the top of each page.
 */

interface GaugeCardProps {
  title: string
  subtitle: string
  source?: string
  delta: number | null
  deltaColor: string
  formatDelta: (d: number) => string
  headerNote?: string
  children: React.ReactNode
}

export function GaugeCard({
  title,
  subtitle,
  source,
  delta,
  deltaColor,
  formatDelta,
  headerNote,
  children,
}: GaugeCardProps) {
  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-start justify-between gap-1 min-h-[2.2rem]">
        <p className="text-[11px] font-semibold text-text-primary leading-tight">{title}</p>
        {delta !== null && (
          <span
            className="text-[11px] font-mono whitespace-nowrap shrink-0 leading-tight"
            style={{ color: deltaColor }}
          >
            ({delta >= 0 ? '+' : ''}{formatDelta(delta)})
          </span>
        )}
      </div>
      {headerNote && (
        <p className="text-[8.5px] font-mono text-text-muted leading-none -mt-0.5">{headerNote}</p>
      )}
      {children}
      <div className="flex items-center justify-between gap-1 mt-0.5">
        <p className="text-[9.5px] text-text-muted leading-tight truncate">{subtitle}</p>
        {source && (
          <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-muted shrink-0 font-mono">
            {source}
          </span>
        )}
      </div>
    </div>
  )
}

export function SectionLabel({ title }: { title: string }) {
  return (
    <div className="col-span-full flex items-center gap-3 pt-3 pb-0.5">
      <div className="h-px flex-1 bg-bg-border" />
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
        {title}
      </span>
      <div className="h-px flex-1 bg-bg-border" />
    </div>
  )
}
