// Semi-circular speedometer-style gauge — SVG, no dependencies
// Matches thick colored-segment style (Red→Yellow→Green left to right for stress gauges)

const CX = 120
const CY = 126
const R_OUT = 104
const R_IN  = 66   // arc thickness = 38px
const R_MID = (R_OUT + R_IN) / 2   // ~85 — label placement radius

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function angleFor(v: number, min: number, max: number): number {
  const t = clamp((v - min) / (max - min), 0, 1)
  return Math.PI * (1 - t)   // π = left (min), 0 = right (max)
}

function polar(r: number, a: number): [number, number] {
  return [
    parseFloat((CX + r * Math.cos(a)).toFixed(3)),
    parseFloat((CY - r * Math.sin(a)).toFixed(3)),
  ]
}

// Filled arc segment between two angles (a1 > a2, sweeping right)
function segPath(a1: number, a2: number, rOut: number, rIn: number): string {
  if (Math.abs(a1 - a2) < 0.001) return ''
  const large = (a1 - a2) > Math.PI ? 1 : 0
  const [ax, ay] = polar(rOut, a1)
  const [bx, by] = polar(rOut, a2)
  const [cx2, cy2] = polar(rIn, a2)
  const [dx, dy] = polar(rIn, a1)
  return `M${ax},${ay} A${rOut},${rOut} 0 ${large} 0 ${bx},${by} L${cx2},${cy2} A${rIn},${rIn} 0 ${large} 1 ${dx},${dy} Z`
}

// ─── color helper ──────────────────────────────────────────────────────────
export function zoneColor(v: number | null, greenMax: number, redMin: number): string {
  if (v === null) return '#64748b'
  if (v <= greenMax) return '#22c55e'
  if (v >= redMin)   return '#ef4444'
  return '#f59e0b'
}

// ─── needle (single) ──────────────────────────────────────────────────────
function NeedlePath({ angle, color, length = R_OUT - 10 }: { angle: number; color: string; length?: number }) {
  const [tipX, tipY] = polar(length, angle)
  const [b1x, b1y]  = polar(7, angle + Math.PI / 2)
  const [b2x, b2y]  = polar(7, angle - Math.PI / 2)
  return (
    <polygon
      points={`${b1x},${b1y} ${b2x},${b2y} ${tipX},${tipY}`}
      fill={color}
      opacity={0.92}
    />
  )
}

// ─── GaugeChart ───────────────────────────────────────────────────────────
export interface GaugeNeedle {
  value: number | null
  color: string
  label: string
}

interface GaugeChartProps {
  /** Single-needle shortcut: pass value, color auto-derived from zone */
  value?: number | null
  /** Multiple needles */
  needles?: GaugeNeedle[]
  min: number
  max: number
  greenMax: number
  redMin: number
  format: (v: number) => string
  loading?: boolean
  greenLabel?: string
  yellowLabel?: string
  redLabel?: string
}

export function GaugeChart({
  value,
  needles,
  min,
  max,
  greenMax,
  redMin,
  format,
  loading,
  greenLabel  = 'Safe',
  yellowLabel = 'Caution',
  redLabel    = 'Stress',
}: GaugeChartProps) {
  const aMin   = Math.PI      // left
  const aMax   = 0            // right
  const aGreen = angleFor(greenMax, min, max)
  const aRed   = angleFor(redMin,   min, max)

  // Build needle list
  const needleList: GaugeNeedle[] = needles
    ? needles
    : value !== null && value !== undefined
    ? [{ value, color: zoneColor(value, greenMax, redMin), label: '' }]
    : []

  // Primary value for display (first needle or single value)
  const primaryVal = value ?? (needleList[0]?.value ?? null)
  const displayStr = loading ? '…' : primaryVal !== null ? format(primaryVal) : 'N/A'
  const primaryColor = loading
    ? '#64748b'
    : primaryVal !== null
    ? zoneColor(primaryVal, greenMax, redMin)
    : '#64748b'

  // Zone angular spans (for label visibility check)
  const greenSpan  = aMin - aGreen
  const yellowSpan = aGreen - aRed
  const redSpan    = aRed - aMax

  const [gmx, gmy] = polar(R_MID, (aMin + aGreen) / 2)
  const [ymx, ymy] = polar(R_MID, (aGreen + aRed) / 2)
  const [rmx, rmy] = polar(R_MID, (aRed + aMax) / 2)

  const [minLX, minLY] = polar(R_OUT + 10, aMin)
  const [maxLX, maxLY] = polar(R_OUT + 10, aMax)

  // White separator positions
  const [sgxO, sgyO] = polar(R_OUT, aGreen)
  const [sgxI, sgyI] = polar(R_IN,  aGreen)
  const [srxO, sryO] = polar(R_OUT, aRed)
  const [srxI, sryI] = polar(R_IN,  aRed)

  const MIN_LABEL_SPAN = 0.32  // ~18 degrees in radians — below this, hide label

  return (
    <svg viewBox="0 0 240 150" className="w-full">
      {/* ── Colored segments ───────────────────────────────────── */}
      {/* Green zone */}
      {greenSpan > 0.01 && (
        <path d={segPath(aMin, aGreen, R_OUT, R_IN)} fill="#16a34a" />
      )}
      {/* Yellow zone */}
      {yellowSpan > 0.01 && (
        <path d={segPath(aGreen, aRed, R_OUT, R_IN)} fill="#d97706" />
      )}
      {/* Red zone */}
      {redSpan > 0.01 && (
        <path d={segPath(aRed, aMax, R_OUT, R_IN)} fill="#dc2626" />
      )}

      {/* ── Subtle shadow ring on inner edge ───────────────────── */}
      <path d={segPath(aMin, aMax, R_OUT + 2, R_OUT)} fill="rgba(0,0,0,0.25)" />
      <path d={segPath(aMin, aMax, R_IN, R_IN - 2)} fill="rgba(0,0,0,0.2)" />

      {/* ── White separator lines ───────────────────────────────── */}
      {aGreen > aMax && aGreen < aMin && (
        <line x1={sgxI} y1={sgyI} x2={sgxO} y2={sgyO} stroke="white" strokeWidth="2" />
      )}
      {aRed > aMax && aRed < aMin && (
        <line x1={srxI} y1={sryI} x2={srxO} y2={sryO} stroke="white" strokeWidth="2" />
      )}

      {/* ── Zone labels inside segments ─────────────────────────── */}
      {greenSpan > MIN_LABEL_SPAN && (
        <text x={gmx} y={gmy} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize="9" fontWeight="600" fontFamily="system-ui, sans-serif">
          {greenLabel}
        </text>
      )}
      {yellowSpan > MIN_LABEL_SPAN && (
        <text x={ymx} y={ymy} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize="9" fontWeight="600" fontFamily="system-ui, sans-serif">
          {yellowLabel}
        </text>
      )}
      {redSpan > MIN_LABEL_SPAN && (
        <text x={rmx} y={rmy} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize="9" fontWeight="600" fontFamily="system-ui, sans-serif">
          {redLabel}
        </text>
      )}

      {/* ── Inner circle (background for value) ─────────────────── */}
      <circle cx={CX} cy={CY} r={R_IN - 2} fill="#0f0f18" />

      {/* ── Needles ─────────────────────────────────────────────── */}
      {!loading && needleList.map((n, i) => {
        if (n.value === null) return null
        const a = angleFor(n.value, min, max)
        // shorter length for secondary needles so they don't all overlap exactly
        const len = R_OUT - 8 - i * 3
        return <NeedlePath key={i} angle={a} color={n.color} length={len} />
      })}

      {/* ── Hub circle (on top of needles) ──────────────────────── */}
      <circle cx={CX} cy={CY} r="9"  fill="#1e1e30" stroke="#64748b" strokeWidth="1.5" />
      <circle cx={CX} cy={CY} r="4"  fill={primaryColor} />

      {/* ── Value display inside arc ────────────────────────────── */}
      <text
        x={CX} y={CY - 22}
        textAnchor="middle"
        fill={primaryColor}
        fontSize="14"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
        letterSpacing="-0.5"
      >
        {displayStr}
      </text>

      {/* ── Min / max corner labels ─────────────────────────────── */}
      <text x={minLX - 2} y={minLY + 2} textAnchor="end"   fill="#475569" fontSize="8" fontFamily="monospace">
        {format(min)}
      </text>
      <text x={maxLX + 2} y={maxLY + 2} textAnchor="start" fill="#475569" fontSize="8" fontFamily="monospace">
        {format(max)}
      </text>

      {/* ── Multi-needle legend (only when needles prop given) ───── */}
      {needles && needles.length > 1 && (
        <g transform={`translate(${CX},${CY + 22})`}>
          {needles.map((n, i) => {
            const totalW = needles.length * 64
            const xOffset = -totalW / 2 + i * 64 + 32
            return (
              <g key={i} transform={`translate(${xOffset}, 0)`}>
                <circle cx="0" cy="0" r="4" fill={n.color} />
                <text x="7" y="1" fill="#94a3b8" fontSize="8.5" dominantBaseline="middle" fontFamily="system-ui">
                  {n.label}
                  {n.value !== null ? ` ${format(n.value)}` : ''}
                </text>
              </g>
            )
          })}
        </g>
      )}
    </svg>
  )
}
