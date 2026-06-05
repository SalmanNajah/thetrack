import { useState, useEffect, useRef, FormEvent } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeftRight, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format'
import type { Bucket } from '@/types'

export function TransferDialog({
  buckets,
  currencySymbol,
  defaultFromBucketId,
  size = 'default',
}: {
  buckets: Bucket[]
  currencySymbol: string
  defaultFromBucketId?: string
  size?: 'default' | 'sm'
}) {
  const [open, setOpen] = useState(false)
  const [fromBucketId, setFromBucketId] = useState('')
  const [toBucketId, setToBucketId] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      if (defaultFromBucketId) {
        setFromBucketId(defaultFromBucketId)
        const other = buckets.find(b => b.id.toString() !== defaultFromBucketId)
        if (other) setToBucketId(other.id.toString())
      } else {
        const income = buckets.find(b => b.slug === 'income') || buckets[0]
        const daily = buckets.find(b => b.slug === 'daily') || buckets[1] || buckets[0]
        
        if (income) setFromBucketId(income.id.toString())
        if (daily && daily.id !== income?.id) {
          setToBucketId(daily.id.toString())
        } else {
          const other = buckets.find(b => b.id !== income?.id)
          if (other) setToBucketId(other.id.toString())
        }
      }
      setAmount('')
    }
  }, [open, buckets, defaultFromBucketId])

  useEffect(() => {
    if (open && amountRef.current) {
      setTimeout(() => amountRef.current?.focus(), 100)
    }
  }, [open])

  const fromBucket = buckets.find(b => b.id.toString() === fromBucketId)
  const toBucket = buckets.find(b => b.id.toString() === toBucketId)

  const fromOptions = buckets
  const toOptions = buckets.filter(b => b.id.toString() !== fromBucketId)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0 || !fromBucketId || !toBucketId) return
    setSubmitting(true)

    router.post('/transactions/transfer', {
      from_bucket_id: parseInt(fromBucketId),
      to_bucket_id: parseInt(toBucketId),
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

  function handleSwap() {
    const temp = fromBucketId
    setFromBucketId(toBucketId)
    setToBucketId(temp)
  }

  const isSm = size === 'sm'
  const buttonClass = isSm
    ? "flex items-center gap-1.2 rounded-xl border border-tt-border bg-tt-surface px-2.5 py-1 text-[11px] font-semibold text-tt-text-secondary hover:text-tt-text hover:border-tt-text-tertiary/40 transition-colors focus:outline-none active:scale-[0.97] cursor-pointer gap-2"
    : "flex items-center gap-1.5 rounded-xl border border-tt-border bg-tt-surface px-3.5 py-1.5 text-[13px] font-medium text-tt-text-secondary hover:text-tt-text hover:border-tt-text-tertiary/40 transition-colors focus:outline-none active:scale-[0.97] cursor-pointer gap-2"

  const iconClass = isSm ? "size-3 text-tt-text-tertiary" : "size-3.5 text-tt-text-tertiary"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={buttonClass}>
          <ArrowLeftRight className={iconClass} />
          Transfer
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold">Transfer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="pt-1">
          <div className="relative rounded-2xl border border-tt-border overflow-visible bg-tt-surface">
            <div className="rounded-xl bg-tt-bg px-4 py-3.5">
              <p className="text-[11px] font-medium tracking-wider uppercase text-tt-text-tertiary mb-2">From</p>
              <div className="flex items-center justify-between">
                <Select value={fromBucketId} onValueChange={(val) => {
                  setFromBucketId(val)
                  if (val === toBucketId) {
                    const nextTo = buckets.find(b => b.id.toString() !== val)
                    if (nextTo) setToBucketId(nextTo.id.toString())
                  }
                }}>
                  <SelectTrigger className="w-auto gap-1.5 border-0 bg-transparent p-0 h-auto text-[15px] font-semibold text-tt-text shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fromOptions.map(ob => (
                      <SelectItem key={ob.id} value={ob.id.toString()}>
                        {ob.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-baseline gap-1">
                  <span className="text-tt-text-tertiary text-sm">{currencySymbol}</span>
                  <input
                    ref={amountRef}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-24 border-0 bg-transparent p-0 text-right text-2xl font-semibold tracking-tight text-tt-text placeholder:text-tt-text-tertiary/25 focus:outline-none focus:ring-0"
                  />
                </div>
              </div>
              <p className="text-[11px] text-tt-text-tertiary mt-1.5 text-right">
                available {fromBucket ? formatCurrency(fromBucket.balance, currencySymbol) : `${currencySymbol}0`}
              </p>
            </div>

            <div className="border-t border-tt-border" />

            <div className="rounded-xl bg-tt-bg px-4 py-3.5">
              <p className="text-[11px] font-medium tracking-wider uppercase text-tt-text-tertiary mb-2">To</p>
              <div className="flex items-center justify-between">
                <Select value={toBucketId} onValueChange={setToBucketId}>
                  <SelectTrigger className="w-auto gap-1.5 border-0 bg-transparent p-0 h-auto text-[15px] font-semibold text-tt-text shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {toOptions.map(ob => (
                      <SelectItem key={ob.id} value={ob.id.toString()}>
                        {ob.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-2xl font-semibold tracking-tight text-tt-text-tertiary">
                  {amount && parseFloat(amount) > 0
                    ? formatCurrency(amount, currencySymbol)
                    : `${currencySymbol}0`}
                </span>
              </div>
              <p className="text-[11px] text-tt-text-tertiary mt-1.5 text-right">
                balance {toBucket ? formatCurrency(toBucket.balance, currencySymbol) : `${currencySymbol}0`}
              </p>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <button
                type="button"
                onClick={handleSwap}
                className="flex items-center justify-center size-9 rounded-full border-[3px] border-tt-surface bg-tt-bg text-tt-text-secondary hover:text-tt-text hover:bg-tt-border-subtle transition-all duration-150 active:scale-90 cursor-pointer"
                title="Swap direction"
              >
                <ArrowUpDown className="size-3.5" />
              </button>
            </div>
          </div>
          <Button type="submit" disabled={submitting || !amount || parseFloat(amount) <= 0 || !fromBucketId || !toBucketId} className="w-full mt-4 cursor-pointer">
            {submitting ? 'Transferring…' : 'Transfer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
