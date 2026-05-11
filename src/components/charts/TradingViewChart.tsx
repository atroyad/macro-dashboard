import { useEffect, useRef } from 'react'

interface TradingViewChartProps {
  symbol: string
  interval?: string
  height?: number
  studies?: string[]
  hideTopToolbar?: boolean
}

// Monotonically increasing counter — each mount gets a unique DOM id
let widgetCounter = 0

export function TradingViewChart({
  symbol,
  interval = 'W',
  height = 420,
  studies = [],
  hideTopToolbar = false,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Stable per-instance ID: assigned once on first render, never changes
  const idRef = useRef(`tv_${++widgetCounter}`)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Clear any previous widget
    container.innerHTML = ''

    // TradingView needs this class on the inner div AND the outer div to have
    // the matching id so it can locate the container via getElementById.
    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    widgetDiv.style.height = '100%'
    widgetDiv.style.width = '100%'
    container.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    // container_id must match the id attribute on the outer div below
    script.textContent = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(8,8,14,0)',
      gridColor: 'rgba(255,255,255,0.04)',
      hide_top_toolbar: hideTopToolbar,
      hide_legend: false,
      save_image: false,
      enable_publishing: false,
      withdateranges: true,
      studies,
      container_id: idRef.current,
    })
    container.appendChild(script)

    return () => {
      if (container) container.innerHTML = ''
    }
  }, [symbol, interval, hideTopToolbar])

  return (
    <div
      id={idRef.current}          // ← critical: TradingView locates container by this id
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height, width: '100%' }}
    />
  )
}

// Mini sparkline widget
interface TradingViewMiniProps {
  symbol: string
  height?: number
}

export function TradingViewMini({ symbol, height = 180 }: TradingViewMiniProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(`tvm_${++widgetCounter}`)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    widgetDiv.style.height = '100%'
    widgetDiv.style.width = '100%'
    container.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
    script.async = true
    script.textContent = JSON.stringify({
      symbol,
      width: '100%',
      height,
      locale: 'en',
      dateRange: '12M',
      colorTheme: 'dark',
      isTransparent: true,
      autosize: true,
      largeChartUrl: '',
      noTimeScale: false,
    })
    container.appendChild(script)

    return () => {
      if (container) container.innerHTML = ''
    }
  }, [symbol, height])

  return (
    <div
      id={idRef.current}
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height, width: '100%' }}
    />
  )
}

// Market overview ticker tape
export function TickerTape({ symbols }: { symbols: { proName: string; title: string }[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.innerHTML = ''

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js'
    script.async = true
    script.textContent = JSON.stringify({
      symbols,
      showSymbolLogo: false,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      locale: 'en',
    })
    container.appendChild(script)

    return () => {
      if (container) container.innerHTML = ''
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ width: '100%', height: 50 }}
    />
  )
}
