// Deribit BTC DVOL — Bitcoin 30-day implied volatility index (equivalent to BVIV)
// Free public REST API; supports browser CORS directly.
// Falls back to CORS proxies if the direct request is blocked.

import { useState, useEffect, useRef } from 'react'

const PROXIES = [
  '',                                      // direct (Deribit supports CORS)
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
]

interface DVOLResult {
  value: number | null
  prev:  number | null
  loading: boolean
  error: string | null
}

// Module-level cache — fetched once per page load
let _cache: { value: number | null; prev: number | null } | null = null
let _promise: Promise<{ value: number | null; prev: number | null }> | null = null

async function fetchDVOL(signal: AbortSignal): Promise<{ value: number | null; prev: number | null }> {
  const now   = Date.now()
  const start = now - 10 * 86400 * 1000   // 10 days back (gives ≥2 daily candles)
  const base  =
    `https://www.deribit.com/api/v2/public/get_volatility_index_data` +
    `?currency=BTC&resolution=86400&start_timestamp=${start}&end_timestamp=${now}`

  let lastError: Error = new Error('All sources failed')

  for (const proxy of PROXIES) {
    const url = proxy ? proxy + encodeURIComponent(base) : base
    try {
      const res = await fetch(url, { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const data: [number, number, number, number, number][] = json?.result?.data
      if (!Array.isArray(data) || data.length < 2) throw new Error('Insufficient DVOL data')

      // data[i] = [timestamp_ms, open, high, low, close]
      const v = data[data.length - 1][4]   // latest close
      const p = data[data.length - 2][4]   // prior close
      return {
        value: typeof v === 'number' ? v : null,
        prev:  typeof p === 'number' ? p : null,
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e
      lastError = e as Error
    }
  }
  throw lastError
}

export function useDeribitDVOL(): DVOLResult {
  const [value,   setValue]   = useState<number | null>(null)
  const [prev,    setPrev]    = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (_cache) {
      setValue(_cache.value)
      setPrev(_cache.prev)
      return
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    setLoading(true)
    setError(null)

    if (!_promise) {
      _promise = fetchDVOL(signal)
    }

    _promise
      .then((c) => {
        _cache = c
        setValue(c.value)
        setPrev(c.prev)
        setLoading(false)
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') {
          _promise = null   // allow retry on next mount
          setError(e.message)
          setLoading(false)
        }
      })

    return () => abortRef.current?.abort()
  }, [])

  return { value, prev, loading, error }
}
