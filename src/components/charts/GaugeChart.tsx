/**
 * Semi-circular gauge using stroke-dasharray technique.
 * Arc: M 20 100 A 80 80 0 0 1 180 100  (left=min → clockwise → right=max)
 * pathLength="100" normalises dasharray to fractions of the arc.
 */

const CX = 100
const CY = 100
const R  = 80
const SW = 24   // stroke width of colored arc

const ARC = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`

function frac(v: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (v - min) / (max - min)))
}

// XY on the arc at fraction f  (0=left/min, 1=right/max, travels clockwise over top)
function arcXY(f: number, r = R): [number, number] {
  const a = Math.PI * (1 - f)
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)]
}

// ─── Exports ──────────────────────────────────────────────────────────────────

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
  value?: number | null
  needles?: GaugeNeedle[]
  min: number
  max: number
  greenMax: number
  redMin: number
  inverted?: boolean
  format: (v: number) => string
  loading?: boolean
  greenLabel?: string
  yellowLabel?: string
  redLabel?: string
}

// ─── One colored arc segment ─────────────────────────────────────────────────
function ArcSeg({ f1, f2, color, label }: { f1: number; f2: number; color: string; label?: string }) {
  if (f2 <= f1 + 0.005) return null
  const len    = (f2 - f1) * 100
  const offset = -(f1 * 100)
  const showLabel = (f2 - f1) > 0.15
  const [lx, ly] = arcXY((f1 + f2) / 2, R)
  return (
    <>
      <path
        d={ARC} fill="none" stroke={color} strokeWidth={SW}
        pathLength="100"
        strokeDasharray={`${len} 100`}
        strokeDashoffset={`${offset}`}
        strokeLinecap="butt"
      />
      {showLabel && label && (
        <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize="8" fontWeight="700"
          fontFamily="system-ui, sans-serif" style={{ pointerEvents: 'none' }}>
          {label}
        </text>
      )}
    </>
  )
}

// ─── Boundary tick ────────────────────────────────────────────────────────────
function Tick({ f }: { f: number }) {
  if (f <= 0.005 || f >= 0.995) return null
  const [x1, y1] = arcXY(f, R - SW / 2 - 1)
  const [x2, y2] = arcXY(f, R + SW / 2 + 1)
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="2" opacity="0.85" />
}

// ─── Main GaugeChart ─────────────────────────────────────────────────────────
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

  const zones = inverted
    ? [
        { f1: 0, f2: fRed,   color: '#dc2626', label: redLabel   },
        { f1: fRed, f2: fGreen, color: '#d97706', label: yellowLabel },
        { f1: fGreen, f2: 1, color: '#16a34a', label: greenLabel  },
      ]
    : [
        { f1: 0, f2: fGreen, color: '#16a34a', label: greenLabel  },
        { f1: fGreen, f2: fRed, color: '#d97706', label: yellowLabel },
        { f1: fRed, f2: 1,   color: '#dc2626', label: redLabel    },
      ]

  // Build needle list
  const needleList: GaugeNeedle[] = needles
    ? needles
    : value != null
      ? [{ value, color: zoneColor(value, greenMax, redMin, inverted), label: '' }]
      : []

  // For multi-needle: display the HIGHEST non-null value with its color
  const validNeedles = needleList.filter(n => n.value !== null)
  let displayVal: number | null = null
  let displayColor = '#64748b'

  if (needles && needles.length > 1) {
    if (validNeedles.length > 0) {
      const maxNeedle = validNeedles.reduce((a, b) => (b.value! > a.value! ? b : a))
      displayVal   = maxNeedle.value
      displayColor = maxNeedle.color
    }
  } else {
    displayVal   = value ?? null
    displayColor = zoneColor(displayVal, greenMax, redMin, inverted)
  }

  const displayStr = loading ? '…' : displayVal != null ? format(displayVal) : 'N/A'

  // Legend inside arc: fits 3 items in 2 rows inside the gap below hub
  const hasMultiLegend = needles && needles.length > 1
  // Row 1: first 2 needles; Row 2: remaining
  const row1 = hasMultiLegend ? needleList.slice(0, 2) : []
  const row2 = hasMultiLegend ? needleList.slice(2) : []

  return (
    <svg viewBox="0 0 200 138" className="w-full">

      {/* Background track */}
      <path d={ARC} fill="none" stroke="#1a1a2e" strokeWidth={SW + 6} pathLength="100" strokeLinecap="butt" />

      {/* Colored zone segments */}
      {zones.map((z, i) => <ArcSeg key={i} f1={z.f1} f2={z.f2} color={z.color} label={z.label} />)}

      {/* Separator ticks */}
      <Tick f={fGreen} />
      <Tick f={fRed} />

      {/* Needles */}
      {!loading && needleList.map((n, i) => {
        if (n.value === null) return null
        const f   = frac(n.value, min, max)
        // Each needle slightly shorter so tips are distinct when values are close
        const tipR = R - SW / 2 - 3 - i * 7
        const [tx, ty] = arcXY(f, tipR)
        return (
          <g key={i}>
            <line x1={CX} y1={CY} x2={tx} y2={ty} stroke="rgba(0,0,0,0.45)" strokeWidth="3.5" strokeLinecap="round" />
            <line x1={CX} y1={CY} x2={tx} y2={ty} stroke={n.color} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )
      })}

      {/* Hub */}
      <circle cx={CX} cy={CY} r="9"   fill="#0d0d1a" stroke="#334155" strokeWidth="1.5" />
      <circle cx={CX} cy={CY} r="4.5" fill={loading ? '#475569' : displayColor} />

      {/* Primary value — centered below hub, inside arc opening */}
      <text x={CX} y={CY + 24} textAnchor="middle"
        fill={loading ? '#64748b' : displayColor}
        fontSize="14" fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, monospace" letterSpacing="-0.5">
        {displayStr}
      </text>

      {/* Min / max labels at arc endpoints */}
      <text x={CX - R + 2} y={CY + 16} textAnchor="middle" fill="#475569" fontSize="7.5" fontFamily="monospace">
        {format(min)}
      </text>
      <text x={CX + R - 2} y={CY + 16} textAnchor="middle" fill="#475569" fontSize="7.5" fontFamily="monospace">
        {format(max)}
      </text>

      {/* Multi-needle legend — inside SVG, two compact rows */}
      {hasMultiLegend && (
        <>
          {/* Row 1 */}
          <g transform="translate(100, 118)">
            {row1.map((n, i) => {
              const totalW = Math.min(row1.length, 2) * 70
              const x = -totalW / 2 + i * 70 + 35
              return (
                <g key={i} transform={`translate(${x}, 0)`}>
                  <circle cx="0" cy="0" r="4.5" fill={n.value !== null ? n.color : '#475569'} />
                  <text x="7" y="1" fill="#cbd5e1" fontSize="8.5" dominantBaseline="middle" fontFamily="system-ui">
                    {n.label}{n.value !== null ? ` ${format(n.value)}` : ' N/A'}
                  </text>
                </g>
              )
            })}
          </g>
          {/* Row 2 */}
          {row2.length > 0 && (
            <g transform="translate(100, 131)">
              {row2.map((n, i) => {
                const totalW = row2.length * 70
                const x = -totalW / 2 + i * 70 + 35
                return (
                  <g key={i} transform={`translate(${x}, 0)`}>
                    <circle cx="0" cy="0" r="4.5" fill={n.value !== null ? n.color : '#475569'} />
                    <text x="7" y="1" fill="#cbd5e1" fontSize="8.5" dominantBaseline="middle" fontFamily="system-ui">
                      {n.label}{n.value !== null ? ` ${format(n.value)}` : ' N/A'}
                    </text>
                  </g>
                )
              })}
            </g>
          )}
        </>
      )}
    </svg>
  )
}
