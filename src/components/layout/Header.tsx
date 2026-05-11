import { useState } from 'react'
import { Settings, Menu, ChevronRight } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import type { Denominator } from '../../types'
import { SettingsModal } from '../SettingsModal'

const DENOMINATORS: { id: Denominator; label: string; symbol: string }[] = [
  { id: 'USD', label: 'USD', symbol: '$' },
  { id: 'Gold', label: 'Gold', symbol: 'oz' },
  { id: 'Oil', label: 'Oil', symbol: 'bbl' },
  { id: 'BTC', label: 'BTC', symbol: '₿' },
  { id: 'CNY', label: 'CNY', symbol: '¥' },
  { id: 'EUR', label: 'EUR', symbol: '€' },
]

const SECTION_LABELS: Record<string, string> = {
  overview: 'Overview',
  liquidity: 'Global Liquidity & Credit',
  commodities: 'Commodities',
  'fiat-credit': 'Fiat Credit & Rates',
  'central-banks': 'Central Banks',
  'us-fiscal': 'US Fiscal & Debt',
  currencies: 'Currencies & FX',
  crypto: 'Crypto',
  equities: 'Equities & Volatility',
}

interface HeaderProps {
  onToggleSidebar: () => void
  sidebarExpanded: boolean
}

export function Header({ onToggleSidebar, sidebarExpanded }: HeaderProps) {
  const { denominator, setDenominator, section } = useApp()
  const [showSettings, setShowSettings] = useState(false)
  const now = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  return (
    <>
      <header className="h-12 bg-bg-card border-b border-bg-border flex items-center px-4 gap-3 shrink-0">
        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="text-text-muted hover:text-text-secondary transition-colors"
        >
          {sidebarExpanded ? <ChevronRight size={18} /> : <Menu size={18} />}
        </button>

        {/* Breadcrumb */}
        <div className="text-sm text-text-secondary font-medium">
          {SECTION_LABELS[section] ?? section}
        </div>

        <div className="flex-1" />

        {/* Denominator switcher */}
        <div className="flex items-center gap-1 bg-bg-base rounded-lg p-0.5 border border-bg-border">
          <span className="text-xs text-text-muted pl-2 pr-1 hidden sm:block">Price in</span>
          {DENOMINATORS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDenominator(d.id)}
              className={`
                text-xs px-2 py-1 rounded-md font-mono transition-all
                ${denominator === d.id
                  ? 'bg-accent-teal/20 text-accent-teal font-medium'
                  : 'text-text-muted hover:text-text-secondary'
                }
              `}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-text-muted font-mono hidden lg:block">{now}</span>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="text-text-muted hover:text-text-secondary transition-colors ml-1"
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </header>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
