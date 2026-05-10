import { useState } from 'react'
import { X, ExternalLink, Check, AlertCircle, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { testFredKey } from '../hooks/useFRED'

interface SettingsModalProps {
  onClose: () => void
}

type TestState = 'idle' | 'testing' | 'ok' | 'error'

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { fredApiKey, setFredApiKey } = useApp()
  const [keyInput, setKeyInput] = useState(fredApiKey)
  const [saved, setSaved] = useState(false)
  const [testState, setTestState] = useState<TestState>('idle')
  const [testMsg, setTestMsg] = useState('')

  const handleSave = async () => {
    const key = keyInput.trim()
    setFredApiKey(key)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)

    if (key) {
      setTestState('testing')
      setTestMsg('')
      const result = await testFredKey(key)
      if (result === 'ok') {
        setTestState('ok')
        setTestMsg('Connected — data will start loading')
      } else {
        setTestState('error')
        setTestMsg(result)
      }
    }
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
              Required for Federal Reserve economic data. Free at{' '}
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
                onChange={(e) => {
                  setKeyInput(e.target.value)
                  setTestState('idle')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="32-character alphanumeric key"
                className="flex-1 bg-bg-card border border-bg-border rounded-lg px-3 py-2 text-sm font-mono text-text-primary placeholder-text-muted outline-none focus:border-accent-teal/50 transition-colors"
              />
              <button
                onClick={handleSave}
                disabled={testState === 'testing'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  saved && testState !== 'error'
                    ? 'bg-accent-green/20 text-accent-green'
                    : 'bg-accent-teal/20 text-accent-teal hover:bg-accent-teal/30'
                } disabled:opacity-50`}
              >
                {testState === 'testing' ? (
                  <Loader size={14} className="animate-spin" />
                ) : saved ? (
                  <Check size={16} />
                ) : (
                  'Save & Test'
                )}
              </button>
            </div>

            {/* Test result */}
            {testState !== 'idle' && (
              <div
                className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
                  testState === 'ok'
                    ? 'bg-accent-green/10 text-accent-green'
                    : testState === 'error'
                    ? 'bg-accent-red/10 text-accent-red'
                    : 'bg-bg-card text-text-muted'
                }`}
              >
                {testState === 'testing' && <Loader size={12} className="animate-spin" />}
                {testState === 'ok' && <Check size={12} />}
                {testState === 'error' && <AlertCircle size={12} />}
                <span>
                  {testState === 'testing' ? 'Testing connection to FRED…' : testMsg}
                </span>
              </div>
            )}
          </div>

          {/* Note about CORS proxy */}
          <div className="bg-bg-card border border-bg-border rounded-xl p-4 flex gap-3">
            <AlertCircle size={16} className="text-accent-orange shrink-0 mt-0.5" />
            <div className="text-xs text-text-muted space-y-1">
              <p>
                Your API key is stored locally in your browser only. FRED data is fetched via{' '}
                <strong className="text-text-secondary">corsproxy.io</strong> (required because
                FRED's API doesn't allow direct browser requests).
              </p>
              <p>TradingView market charts require no API key and load immediately.</p>
            </div>
          </div>

          {/* Data Sources */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-text-secondary">Data Sources</p>
            <div className="grid grid-cols-2 gap-1">
              {[
                {
                  name: 'FRED (St. Louis Fed)',
                  status: testState === 'ok' ? '✓ Connected' : fredApiKey ? '~ Key saved' : '○ Key needed',
                  ok: testState === 'ok' || (!!fredApiKey && testState !== 'error'),
                },
                { name: 'TradingView', status: '✓ Active', ok: true },
                { name: 'CoinGecko', status: '✓ Active', ok: true },
                { name: 'corsproxy.io', status: '✓ Proxy active', ok: true },
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
