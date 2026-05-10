import { useState, useEffect, useRef } from 'react'
import type { FREDObservation } from '../types'

// FRED API does not set CORS headers, so browser fetches are blocked.
// We route through a lightweight CORS proxy.
const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations'
const PROXY = 'https://corsproxy.io/?' // appended directly before the encoded URL

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

async function fetchFRED(url: string, signal: AbortSignal): Promise<FREDObservation[]> {
  // Try via proxy (required for browser CORS)
  const proxied = PROXY + encodeURIComponent(url)
  const res = await fetch(proxied, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()

  // FRED returns { error_code, error_message } on bad key/series
  if (json.error_code) throw new Error(`FRED: ${json.error_message}`)

  return (json.observations ?? [])
    .filter((o: { value: string }) => o.value !== '.' && !isNaN(parseFloat(o.value)))
    .map((o: { date: string; value: string }) => ({
      date: o.date,
      value: parseFloat(o.value),
    }))
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
  const proxied = PROXY + encodeURIComponent(url)
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
