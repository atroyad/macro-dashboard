import { useState } from 'react'
import { X, ExternalLink, Check, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { fredApiKey, setFredApiKey } = useApp()
  const [keyInput, setKeyInput] = useState(fredApiKey)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setFredApiKey(keyInput.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-elevated border border-bg-border rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-bg-border">
          <h2 className="text-base font-semibold text-text-primary">Settings</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-5">
          {/* FRED API Key */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary">
              FRED API Key
            </label>
            <p className="text-xs text-text-muted">
              Required for Federal Reserve economic data (balance sheet, TGA, bank reserves,
              yields, M2, etc.). Free at{' '}
              <a
                href="https://fred.stlouisfed.org/docs/api/api_key.html"
                target="_blank"
                rel="noreferrer"
                className="text-accent-teal hover:underline inline-flex items-center gap-0.5"
              >
                fred.stlouisfed.org
                <ExternalLink size={10} />
              </a>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="e.g. abcdef1234567890abcdef1234567890"
                className="flex-1 bg-bg-card border border-bg-border rounded-lg px-3 py-2 text-sm font-mono text-text-primary placeholder-text-muted outline-none focus:border-accent-teal/50 transition-colors"
              />
              <button
                onClick={handleSave}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  saved
                    ? 'bg-accent-green/20 text-accent-green'
                    : 'bg-accent-teal/20 text-accent-teal hover:bg-accent-teal/30'
                }`}
              >
                {saved ? <Check size={16} /> : 'Save'}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-bg-card border border-bg-border rounded-xl p-4 flex gap-3">
            <AlertCircle size={16} className="text-accent-orange shrink-0 mt-0.5" />
            <div className="text-xs text-text-muted space-y-1">
              <p>Your API key is stored locally in your browser and never sent to any server other than FRED.</p>
              <p>Market data (charts) via TradingView requires no API key.</p>
            </div>
          </div>

          {/* Data Sources */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-text-secondary">Data Sources</p>
            <div className="grid grid-cols-2 gap-1">
              {[
                { name: 'FRED (St. Louis Fed)', status: fredApiKey ? '✓ Connected' : '○ Key needed', ok: !!fredApiKey },
                { name: 'TradingView', status: '✓ Active', ok: true },
                { name: 'CoinGecko', status: '✓ Active', ok: true },
                { name: 'World Bank', status: '✓ Active', ok: true },
              ].map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className={s.ok ? 'text-accent-green' : 'text-text-muted'}>{s.status}</span>
                  <span className="text-text-muted">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-bg-card border border-bg-border text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
