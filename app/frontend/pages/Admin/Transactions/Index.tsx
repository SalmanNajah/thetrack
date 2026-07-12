import { usePage, router, Link } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../AdminLayout'
import { Pagination } from '@/components/Pagination'
import type { AdminTransaction, PaginationData, AuthUser } from '@/types'
import { Search, ArrowLeftRight } from 'lucide-react'
import { isRedacted } from '@/lib/format'
import { RedactBar } from '@/components/RedactBar'

type PageProps = {
  auth: { user: AuthUser }
  flash: { notice: string | null; alert: string | null }
  transactions: AdminTransaction[]
  pagination: PaginationData
  search: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function Index() {
  const { flash, transactions, pagination, search: initialSearch } = usePage<PageProps>().props
  const [searchInput, setSearchInput] = useState(initialSearch)

  useEffect(() => {
    if (flash?.notice) toast.success(flash.notice, { id: 'flash-notice', action: undefined })
    if (flash?.alert) toast.error(flash.alert, { id: 'flash-alert' })
  }, [flash?.notice, flash?.alert])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== initialSearch) {
        router.get('/admin/transactions', { search: searchInput, page: 1 }, {
          preserveState: true,
          replace: true,
        })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[#1a1a1a] tracking-tight">Transactions</h1>
            <p className="mt-1 text-[13px] text-[#999]">
              {pagination.total.toLocaleString()} total transactions
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#bbb]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by user email…"
              className="w-full sm:w-72 rounded-md border border-[#e0dbd2] bg-white pl-10 pr-4 py-2 text-[13px] text-[#333] placeholder:text-[#bbb] focus:outline-none focus:border-[#999] focus:ring-1 focus:ring-[#ddd] transition-all"
            />
          </div>
        </div>

        <div className="mt-5 rounded-md border border-[#e0dbd2] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#eee]">
                  <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#666]">Description</th>
                  <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#666] hidden sm:table-cell">User</th>
                  <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#666] hidden md:table-cell">Bucket</th>
                  <th className="px-4 py-2.5 text-right text-[12px] font-semibold text-[#666]">Amount</th>
                  <th className="px-4 py-2.5 text-right text-[12px] font-semibold text-[#666] hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => {
                  const isAmtRedacted = isRedacted(txn.amount)
                  const amount = isAmtRedacted ? 0 : parseFloat(txn.amount)
                  const isPositive = amount > 0
                  const isTransfer = !!txn.transfer_group_id
                  return (
                    <tr
                      key={txn.id}
                      className="border-b border-[#f5f5f5] last:border-0 hover:bg-[#faf8f5] transition-colors group"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {isTransfer && !isRedacted(txn.description || "") && <ArrowLeftRight className="size-3 text-[#ccc] shrink-0" />}
                          {isRedacted(txn.description || "") ? (
                            <RedactBar width="w-24" height="h-3" />
                          ) : (
                            <span className={`text-[13px] text-[#333] truncate max-w-[200px] ${txn.reversed ? "line-through text-[#999]" : ""}`}>
                              {txn.description || (isTransfer ? "Transfer" : "Transaction")}
                            </span>
                          )}
                          {txn.reversed && (
                            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 border border-amber-500/20 shrink-0">
                              Reversed
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#ccc] mt-0.5 font-mono">#{txn.id}</p>
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <Link
                          href={`/admin/users/${txn.user_id}`}
                          className="text-[12px] text-[#999] hover:text-[#333] transition-colors font-mono"
                        >
                          {txn.user_email}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-[#999] hidden md:table-cell">
                        {txn.bucket_name}
                      </td>
                      <td className={`px-4 py-2.5 text-right text-[13px] font-mono ${
                        isAmtRedacted ? "text-[#bbb]" : txn.reversed ? "line-through text-[#999]" : isPositive ? "text-emerald-600" : "text-[#c05050]"
                      }`}>
                        {isAmtRedacted ? (
                          <RedactBar width="w-12" height="h-3" />
                        ) : (
                          `${isPositive ? "+" : ""}${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[12px] text-[#aaa] hidden lg:table-cell">
                        {formatDate(txn.occurred_at)}
                      </td>
                    </tr>
                  )
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-[13px] text-[#bbb]">
                      {initialSearch ? `No transactions for "${initialSearch}"` : 'No transactions yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4">
          <Pagination pagination={pagination} baseUrl="/admin/transactions" search={searchInput} />
        </div>
      </div>
    </AdminLayout>
  )
}
