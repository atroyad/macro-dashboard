import { useState, useEffect, useRef } from 'react'
import type { FREDObservation } from '../types'

// FRED API does not set CORS headers, so browser fetches are blocked.
// We route through a CORS proxy with automatic fallback.
const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations'
const PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
]

interface FREDOptions {
  observationStart?: string
  frequency?: 'a' | 'q' | 'm' | 'w' | 'd'
  units?: 'lin' | 'chg' | 'pch' | 'pc1' | 'log'
  limit?: number
}

interface UseFREDResult {
  data: FREDObservation[]
  loading: boolean
  error: string | null
  lastValue: number | null
  prevValue: number | null
}

const cache = new Map<string, FREDObservation[]>()

function buildFredUrl(seriesId: string, apiKey: string, options: FREDOptions): string {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: 'json',
    sort_order: 'asc',
    ...(options.observationStart && { observation_start: options.observationStart }),
    ...(options.frequency && { frequency: options.frequency }),
    ...(options.units && { units: options.units }),
    ...(options.limit && { limit: options.limit.toString() }),
  })
  return `${FRED_BASE}?${params}`
}

function parseObservations(json: { error_code?: number; error_message?: string; observations?: { date: string; value: string }[] }): FREDObservation[] {
  if (json.error_code) throw new Error(`FRED: ${json.error_message}`)
  return (json.observations ?? [])
    .filter((o) => o.value !== '.' && !isNaN(parseFloat(o.value)))
    .map((o) => ({ date: o.date, value: parseFloat(o.value) }))
}

async function fetchFRED(url: string, signal: AbortSignal): Promise<FREDObservation[]> {
  let lastError: Error = new Error('No proxy succeeded')
  for (const proxy of PROXIES) {
    try {
      const res = await fetch(proxy + encodeURIComponent(url), { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      return parseObservations(json)
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e
      lastError = e as Error
    }
  }
  throw lastError
}

export function useFRED(
  seriesId: string,
  apiKey: string,
  options: FREDOptions = {}
): UseFREDResult {
  const [data, setData] = useState<FREDObservation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const optionsKey = JSON.stringify(options)

  useEffect(() => {
    if (!apiKey || !seriesId) {
      setData([])
      return
    }

    const cacheKey = `${seriesId}::${apiKey}::${optionsKey}`
    if (cache.has(cacheKey)) {
      setData(cache.get(cacheKey)!)
      setLoading(false)
      return
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    setLoading(true)
    setError(null)

    const url = buildFredUrl(seriesId, apiKey, options)
    fetchFRED(url, signal)
      .then((parsed) => {
        cache.set(cacheKey, parsed)
        setData(parsed)
        setLoading(false)
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') {
          setError(e.message)
          setData([])
          setLoading(false)
        }
      })

    return () => abortRef.current?.abort()
  }, [seriesId, apiKey, optionsKey])

  const lastValue = data.length > 0 ? data[data.length - 1].value : null
  const prevValue = data.length > 1 ? data[data.length - 2].value : null

  return { data, loading, error, lastValue, prevValue }
}

// One-shot test fetch — used by the Settings modal
export async function testFredKey(apiKey: string): Promise<'ok' | string> {
  const url = buildFredUrl('WALCL', apiKey, { frequency: 'w', limit: 1 })
  const proxied = PROXIES[0] + encodeURIComponent(url)
  try {
    const res = await fetch(proxied)
    if (!res.ok) return `HTTP ${res.status}`
    const json = await res.json()
    if (json.error_code) return json.error_message ?? 'Invalid key'
    if (!json.observations?.length) return 'No data returned'
    return 'ok'
  } catch (e) {
    return (e as Error).message
  }
}
