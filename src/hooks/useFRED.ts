import { useState, useEffect, useRef } from 'react'
import type { FREDObservation } from '../types'

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations'

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

export function useFRED(
  seriesId: string,
  apiKey: string,
  options: FREDOptions = {}
): UseFREDResult {
  const [data, setData] = useState<FREDObservation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!apiKey || !seriesId) return

    const cacheKey = `${seriesId}-${apiKey}-${JSON.stringify(options)}`
    if (cache.has(cacheKey)) {
      setData(cache.get(cacheKey)!)
      return
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)

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

    fetch(`${FRED_BASE}?${params}`, { signal: abortRef.current.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`FRED API error ${r.status}`)
        return r.json()
      })
      .then((json) => {
        const parsed: FREDObservation[] = (json.observations ?? [])
          .filter((o: { value: string }) => o.value !== '.' && !isNaN(parseFloat(o.value)))
          .map((o: { date: string; value: string }) => ({
            date: o.date,
            value: parseFloat(o.value),
          }))
        cache.set(cacheKey, parsed)
        setData(parsed)
        setLoading(false)
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          setError(e.message)
          setLoading(false)
        }
      })

    return () => abortRef.current?.abort()
  }, [seriesId, apiKey, JSON.stringify(options)])

  const lastValue = data.length > 0 ? data[data.length - 1].value : null
  const prevValue = data.length > 1 ? data[data.length - 2].value : null

  return { data, loading, error, lastValue, prevValue }
}
