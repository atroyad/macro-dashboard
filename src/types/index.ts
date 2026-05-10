export type Denominator = 'USD' | 'Gold' | 'Oil' | 'BTC' | 'CNY' | 'EUR'

export type Section =
  | 'overview'
  | 'liquidity'
  | 'commodities'
  | 'fixed-income'
  | 'central-banks'
  | 'us-fiscal'
  | 'currencies'
  | 'crypto'
  | 'equities'

export interface FREDObservation {
  date: string
  value: number
}

export interface DenominatorPrices {
  Gold: number
  Oil: number
  BTC: number
  CNY: number
  EUR: number
}

export interface AppState {
  section: Section
  denominator: Denominator
  fredApiKey: string
  denominatorPrices: DenominatorPrices
  setSection: (s: Section) => void
  setDenominator: (d: Denominator) => void
  setFredApiKey: (k: string) => void
}
