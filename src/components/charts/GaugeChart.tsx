/**
 * Semi-circular gauge using stroke-dasharray on a defined arc path.
 * This approach is far more reliable than filled path segments — no arc math errors,
 * no fill disappearing due to wrong winding order.
 *
 * Layout:
 *   Center: (CX=100, CY=100), Arc radius R=80, stroke-width SW=26
 *   Arc path: M 20 100 A 80 80 0 0 1 180 100
 *   (clockwise from left endpoint to right endpoint = top semicircle)
 *   pathLength="100" normalizes all dasharray values to percentages [0-100]
 */

const CX = 100
const CY = 100
const R  = 80
const SW = 26

// Top semicircle: from left (20,100) clockwise to right (180,100)
const ARC = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`

// Clamp value to [0,1]
function frac(v: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (v - min) / (max - min)))
}

// XY position on the arc at fraction f (0=left/min, 1=right/max)
// Arc goes clockwise from 180° to 0° over the top, so angle = π(1-f)
function arcXY(f: number, r = R): [number, number] {
  const a = Math.PI * (1 - f)
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)]
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export function zoneColor(
  v: number | null,
  greenMax: number,
  redMin: number,
  inverted = false,
): string {
  if (v === null) return '#64748b'
  if (!inverted) {
    if (v <= greenMax) return '#22c55e'
    if (v >= redMin)   return '#ef4444'
    return '#f59e0b'
  } else {
    // inverted: high = good, low = bad
    if (v >= greenMax) return '#22c55e'
    if (v <= redMin)   return '#ef4444'
    return '#f59e0b'
  }
}

export interface GaugeNeedle {
  value: number | null
  color: string
  label: string
}

export interface GaugeChartProps {
  /** Single value — color derived from zone */
  value?: number | null
  /** Multiple needles with explicit colors */
  needles?: GaugeNeedle[]
  min: number
  max: number
  /** Below this = green (or above this = green when inverted) */
  greenMax: number
  /** Above this = red (or below this = red when inverted) */
  redMin: number
  /** Flip zone colors so high = good, low = bad (e.g. vessel count) */
  inverted?: boolean
  format: (v: number) => string
  loading?: boolean
  greenLabel?: string
  yellowLabel?: string
  redLabel?: string
}

// ─── Colored arc segment ─────────────────────────────────────────────────────
function ArcSeg({
  f1, f2, color, label,
}: {
  f1: number; f2: number; color: string; label?: string
}) {
  if (f2 <= f1 + 0.005) return null
  const len = (f2 - f1) * 100
  const offset = -f1 * 100
  // Label position: midpoint of zone, at arc centerline radius
  const [lx, ly] = arcXY((f1 + f2) / 2, R)
  const showLabel = (f2 - f1) > 0.16

  return (
    <>
      <path
        d={ARC}
        fill="none"
        stroke={color}
        strokeWidth={SW}
        pathLength="100"
        strokeDasharray={`${len} 100`}
        strokeDashoffset={`${offset}`}
        strokeLinecap="butt"
      />
      {showLabel && label && (
        <text
          x={lx} y={ly}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="8.5"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          style={{ pointerEvents: 'none' }}
        >
          {label}
        </text>
      )}
    </>
  )
}

// ─── Zone-boundary tick ───────────────────────────────────────────────────────
function Tick({ f }: { f: number }) {
  if (f <= 0.005 || f >= 0.995) return null
  const [x1, y1] = arcXY(f, R - SW / 2 - 2)
  const [x2, y2] = arcXY(f, R + SW / 2 + 2)
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="2" opacity="0.8" />
}

// ─── Main component ───────────────────────────────────────────────────────────
export function GaugeChart({
  value,
  needles,
  min,
  max,
  greenMax,
  redMin,
  inverted = false,
  format,
  loading = false,
  greenLabel  = 'Safe',
  yellowLabel = 'Caution',
  redLabel    = 'Stress',
}: GaugeChartProps) {
  const fGreen = frac(greenMax, min, max)
  const fRed   = frac(redMin,   min, max)

  // Zone definitions (from left=min to right=max)
  const zones = inverted
    ? [
        { f1: 0,       f2: fRed,   color: '#dc2626', label: redLabel   },
        { f1: fRed,    f2: fGreen, color: '#d97706', label: yellowLabel },
        { f1: fGreen,  f2: 1,      color: '#16a34a', label: greenLabel  },
      ]
    : [
        { f1: 0,       f2: fGreen, color: '#16a34a', label: greenLabel  },
        { f1: fGreen,  f2: fRed,   color: '#d97706', label: yellowLabel },
        { f1: fRed,    f2: 1,      color: '#dc2626', label: redLabel    },
      ]

  // Build needle list
  const needleList: GaugeNeedle[] = needles
    ? needles
    : value != null
      ? [{ value, color: zoneColor(value, greenMax, redMin, inverted), label: '' }]
      : []

  const primaryVal   = value ?? needleList[0]?.value ?? null
  const primaryColor = zoneColor(primaryVal, greenMax, redMin, inverted)
  const displayStr   = loading ? '…' : primaryVal != null ? format(primaryVal) : 'N/A'

  const hasMultiNeedle = needles && needles.length > 1
  // Viewbox: extra height when legend needed
  const vbHeight = hasMultiNeedle ? 148 : 133

  return (
    <svg viewBox={`0 0 200 ${vbHeight}`} className="w-full">

      {/* ── Background track (slightly wider than colored arcs) ───── */}
      <path
        d={ARC}
        fill="none"
        stroke="#1e1e30"
        strokeWidth={SW + 6}
        pathLength="100"
        strokeLinecap="butt"
      />

      {/* ── Colored zone arcs ────────────────────────────────────── */}
      {zones.map((z, i) => (
        <ArcSeg key={i} f1={z.f1} f2={z.f2} color={z.color} label={z.label} />
      ))}

      {/* ── Zone boundary separator ticks ────────────────────────── */}
      <Tick f={fGreen} />
      <Tick f={fRed} />

      {/* ── Outer/inner subtle borders ───────────────────────────── */}
      <path d={ARC} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} pathLength="100"
        style={{ transform: `translateY(${-(SW / 2 + 1)}px)` }} />

      {/* ── Needles ─────────────────────────────────────────────── */}
      {!loading && needleList.map((n, i) => {
        if (n.value === null) return null
        const f = frac(n.value, min, max)
        // Primary needle longer; secondary needles slightly shorter so tips are distinct
        const tipR = R - SW / 2 - 4 - i * 6
        const [tx, ty] = arcXY(f, tipR)
        return (
          <g key={i}>
            {/* Needle shadow */}
            <line x1={CX} y1={CY} x2={tx} y2={ty}
              stroke="rgba(0,0,0,0.4)" strokeWidth="4" strokeLinecap="round" />
            {/* Needle */}
            <line x1={CX} y1={CY} x2={tx} y2={ty}
              stroke={n.color} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )
      })}

      {/* ── Hub (drawn on top of needles) ────────────────────────── */}
      <circle cx={CX} cy={CY} r="9"   fill="#0d0d1a" stroke="#334155" strokeWidth="1.5" />
      <circle cx={CX} cy={CY} r="4.5" fill={loading ? '#475569' : primaryColor} />

      {/* ── Value text (below hub, inside arc opening) ────────────── */}
      <text
        x={CX} y={CY + 22}
        textAnchor="middle"
        fill={loading ? '#64748b' : primaryColor}
        fontSize="13"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
        letterSpacing="-0.5"
      >
        {displayStr}
      </text>

      {/* ── Min / max endpoint labels ─────────────────────────────── */}
      <text
        x={CX - R - 2} y={CY + 14}
        textAnchor="end"
        fill="#475569"
        fontSize="8"
        fontFamily="ui-monospace, monospace"
      >
        {format(min)}
      </text>
      <text
        x={CX + R + 2} y={CY + 14}
        textAnchor="start"
        fill="#475569"
        fontSize="8"
        fontFamily="ui-monospace, monospace"
      >
        {format(max)}
      </text>

      {/* ── Multi-needle legend ───────────────────────────────────── */}
      {hasMultiNeedle && (
        <g>
          {needles!.map((n, i) => {
            const totalW = 170
            const step   = needles!.length > 1 ? totalW / (needles!.length - 1) : 0
            const x = 15 + i * step
            return (
              <g key={i} transform={`translate(${x}, 135)`}>
                <circle cx="0" cy="0" r="4" fill={n.value !== null ? n.color : '#475569'} />
                <text
                  x="7" y="1"
                  fill="#94a3b8"
                  fontSize="8.5"
                  dominantBaseline="middle"
                  fontFamily="system-ui, sans-serif"
                >
                  {n.label}
                  {n.value !== null ? ` ${format(n.value)}` : ' N/A'}
                </text>
              </g>
            )
          })}
        </g>
      )}
    </svg>
  )
}
