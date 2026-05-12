// Fetches weekly OHLC history from Yahoo Finance to compute all-time high (ATH)
// in the requested range. Used for % from ATH gauges.

import { useState, useEffect, useRef } from 'react'

const PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
]

interface HistoryResult {
  ath: number | null       // highest weekly high in the range
  athDate: string | null   // ISO date (YYYY-MM-DD) of that high
  loading: boolean
  error: string | null
}

const cache = new Map<string, { ath: number | null; athDate: string | null }>()

export function useYahooHistory(symbol: string, range = '5y'): HistoryResult {
  const [ath, setAth] = useState<number | null>(null)
  const [athDate, setAthDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!symbol) return

    const cacheKey = `${symbol}::${range}`
    if (cache.has(cacheKey)) {
      const c = cache.get(cacheKey)!
      setAth(c.ath)
      setAthDate(c.athDate)
      return
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    setLoading(true)
    setError(null)

    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
      `?interval=1wk&range=${range}&includePrePost=false`

    async function run() {
      let lastError: Error = new Error('All proxies failed')
      for (const proxy of PROXIES) {
        try {
          const res = await fetch(proxy + encodeURIComponent(url), { signal })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const json = await res.json()
          const r = json?.chart?.result?.[0]
          if (!r) throw new Error('No result')

          const timestamps: number[]            = r.timestamp || []
          const highs: (number | null)[]        = r.indicators?.quote?.[0]?.high || []
          const closes: (number | null)[]       = r.indicators?.quote?.[0]?.close || []

          if (highs.length === 0 && closes.length === 0) throw new Error('No price data')

          // Use highs where available, fall back to closes
          const prices = highs.length > 0 ? highs : closes

          let maxVal = -Infinity
          let maxIdx = 0
          prices.forEach((p, i) => {
            if (p !== null && p > maxVal) {
              maxVal = p
              maxIdx = i
            }
          })

          const ts = timestamps[maxIdx]
          const date = ts ? new Date(ts * 1000).toISOString().slice(0, 10) : null

          const entry = { ath: maxVal > 0 ? maxVal : null, athDate: date }
          cache.set(cacheKey, entry)
          setAth(entry.ath)
          setAthDate(entry.athDate)
          setLoading(false)
          return
        } catch (e) {
          if ((e as Error).name === 'AbortError') throw e
          lastError = e as Error
        }
      }
      throw lastError
    }

    run().catch((e: Error) => {
      if (e.name !== 'AbortError') {
        setError(e.message)
        setLoading(false)
      }
    })

    return () => abortRef.current?.abort()
  }, [symbol, range])

  return { ath, athDate, loading, error }
}
