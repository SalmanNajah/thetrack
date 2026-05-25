export type FlashData = {
  notice?: string
  alert?: string
}

export type AuthUser = {
  id: number
  email: string
  name: string | null
}

export type Bucket = {
  id: number
  name: string
  slug: string
  balance: string
  deletable: boolean
}

export type TransactionRecord = {
  id: number
  description: string | null
  amount: string
  occurred_at: string
  transfer_group_id: string | null
  bucket: { id: number; name: string; slug: string }
  paired_bucket?: { id: number; name: string; slug: string } | null
}

export type Currency = "INR" | "USD" | "EUR" | "GBP" | "JPY" | "AED" | "CAD" | "AUD" | "SGD" | "CHF" | "CNY" | "KRW" | "SAR" | "BRL" | "ZAR"

export type CurrencyOption = {
  code: Currency
  symbol: string
  label: string
}

export type SharedProps = {}
