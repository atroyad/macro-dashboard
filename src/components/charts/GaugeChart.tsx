// Semi-circular gauge chart — SVG-based, no external dependencies

const CX = 100
const CY = 105
const R_OUT = 88
const R_IN = 62

function angleFor(v: number, min: number, max: number): number {
  const t = Math.max(0, Math.min(1, (v - min) / (max - min)))
  return Math.PI * (1 - t) // π at min (left), 0 at max (right)
}

function polar(r: number, a: number): [number, number] {
  return [
    parseFloat((CX + r * Math.cos(a)).toFixed(2)),
    parseFloat((CY - r * Math.sin(a)).toFixed(2)),
  ]
}

function arcPath(a1: number, a2: number, rOut: number, rIn: number): string {
  // a1 > a2: going from larger angle (left) to smaller angle (right)
  if (Math.abs(a1 - a2) < 0.001) return ''
  const [x1, y1] = polar(rOut, a1)
  const [x2, y2] = polar(rOut, a2)
  const [x3, y3] = polar(rIn, a2)
  const [x4, y4] = polar(rIn, a1)
  const lg = a1 - a2 > Math.PI ? 1 : 0
  // Outer arc: counterclockwise (sweep=0), inner arc: clockwise (sweep=1)
  return `M${x1},${y1} A${rOut},${rOut} 0 ${lg} 0 ${x2},${y2} L${x3},${y3} A${rIn},${rIn} 0 ${lg} 1 ${x4},${y4} Z`
}

export function zoneColor(value: number | null, greenMax: number, redMin: number): string {
  if (value === null) return '#475569'
  if (value <= greenMax) return '#22c55e'
  if (value >= redMin) return '#ef4444'
  return '#f59e0b'
}

interface GaugeChartProps {
  value: number | null
  min: number
  max: number
  greenMax: number
  redMin: number
  format: (v: number) => string
  loading?: boolean
}

export function GaugeChart({
  value,
  min,
  max,
  greenMax,
  redMin,
  format,
  loading,
}: GaugeChartProps) {
  const aFull0 = Math.PI      // left (min)
  const aFull1 = 0            // right (max)
  const aGreen = angleFor(greenMax, min, max)
  const aRed   = angleFor(redMin,   min, max)
  const aNeedle = value !== null ? angleFor(value, min, max) : Math.PI / 2

  const color = zoneColor(value, greenMax, redMin)
  const [nx, ny] = polar(R_IN - 6, aNeedle)

  // Threshold tick positions
  const [tgxO, tgyO] = polar(R_OUT + 1, aGreen)
  const [tgxI, tgyI] = polar(R_IN - 1, aGreen)
  const [trxO, tryO] = polar(R_OUT + 1, aRed)
  const [trxI, tryI] = polar(R_IN - 1, aRed)

  const displayValue = loading ? '…'
    : value !== null ? format(value)
    : 'N/A'

  return (
    <svg viewBox="0 0 200 118" className="w-full">
      {/* Background track (full semicircle) */}
      <path d={arcPath(aFull0, aFull1, R_OUT, R_IN)} fill="#1a1a2e" />

      {/* Green zone: min → greenMax */}
      {aGreen < aFull0 && (
        <path d={arcPath(aFull0, aGreen, R_OUT, R_IN)} fill="#22c55e" opacity="0.75" />
      )}

      {/* Yellow zone: greenMax → redMin */}
      {aRed < aGreen && (
        <path d={arcPath(aGreen, aRed, R_OUT, R_IN)} fill="#f59e0b" opacity="0.75" />
      )}

      {/* Red zone: redMin → max */}
      {aRed > aFull1 && (
        <path d={arcPath(aRed, aFull1, R_OUT, R_IN)} fill="#ef4444" opacity="0.75" />
      )}

      {/* Threshold tick — green/yellow boundary */}
      <line x1={tgxI} y1={tgyI} x2={tgxO} y2={tgyO} stroke="#fff" strokeWidth="1.5" opacity="0.5" />
      {/* Threshold tick — yellow/red boundary */}
      <line x1={trxI} y1={tryI} x2={trxO} y2={tryO} stroke="#fff" strokeWidth="1.5" opacity="0.5" />

      {/* Needle */}
      {!loading && value !== null && (
        <>
          <line
            x1={CX} y1={CY} x2={nx} y2={ny}
            stroke={color} strokeWidth="2.5" strokeLinecap="round"
          />
          <circle cx={CX} cy={CY} r="5" fill={color} />
          <circle cx={CX} cy={CY} r="2.5" fill="#08080e" />
        </>
      )}

      {/* Value text */}
      <text
        x={CX} y={CY - 10}
        textAnchor="middle"
        fill={loading ? '#475569' : color}
        fontSize="15"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        {displayValue}
      </text>

      {/* Min label */}
      <text x="14" y="116" fill="#334155" fontSize="8.5" textAnchor="middle" fontFamily="monospace">
        {format(min)}
      </text>

      {/* Max label */}
      <text x="186" y="116" fill="#334155" fontSize="8.5" textAnchor="middle" fontFamily="monospace">
        {format(max)}
      </text>
    </svg>
  )
}
