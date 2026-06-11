export function isRedacted(value: string | null | undefined): boolean {
  if (!value) return false
  return value === '•••' || value === '[redacted]'
}

export function formatCurrency(amount: string, symbol: string): string {
  if (isRedacted(amount)) return '•••'
  const num = parseFloat(amount)
  const formatted = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  })
  return `${symbol}${formatted}`
}

export function formatBalance(amount: string, symbol: string): string {
  if (isRedacted(amount)) return '•••'
  const num = parseFloat(amount)
  const sign = num > 0 ? '+' : num < 0 ? '-' : ''
  const formatted = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  })
  return `${sign}${symbol}${formatted}`
}

export function formatTxnAmount(amount: string): string {
  if (isRedacted(amount)) return '•••'
  const num = parseFloat(amount)
  const sign = num > 0 ? '+' : ''
  return `${sign}${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function groupByDate<T extends { occurred_at: string }>(items: T[]): [string, T[]][] {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = formatDate(item.occurred_at)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }
  return Array.from(groups.entries())
}

export function getBucketLabel(slug: string): string {
  switch (slug) {
    case 'daily': return 'Left to spend'
    case 'income': return 'Income'
    default: return 'Balance'
  }
}

export function parseAmountWithSuffix(val: string): number {
  if (!val) return 0
  const cleaned = val.trim().replace(/,/g, "")
  const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*(k|m|b|l|cr|lakhs?|crores?|millions?|billions?)$/i)
  if (!match) {
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }
  const num = parseFloat(match[1])
  const suffix = match[2].toLowerCase()
  if (suffix === "k") return num * 1_000
  if (suffix === "m" || suffix === "million" || suffix === "millions") return num * 1_000_000
  if (suffix === "b" || suffix === "billion" || suffix === "billions") return num * 1_000_000_000
  if (suffix === "l" || suffix === "lakh" || suffix === "lakhs") return num * 100_000
  if (suffix === "cr" || suffix === "crore" || suffix === "crores") return num * 10_000_000
  return num
}
