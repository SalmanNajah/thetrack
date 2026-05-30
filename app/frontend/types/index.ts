export type FlashData = {
  notice?: string
  alert?: string
}

export type AuthUser = {
  id: number
  email: string
  name: string | null
  admin: boolean
  super_admin: boolean
}

export type Bucket = {
  id: number
  name: string
  slug: string
  balance: string
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
export type AdminUser = {
  id: number
  name: string | null
  email: string
  currency: string
  currency_symbol: string
  admin: boolean
  super_admin: boolean
  onboarded: boolean
  email_verified: boolean
  created_at: string
  buckets_count: number
  transactions_count: number
  total_balance: string
}

export type AdminUserSummary = {
  id: number
  name: string | null
  email: string
  currency: string
  admin: boolean
  created_at: string
  buckets_count: number
  transactions_count: number
}

export type AdminStats = {
  total_users: number
  new_users_7d: number
  total_transactions: number
  total_volume: string
  active_users_7d: number
}

export type AdminTransaction = {
  id: number
  description: string | null
  amount: string
  occurred_at: string
  transfer_group_id: string | null
  user_email: string
  user_id: number
  bucket_name: string
  bucket_id: number
  created_at: string
}

export type AdminBucket = {
  id: number
  name: string
  slug: string
  balance: string
  transactions_count: number
}

export type PaginationData = {
  page: number
  per_page: number
  total: number
  total_pages: number
}

