import { Link, usePage, router } from '@inertiajs/react'
import { useState, useEffect, FormEvent } from 'react'
import { toast } from 'sonner'
import { BottomNavbar } from '@/components/BottomNavbar'
import { formatCurrency, formatDate } from '@/lib/format'
import { classNames } from '@/lib/utils'
import type { Bucket, TransactionRecord, CurrencyOption, AuthUser } from '@/types'
import { X, ArrowRight, ArrowLeftRight, ArrowUp } from 'lucide-react'

type PageProps = {
  auth: { user: AuthUser }
  flash: { notice: string | null; alert: string | null }
  buckets: Bucket[]
  total_balance: string
  recent_transactions: TransactionRecord[]
  currency_symbol: string
  currency: string
  onboarded: boolean
  currencies: CurrencyOption[]
}

function OnboardingCard({ buckets, currencySymbol }: {
  buckets: Bucket[]
  currencySymbol: string
}) {
  const [dismissed, setDismissed] = useState(false)
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (dismissed) return null

  const incomeBucket = buckets.find(b => b.slug === 'income')
  if (!incomeBucket) return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    setSubmitting(true)
    router.post('/onboarding/set_initial_balances', {
      balances: { [incomeBucket!.id]: amount },
    }, {
      preserveScroll: true,
      onFinish: () => setSubmitting(false),
    })
  }

  function handleSkip() {
    router.post('/onboarding/complete', {}, { preserveScroll: true })
  }

  return (
    <div className="mb-10 rounded-xl border border-dotted border-tt-text-tertiary/30 p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-tt-text-secondary">
          How much do you have right now?
        </p>
        <button onClick={() => setDismissed(true)} className="text-tt-text-tertiary hover:text-tt-text transition-colors">
          <X className="size-3.5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex items-center gap-2 rounded-xl bg-tt-bg border border-tt-border px-3 py-1.5">
          <span className="text-sm text-tt-text-tertiary">{currencySymbol}</span>
          <input
            type="number" min="0" step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            autoFocus
            className="flex-1 border-0 bg-transparent p-1.5 font-mono text-lg tracking-tight text-tt-text placeholder:text-tt-text-tertiary focus:outline-none focus:ring-0"
          />
          <button
            type="submit"
            disabled={submitting || !amount || parseFloat(amount) <= 0}
            className="shrink-0 rounded-lg bg-tt-text p-2 text-tt-bg transition-opacity disabled:opacity-20"
          >
            <ArrowUp className="size-3.5" />
          </button>
        </div>
        <button type="button" onClick={handleSkip} className="mt-2.5 text-[12px] text-tt-text-tertiary hover:text-tt-text transition-colors">
          Skip for now
        </button>
      </form>
    </div>
  )
}

export default function Index() {
  const {
    auth: { user },
    flash,
    buckets,
    total_balance,
    recent_transactions,
    currency_symbol,
    onboarded,
  } = usePage<PageProps>().props

  useEffect(() => {
    if (flash?.notice) toast.success(flash.notice, { id: 'flash-notice' })
    if (flash?.alert) toast.error(flash.alert, { id: 'flash-alert' })
  }, [flash?.notice, flash?.alert])

  return (
    <div className="min-h-screen bg-tt-bg pb-20">
      {/* Header — quiet, minimal */}
      <header className="sticky top-0 z-30 bg-tt-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between px-6 py-5">
          <span className="text-[15px] font-semibold tracking-tight text-tt-text">TheTrack</span>
          <span className="text-[13px] text-tt-text-tertiary">{user.email}</span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-6 pb-20">
        {!onboarded && (
          <OnboardingCard buckets={buckets} currencySymbol={currency_symbol} />
        )}

        {/* Total Balance — the hero, large mono number */}
        <section className="pt-4 pb-12">
          <p className="text-[13px] font-medium tracking-wide uppercase text-tt-text-tertiary">
            Total Balance
          </p>
          <p className="mt-2 font-mono text-[3.25rem] font-semibold leading-none tracking-tighter text-tt-text">
            {formatCurrency(total_balance, currency_symbol)}
          </p>
        </section>

        {/* Buckets — clean rows, not cards */}
        <section className="border-t border-tt-border">
          {buckets.map(bucket => (
            <Link
              key={bucket.id}
              href={`/buckets/${bucket.slug}`}
              className="group flex items-center justify-between border-b border-tt-border-subtle py-5 transition-all duration-150 ease-out active:scale-[0.98] hover:bg-tt-surface/50"
            >
              <span className="text-[15px] text-tt-text-secondary group-hover:text-tt-text transition-colors">
                {bucket.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[15px] font-medium tracking-tight text-tt-text">
                  {formatCurrency(bucket.balance, currency_symbol)}
                </span>
                <ArrowRight className="size-[14px] text-tt-text-tertiary opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </section>

        {/* Recent transactions — clean list */}
        {recent_transactions.length > 0 && (
          <section className="mt-12">
            <p className="mb-4 text-[13px] font-medium tracking-wide uppercase text-tt-text-tertiary">
              Recent
            </p>
            {recent_transactions.map(txn => {
              const amount = parseFloat(txn.amount)
              const isPositive = amount > 0
              const isTransfer = !!txn.transfer_group_id
              return (
                <div
                  key={txn.id}
                  className="flex items-center justify-between border-b border-tt-border-subtle py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {isTransfer && <ArrowLeftRight className="size-3 shrink-0 text-tt-text-tertiary" />}
                      <p className="truncate text-sm text-tt-text">
                        {txn.description || (isTransfer ? 'Transfer' : 'Transaction')}
                      </p>
                    </div>
                    <p className="mt-0.5 text-[12px] text-tt-text-tertiary">
                      {txn.bucket.name} · {formatDate(txn.occurred_at)}
                    </p>
                  </div>
                  <span
                    className={classNames(
                      "ml-4 shrink-0 font-mono text-sm tracking-tight",
                      isPositive ? "text-tt-positive" : "text-tt-negative"
                    )}
                  >
                    {isPositive ? '+' : '-'}{formatCurrency(txn.amount, currency_symbol)}
                  </span>
                </div>
              )
            })}
          </section>
        )}

        {recent_transactions.length === 0 && onboarded && (
          <div className="mt-20 text-center text-sm text-tt-text-tertiary">
            No transactions yet. Tap a bucket to start.
          </div>
        )}
      </main>
      <BottomNavbar />
    </div>
  )
}