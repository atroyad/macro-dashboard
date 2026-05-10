import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Section, Denominator, AppState, DenominatorPrices } from '../types'

const AppContext = createContext<AppState | null>(null)

const DEFAULT_DENOM_PRICES: DenominatorPrices = {
  Gold: 3300,
  Oil: 75,
  BTC: 95000,
  CNY: 7.25,
  EUR: 0.92,
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [section, setSection] = useState<Section>('overview')
  const [denominator, setDenominator] = useState<Denominator>('USD')
  const [fredApiKey, setFredApiKeyState] = useState<string>(
    () => localStorage.getItem('fredApiKey') ?? ''
  )
  const [denominatorPrices, setDenominatorPrices] = useState<DenominatorPrices>(DEFAULT_DENOM_PRICES)

  const setFredApiKey = useCallback((k: string) => {
    setFredApiKeyState(k)
    localStorage.setItem('fredApiKey', k)
  }, [])

  // Fetch live denominator prices from public APIs (no key needed)
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // CoinGecko for BTC, gold, oil proxies (free, no key)
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,gold,crude-oil&vs_currencies=usd'
        )
        if (res.ok) {
          const data = await res.json()
          setDenominatorPrices((prev) => ({
            ...prev,
            BTC: data.bitcoin?.usd ?? prev.BTC,
            Gold: data.gold?.usd ?? prev.Gold,
            Oil: data['crude-oil']?.usd ?? prev.Oil,
          }))
        }
      } catch {
        // Use defaults silently
      }
    }
    fetchPrices()
    // Refresh every 5 minutes
    const interval = setInterval(fetchPrices, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <AppContext.Provider
      value={{
        section,
        denominator,
        fredApiKey,
        denominatorPrices,
        setSection,
        setDenominator,
        setFredApiKey,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
