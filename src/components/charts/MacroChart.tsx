import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import type { FREDObservation } from '../../types'
import { useApp } from '../../context/AppContext'

interface MacroChartProps {
  data: FREDObservation[]
  label: string
  color?: string
  unit?: string
  denominate?: boolean
  type?: 'area' | 'line'
  yDomain?: [number | 'auto', number | 'auto']
  refLine?: number
  refLabel?: string
}

const COLORS = [
  '#00d4aa',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#22c55e',
]

function formatDate(date: string) {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

function formatValue(v: number, unit?: string) {
  if (unit === '%') return `${v.toFixed(2)}%`
  if (unit === 'B') return `$${(v / 1000).toFixed(1)}T`
  if (unit === 'T') return `$${v.toFixed(2)}T`
  if (unit === 'M') return `$${(v / 1e6).toFixed(2)}T`
  if (unit === '$') return `$${v.toLocaleString()}`
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
  unit,
  denomLabel,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
  unit?: string
  denomLabel?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-elevated border border-bg-border rounded-lg p-3 text-xs shadow-xl">
      <p className="text-text-secondary mb-1">{formatDate(label ?? '')}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-mono font-medium">{formatValue(p.value, unit)}</span>
          {denomLabel && <span className="text-text-muted"> / {denomLabel}</span>}
        </p>
      ))}
    </div>
  )
}

export function MacroChart({
  data,
  label,
  color = '#00d4aa',
  unit,
  denominate = false,
  type = 'area',
  yDomain,
  refLine,
  refLabel,
}: MacroChartProps) {
  const { denominator, denominatorPrices } = useApp()

  const denomPrice =
    denominate && denominator !== 'USD'
      ? denominatorPrices[denominator as keyof typeof denominatorPrices]
      : 1
  const denomLabel = denominate && denominator !== 'USD' ? denominator : undefined

  const chartData = data.map((d) => ({
    date: d.date,
    value: denomPrice > 0 ? d.value / denomPrice : d.value,
  }))

  const ChartComponent = type === 'area' ? AreaChart : LineChart

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ChartComponent data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => new Date(v).getFullYear().toString()}
          tick={{ fill: '#475569', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={yDomain}
          tickFormatter={(v) => formatValue(v, unit)}
          tick={{ fill: '#475569', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip unit={unit} denomLabel={denomLabel} />} />
        {refLine !== undefined && (
          <ReferenceLine
            y={refLine}
            stroke="#475569"
            strokeDasharray="4 4"
            label={{ value: refLabel, fill: '#475569', fontSize: 10 }}
          />
        )}
        {type === 'area' ? (
          <Area
            type="monotone"
            dataKey="value"
            name={label}
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#grad-${label})`}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        ) : (
          <Line
            type="monotone"
            dataKey="value"
            name={label}
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        )}
      </ChartComponent>
    </ResponsiveContainer>
  )
}

// Multi-line chart for comparing series
interface MultiLineData {
  date: string
  [key: string]: number | string
}

interface MultiMacroChartProps {
  data: MultiLineData[]
  series: { key: string; label: string; color?: string }[]
  unit?: string
  yDomain?: [number | 'auto', number | 'auto']
  refLine?: number
}

export function MultiMacroChart({
  data,
  series,
  unit,
  yDomain,
  refLine,
}: MultiMacroChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => new Date(v).getFullYear().toString()}
          tick={{ fill: '#475569', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={yDomain}
          tickFormatter={(v) => (unit === '%' ? `${v}%` : v.toFixed(1))}
          tick={{ fill: '#475569', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <Tooltip
          contentStyle={{
            background: '#15151f',
            border: '1px solid #1e1e2d',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(v) => formatDate(v)}
          formatter={(v: unknown) => [
            unit === '%' ? `${(v as number).toFixed(2)}%` : (v as number).toFixed(2),
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
        />
        {refLine !== undefined && (
          <ReferenceLine y={refLine} stroke="#475569" strokeDasharray="4 4" />
        )}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? COLORS[i % COLORS.length]}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
