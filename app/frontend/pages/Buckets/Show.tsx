import { Link, usePage, router } from '@inertiajs/react'
import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { BottomNavbar } from '@/components/BottomNavbar'
import {
  formatBalance, formatTxnAmount, formatCurrency, groupByDate, getBucketLabel,
} from '@/lib/format'
import { classNames } from '@/lib/utils'
import type { Bucket, TransactionRecord, AuthUser } from '@/types'
import { ArrowLeft, Pencil, ArrowLeftRight, ChevronDown, ChevronUp, ArrowUp, ArrowUpDown } from 'lucide-react'

type PageProps = {
  auth: { user: AuthUser }
  flash: { notice: string | null; alert: string | null }
  bucket: Bucket
  transactions: TransactionRecord[]
  other_buckets: Bucket[]
  currency_symbol: string
}

function BalanceDisplay({ balance, currencySymbol, bucketId }: {
  balance: string
  currencySymbol: string
  bucketId: number
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function startEdit() {
    setEditValue(parseFloat(balance).toString())
    setEditing(true)
  }

  function commitEdit() {
    setEditing(false)
    const newBalance = parseFloat(editValue)
    if (isNaN(newBalance) || newBalance < 0) return
    if (newBalance.toString() === parseFloat(balance).toString()) return
    router.post('/transactions/adjust_balance', {
      bucket_id: bucketId,
      new_balance: editValue,
    }, { preserveScroll: true })
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-3xl font-semibold text-tt-text-tertiary">{currencySymbol}</span>
        <input
          ref={inputRef}
          type="number" min="0" step="0.01"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="w-52 border-0 border-b border-tt-text bg-transparent p-0 font-mono text-[3.25rem] font-semibold leading-none tracking-tighter text-tt-text caret-tt-accent focus:outline-none focus:ring-0"
        />
      </div>
    )
  }

  return (
    <button onClick={startEdit} className="group relative inline-block text-left" title="Edit balance">
      <span className="font-mono text-[3.25rem] font-semibold leading-none tracking-tighter text-tt-text">
        {formatBalance(balance, currencySymbol)}
      </span>
      <Pencil className="absolute -right-5 bottom-1 size-3.5 text-tt-text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

const StaticBucketDisplay = ({ name, balance, symbol }: { name: string; balance: string; symbol: string }) => (
  <div className="rounded-xl border border-tt-border bg-tt-bg/30 px-3.5 py-2.5 text-sm text-tt-text flex justify-between items-center">
    <span className="font-medium">{name}</span>
    <span className="font-mono text-[13px] text-tt-text-secondary">
      {formatCurrency(balance, symbol)}
    </span>
  </div>
)

const TargetBucketSelect = ({
  value,
  onChange,
  buckets,
  symbol,
}: {
  value: string
  onChange: (v: string) => void
  buckets: Bucket[]
  symbol: string
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
    <SelectContent>
      {buckets.map(b => (
        <SelectItem key={b.id} value={b.id.toString()}>
          {b.name} ({formatCurrency(b.balance, symbol)})
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

function TransferDialog({ bucket, otherBuckets, currencySymbol }: {
  bucket: Bucket
  otherBuckets: Bucket[]
  currencySymbol: string
}) {
  const [open, setOpen] = useState(false)
  const [targetBucketId, setTargetBucketId] = useState(otherBuckets[0]?.id?.toString() || '')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isReversed, setIsReversed] = useState(false)

  // Reset states when opening/closing
  useEffect(() => {
    if (!open) {
      setAmount('')
      setIsReversed(false)
      if (otherBuckets[0]) setTargetBucketId(otherBuckets[0].id.toString())
    }
  }, [open, otherBuckets])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0 || !targetBucketId) return
    setSubmitting(true)

    const fromId = isReversed ? parseInt(targetBucketId) : bucket.id
    const toId = isReversed ? bucket.id : parseInt(targetBucketId)

    router.post('/transactions/transfer', {
      from_bucket_id: fromId,
      to_bucket_id: toId,
      amount,
    }, {
      preserveScroll: true,
      onFinish: () => {
        setSubmitting(false)
        setAmount('')
        setOpen(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-tt-text-tertiary hover:text-tt-text transition-colors" title="Transfer">
          <ArrowLeftRight className="size-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold">Transfer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* FROM BUCKET */}
          <div>
            <p className="text-[13px] text-tt-text-tertiary mb-1.5">From</p>
            {!isReversed ? (
              <StaticBucketDisplay name={bucket.name} balance={bucket.balance} symbol={currencySymbol} />
            ) : (
              <TargetBucketSelect value={targetBucketId} onChange={setTargetBucketId} buckets={otherBuckets} symbol={currencySymbol} />
            )}
          </div>

          {/* SWAP BUTTON */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={() => setIsReversed(!isReversed)}
              className="p-1.5 rounded-full border border-tt-border bg-tt-surface hover:bg-tt-bg text-tt-text-secondary hover:text-tt-text transition-colors shadow-xs active:scale-95"
              title="Swap direction"
            >
              <ArrowUpDown className="size-3.5" />
            </button>
          </div>

          {/* TO BUCKET */}
          <div>
            <p className="text-[13px] text-tt-text-tertiary mb-1.5">To</p>
            {isReversed ? (
              <StaticBucketDisplay name={bucket.name} balance={bucket.balance} symbol={currencySymbol} />
            ) : (
              <TargetBucketSelect value={targetBucketId} onChange={setTargetBucketId} buckets={otherBuckets} symbol={currencySymbol} />
            )}
          </div>

          {/* AMOUNT */}
          <div>
            <p className="text-[13px] text-tt-text-tertiary mb-1.5">Amount</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-tt-text-tertiary">{currencySymbol}</span>
              <Input
                type="number" min="0.01" step="0.01" placeholder="0.00"
                value={amount} onChange={e => setAmount(e.target.value)}
                className="pl-7 font-mono" autoFocus
              />
            </div>
          </div>
          <Button type="submit" disabled={submitting || !amount || parseFloat(amount) <= 0} className="w-full">
            {submitting ? 'Transferring…' : 'Transfer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DateGroup({ date, transactions }: {
  date: string
  transactions: TransactionRecord[]
}) {
  const [collapsed, setCollapsed] = useState(false)
  const total = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0)

  return (
    <div>
      <p className="px-0 pt-6 pb-2 text-[12px] font-medium tracking-wide uppercase text-tt-text-tertiary">
        {date}
      </p>

      {!collapsed && transactions.map(txn => {
        const amount = parseFloat(txn.amount)
        const isPositive = amount > 0
        const isTransfer = !!txn.transfer_group_id

        return (
          <div key={txn.id} className="flex items-center justify-between py-3 border-b border-tt-border-subtle">
            <div className="min-w-0 flex-1 flex items-center gap-1.5">
              {isTransfer && <ArrowLeftRight className="size-3 shrink-0 text-tt-text-tertiary" />}
              <p className="truncate text-sm text-tt-text">
                {txn.description || (isTransfer ? 'Transfer' : 'Transaction')}
              </p>
            </div>
            <span
              className={classNames(
                "ml-4 shrink-0 font-mono text-sm tracking-tight",
                isPositive ? "text-tt-positive" : "text-tt-negative"
              )}
            >
              {formatTxnAmount(txn.amount)}
            </span>
          </div>
        )
      })}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between py-2.5 text-[12px] text-tt-text-tertiary hover:text-tt-text-secondary transition-colors"
      >
        <span>Total</span>
        <span className="flex items-center gap-1 font-mono tracking-tight">
          {total >= 0 ? '+' : ''}{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          {collapsed ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
        </span>
      </button>
    </div>
  )
}

function ChatInput({ bucketId }: { bucketId: number }) {
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit() {
    if (!input.trim() || submitting) return
    setSubmitting(true)
    router.post('/transactions', {
      bucket_id: bucketId,
      raw_input: input.trim(),
    }, {
      preserveScroll: true,
      onFinish: () => { setSubmitting(false); setInput('') },
    })
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-tt-border bg-tt-surface px-4 py-2 shadow-sm">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="200 chai..."
        disabled={submitting}
        className="flex-1 border-0 bg-transparent text-sm text-tt-text placeholder:text-tt-text-tertiary focus:outline-none focus:ring-0"
      />
      <button
        onClick={handleSubmit}
        disabled={submitting || !input.trim()}
        className="shrink-0 rounded-full bg-tt-text p-2 text-tt-bg transition-all duration-150 disabled:opacity-20 disabled:scale-90"
      >
        <ArrowUp className="size-3.5" />
      </button>
    </div>
  )
}


export default function Show() {
  const {
    flash,
    bucket,
    transactions,
    other_buckets,
    currency_symbol,
  } = usePage<PageProps>().props

  useEffect(() => {
    if (flash?.notice) toast.success(flash.notice, { id: 'flash-notice' })
    if (flash?.alert) toast.error(flash.alert, { id: 'flash-alert' })
  }, [flash?.notice, flash?.alert])

  const dateGroups = groupByDate(transactions)

  return (
    <div className="flex min-h-screen flex-col bg-tt-bg pb-20">
      <header className="sticky top-0 z-30 bg-tt-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-[13px] text-tt-text-tertiary hover:text-tt-text transition-colors">
            <ArrowLeft className="size-[14px]" />
            Back
          </Link>
          {other_buckets.length > 0 && (
            <TransferDialog bucket={bucket} otherBuckets={other_buckets} currencySymbol={currency_symbol} />
          )}
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-xl px-6 pb-6">
          <section className="pt-4 pb-10">
            <p className="text-[13px] font-medium tracking-wide uppercase text-tt-text-tertiary">
              {getBucketLabel(bucket.slug)}
            </p>
            <div className="mt-2">
              <BalanceDisplay balance={bucket.balance} currencySymbol={currency_symbol} bucketId={bucket.id} />
            </div>
          </section>

          {dateGroups.length > 0 ? (
            <section>
              {dateGroups.map(([date, txns]) => (
                <DateGroup key={date} date={date} transactions={txns} />
              ))}
            </section>
          ) : (
            <div className="py-20 text-center text-sm text-tt-text-tertiary">
              No transactions yet. 
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-16 left-0 right-0 z-30">
        <div className="mx-auto max-w-xl px-6">
          <ChatInput bucketId={bucket.id} />
        </div>
      </div>

      <BottomNavbar currentSlug={bucket.slug} />
    </div>
  )
}
