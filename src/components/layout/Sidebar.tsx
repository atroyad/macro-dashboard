import { useApp } from '../../context/AppContext'
import type { Section } from '../../types'
import {
  LayoutDashboard,
  Droplets,
  BarChart3,
  TrendingUp,
  Building2,
  DollarSign,
  Globe,
  Bitcoin,
  LineChart,
  Activity,
} from 'lucide-react'

interface NavItem {
  id: Section
  label: string
  icon: React.ReactNode
  color: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} />, color: '#00d4aa' },
  { id: 'liquidity', label: 'Liquidity', icon: <Droplets size={18} />, color: '#3b82f6' },
  { id: 'commodities', label: 'Commodities', icon: <BarChart3 size={18} />, color: '#f59e0b' },
  { id: 'fiat-credit', label: 'Fiat Credit', icon: <TrendingUp size={18} />, color: '#8b5cf6' },
  { id: 'central-banks', label: 'Central Banks', icon: <Building2 size={18} />, color: '#ef4444' },
  { id: 'us-fiscal', label: 'US Fiscal', icon: <DollarSign size={18} />, color: '#f59e0b' },
  { id: 'currencies', label: 'Currencies', icon: <Globe size={18} />, color: '#22c55e' },
  { id: 'crypto', label: 'Crypto', icon: <Bitcoin size={18} />, color: '#f59e0b' },
  { id: 'equities', label: 'Equities', icon: <LineChart size={18} />, color: '#3b82f6' },
]

export function Sidebar({ expanded }: { expanded: boolean }) {
  const { section, setSection } = useApp()

  return (
    <aside
      className={`h-full bg-bg-card border-r border-bg-border flex flex-col transition-all duration-200 ${expanded ? 'w-52' : 'w-16'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-bg-border">
        <Activity size={20} className="text-accent-teal shrink-0" />
        {expanded && (
          <span className="text-sm font-semibold text-text-primary whitespace-nowrap">
            Macro Pulse
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = section === item.id
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`
                flex items-center gap-3 px-4 py-2.5 mx-1.5 rounded-lg transition-all text-left w-[calc(100%-12px)]
                ${active
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated/50'
                }
              `}
            >
              <span
                style={{ color: active ? item.color : undefined }}
                className="shrink-0"
              >
                {item.icon}
              </span>
              {expanded && (
                <span className="text-sm whitespace-nowrap font-medium">{item.label}</span>
              )}
              {active && !expanded && (
                <span
                  className="absolute left-0 w-0.5 h-6 rounded-r"
                  style={{ background: item.color }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom indicator */}
      {expanded && (
        <div className="px-4 py-3 border-t border-bg-border">
          <p className="text-xs text-text-muted">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-green mr-1.5 animate-pulse-slow" />
            Live market data
          </p>
        </div>
      )}
    </aside>
  )
}
