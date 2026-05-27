export function formatCurrency(amount: string, symbol: string): string {
  const num = parseFloat(amount)
  const formatted = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  })
  return `${symbol}${formatted}`
}

export function formatBalance(amount: string, symbol: string): string {
  const num = parseFloat(amount)
  const sign = num > 0 ? '+' : num < 0 ? '-' : ''
  const formatted = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  })
  return `${sign}${symbol}${formatted}`
}

export function formatTxnAmount(amount: string): string {
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
