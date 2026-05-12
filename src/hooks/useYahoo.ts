// Yahoo Finance v8 chart API — free, no key required
// Used for symbols not available on FRED: DX-Y.NYB (ICE DXY), ^MOVE, CL=F, BZ=F, etc.

import { useState, useEffect, useRef } from 'react'

const PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
]

interface YahooResult {
  value: number | null
  prev:  number | null
  loading: boolean
  error: string | null
}

const cache = new Map<string, { value: number | null; prev: number | null }>()

export function useYahoo(symbol: string): YahooResult {
  const [value, setValue] = useState<number | null>(null)
  const [prev,  setPrev]  = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!symbol) return

    if (cache.has(symbol)) {
      const c = cache.get(symbol)!
      setValue(c.value)
      setPrev(c.prev)
      return
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    setLoading(true)
    setError(null)

    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
      `?interval=1d&range=5d&includePrePost=false`

    async function run() {
      let lastError: Error = new Error('All proxies failed')
      for (const proxy of PROXIES) {
        try {
          const res = await fetch(proxy + encodeURIComponent(url), { signal })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const json = await res.json()
          const meta = json?.chart?.result?.[0]?.meta
          if (!meta) throw new Error('No meta in response')

          const v = typeof meta.regularMarketPrice === 'number' ? meta.regularMarketPrice : null
          const p = typeof meta.chartPreviousClose === 'number' ? meta.chartPreviousClose : null
          cache.set(symbol, { value: v, prev: p })
          setValue(v)
          setPrev(p)
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
  }, [symbol])

  return { value, prev, loading, error }
}
