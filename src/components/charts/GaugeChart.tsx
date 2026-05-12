/**
 * Semi-circular gauge — stroke-dasharray technique.
 *
 * Two internal layouts:
 *   Single needle  → arc at CY=100, R=80, viewBox 200×130
 *   Multi needle   → legend rows at top (y≈9, y≈20), arc shifted down to CY=112, R=75, viewBox 200×148
 */

// ─── Single-needle geometry ───────────────────────────────────────────────────
const CX  = 100
const CY1 = 100   // single needle arc center Y
const R1  = 80
const SW  = 24

// ─── Multi-needle geometry (legend at top pushes arc down) ────────────────────
const CY2 = 112   // multi-needle arc center Y
const R2  = 75

function arc(cy: number, r: number) {
  return `M ${CX - r} ${cy} A ${r} ${r} 0 0 1 ${CX + r} ${cy}`
}

function frac(v: number, min: number, max: number) {
  return Math.max(0, Math.min(1, (v - min) / (max - min)))
}

function arcXY(f: number, cy: number, r: number): [number, number] {
  const a = Math.PI * (1 - f)
  return [CX + r * Math.cos(a), cy - r * Math.sin(a)]
}

// ─── Color helper ─────────────────────────────────────────────────────────────
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

// ─── One colored arc segment ──────────────────────────────────────────────────
function ArcSeg({
  f1, f2, color, label, cy, r,
}: {
  f1: number; f2: number; color: string; label?: string; cy: number; r: number
}) {
  if (f2 <= f1 + 0.005) return null
  const len    = (f2 - f1) * 100
  const offset = -(f1 * 100)
  const showLabel = (f2 - f1) > 0.15
  const [lx, ly] = arcXY((f1 + f2) / 2, cy, r)
  return (
    <>
      <path
        d={arc(cy, r)} fill="none" stroke={color} strokeWidth={SW}
        pathLength="100"
        strokeDasharray={`${len} 100`}
        strokeDashoffset={`${offset}`}
        strokeLinecap="butt"
      />
      {showLabel && label && (
        <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize="7.5" fontWeight="700"
          fontFamily="system-ui, sans-serif" style={{ pointerEvents: 'none' }}>
          {label}
        </text>
      )}
    </>
  )
}

// ─── Zone boundary tick ───────────────────────────────────────────────────────
function Tick({ f, cy, r }: { f: number; cy: number; r: number }) {
  if (f <= 0.005 || f >= 0.995) return null
  const [x1, y1] = arcXY(f, cy, r - SW / 2 - 1)
  const [x2, y2] = arcXY(f, cy, r + SW / 2 + 1)
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="2" opacity="0.85" />
}

// ─── Main GaugeChart ──────────────────────────────────────────────────────────
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
  const isMulti = needles && needles.length > 1
  const cy = isMulti ? CY2 : CY1
  const r  = isMulti ? R2  : R1

  const fGreen = frac(greenMax, min, max)
  const fRed   = frac(redMin,   min, max)

  const zones = inverted
    ? [
        { f1: 0,      f2: fRed,   color: '#dc2626', label: redLabel    },
        { f1: fRed,   f2: fGreen, color: '#d97706', label: yellowLabel  },
        { f1: fGreen, f2: 1,      color: '#16a34a', label: greenLabel   },
      ]
    : [
        { f1: 0,      f2: fGreen, color: '#16a34a', label: greenLabel   },
        { f1: fGreen, f2: fRed,   color: '#d97706', label: yellowLabel  },
        { f1: fRed,   f2: 1,      color: '#dc2626', label: redLabel     },
      ]

  // Build needle list
  const needleList: GaugeNeedle[] = needles
    ? needles
    : value != null
      ? [{ value, color: zoneColor(value, greenMax, redMin, inverted), label: '' }]
      : []

  // Primary display value: for multi, use highest non-null value with its color
  let displayVal: number | null = null
  let displayColor = '#64748b'

  if (isMulti) {
    const valid = needleList.filter(n => n.value !== null)
    if (valid.length > 0) {
      const top = valid.reduce((a, b) => (b.value! > a.value! ? b : a))
      displayVal   = top.value
      displayColor = top.color
    }
  } else {
    displayVal   = value ?? null
    displayColor = zoneColor(displayVal, greenMax, redMin, inverted)
  }

  const displayStr = loading ? '…' : displayVal != null ? format(displayVal) : 'N/A'

  // viewBox size depends on layout
  const vbH = isMulti ? 148 : 130

  // Legend rows (multi only) — placed at TOP of SVG before arc
  const row1 = isMulti ? needleList.slice(0, 2) : []
  const row2 = isMulti ? needleList.slice(2)    : []

  return (
    <svg viewBox={`0 0 200 ${vbH}`} className="w-full">

      {/* ── Multi-needle legend at TOP ──────────────────────────── */}
      {isMulti && (
        <>
          {/* Row 1 — first 2 needles */}
          <g transform="translate(100, 9)">
            {row1.map((n, i) => {
              const x = row1.length === 1 ? 0 : -55 + i * 110
              return (
                <g key={i} transform={`translate(${x}, 0)`}>
                  <circle cx="0" cy="0" r="4" fill={n.value !== null ? n.color : '#475569'} />
                  <text x="7" y="1" fill="#cbd5e1" fontSize="8.5"
                    dominantBaseline="middle" fontFamily="system-ui, sans-serif">
                    {n.label}{n.value !== null ? ` ${format(n.value)}` : ' N/A'}
                  </text>
                </g>
              )
            })}
          </g>
          {/* Row 2 — remaining needles */}
          {row2.length > 0 && (
            <g transform="translate(100, 21)">
              {row2.map((n, i) => {
                const x = row2.length === 1 ? 0 : -55 + i * 110
                return (
                  <g key={i} transform={`translate(${x}, 0)`}>
                    <circle cx="0" cy="0" r="4" fill={n.value !== null ? n.color : '#475569'} />
                    <text x="7" y="1" fill="#cbd5e1" fontSize="8.5"
                      dominantBaseline="middle" fontFamily="system-ui, sans-serif">
                      {n.label}{n.value !== null ? ` ${format(n.value)}` : ' N/A'}
                    </text>
                  </g>
                )
              })}
            </g>
          )}
        </>
      )}

      {/* ── Background track ───────────────────────────────────── */}
      <path d={arc(cy, r)} fill="none" stroke="#1a1a2e" strokeWidth={SW + 6}
        pathLength="100" strokeLinecap="butt" />

      {/* ── Colored zone arcs ──────────────────────────────────── */}
      {zones.map((z, i) => (
        <ArcSeg key={i} f1={z.f1} f2={z.f2} color={z.color} label={z.label} cy={cy} r={r} />
      ))}

      {/* ── Separator ticks ────────────────────────────────────── */}
      <Tick f={fGreen} cy={cy} r={r} />
      <Tick f={fRed}   cy={cy} r={r} />

      {/* ── Needles ────────────────────────────────────────────── */}
      {!loading && needleList.map((n, i) => {
        if (n.value === null) return null
        const f    = frac(n.value, min, max)
        const tipR = r - SW / 2 - 3 - i * 7
        const [tx, ty] = arcXY(f, cy, tipR)
        return (
          <g key={i}>
            <line x1={CX} y1={cy} x2={tx} y2={ty}
              stroke="rgba(0,0,0,0.45)" strokeWidth="3.5" strokeLinecap="round" />
            <line x1={CX} y1={cy} x2={tx} y2={ty}
              stroke={n.color} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )
      })}

      {/* ── Hub ────────────────────────────────────────────────── */}
      <circle cx={CX} cy={cy} r="9"   fill="#0d0d1a" stroke="#334155" strokeWidth="1.5" />
      <circle cx={CX} cy={cy} r="4.5" fill={loading ? '#475569' : displayColor} />

      {/* ── Primary value (below hub, in arc opening) ──────────── */}
      <text x={CX} y={cy + 24} textAnchor="middle"
        fill={loading ? '#64748b' : displayColor}
        fontSize="13" fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, monospace" letterSpacing="-0.5">
        {displayStr}
      </text>

      {/* ── Min / max endpoint labels ──────────────────────────── */}
      <text x={CX - r + 2} y={cy + 15} textAnchor="middle"
        fill="#475569" fontSize="7.5" fontFamily="monospace">
        {format(min)}
      </text>
      <text x={CX + r - 2} y={cy + 15} textAnchor="middle"
        fill="#475569" fontSize="7.5" fontFamily="monospace">
        {format(max)}
      </text>
    </svg>
  )
}
