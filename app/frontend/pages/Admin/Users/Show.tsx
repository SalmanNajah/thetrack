import { usePage, Link, router } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../AdminLayout'
import type { AdminUser, AdminBucket, AdminTransaction, AuthUser } from '@/types'
import { ArrowLeft, ArrowLeftRight } from 'lucide-react'

type PageProps = {
  auth: { user: AuthUser }
  flash: { notice: string | null; alert: string | null }
  user: AdminUser
  buckets: AdminBucket[]
  recent_transactions: AdminTransaction[]
  total_balance: string
  is_super_admin: boolean
  current_user_id: number
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default function Show() {
  const { flash, user, buckets, recent_transactions, total_balance, is_super_admin, current_user_id } = usePage<PageProps>().props
  const isSelf = user.id === current_user_id
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [promoteConfirm, setPromoteConfirm] = useState(false)

  useEffect(() => {
    if (flash?.notice) toast.success(flash.notice, { id: 'flash-notice' })
    if (flash?.alert) toast.error(flash.alert, { id: 'flash-alert' })
  }, [flash?.notice, flash?.alert])

  function handleDelete() {
    router.delete(`/admin/users/${user.id}`, {
      onFinish: () => setDeleteConfirm(false),
    })
  }

  function handlePromote() {
    router.patch(`/admin/users/${user.id}`, { admin: true }, {
      preserveScroll: true,
      onFinish: () => setPromoteConfirm(false),
    })
  }

  function handleDemote() {
    router.patch(`/admin/users/${user.id}`, { admin: false }, {
      preserveScroll: true,
    })
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#555] transition-colors mb-5"
        >
          <ArrowLeft className="size-3.5" />
          Back to Users
        </Link>

        <div className="rounded-md border border-[#e0dbd2] bg-white p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center size-12 rounded-md bg-[#f0ede7] text-lg font-bold text-[#555] uppercase shrink-0">
                {user.email[0]}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#1a1a1a] tracking-tight">
                  {user.name || 'Unnamed User'}
                </h1>
                <p className="text-[13px] text-[#999] font-mono mt-0.5">{user.email}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {isSelf && (
                    <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 ring-1 ring-sky-200">
                      This is you
                    </span>
                  )}
                  {user.super_admin && (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                      Super Admin
                    </span>
                  )}
                  {user.admin && !user.super_admin && (
                    <span className="rounded bg-[#f0edf9] px-1.5 py-0.5 text-[10px] font-medium text-[#7c5cbf]">
                      Admin
                    </span>
                  )}
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    user.email_verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {user.email_verified ? 'Verified' : 'Unverified'}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    user.onboarded ? 'bg-blue-50 text-blue-700' : 'bg-[#f0ede7] text-[#999]'
                  }`}>
                    {user.onboarded ? 'Onboarded' : 'Not Onboarded'}
                  </span>
                </div>
              </div>
            </div>

            {is_super_admin && !isSelf && !user.super_admin && (
              <div className="flex items-center gap-2 shrink-0">
                {user.admin ? (
                  <button
                    onClick={handleDemote}
                    className="px-3 py-1.5 rounded-md border border-amber-200 text-[12px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition-all"
                  >
                    Remove Admin
                  </button>
                ) : (
                  promoteConfirm ? (
                    <div className="flex items-center gap-2 bg-[#f0edf9] rounded-md px-3 py-2 border border-[#e0daf5]">
                      <span className="text-[12px] text-[#7c5cbf]">Grant admin access?</span>
                      <button
                        onClick={handlePromote}
                        className="px-2.5 py-1 rounded text-[11px] font-medium bg-[#7c5cbf] text-white hover:bg-[#6b4eaa] transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setPromoteConfirm(false)}
                        className="px-2 py-1 rounded text-[11px] text-[#999] hover:text-[#555] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPromoteConfirm(true)}
                      className="px-3 py-1.5 rounded-md border border-[#e0dbd2] text-[12px] text-[#777] hover:text-[#333] hover:border-[#ccc] transition-all"
                    >
                      Make Admin
                    </button>
                  )
                )}

                {deleteConfirm ? (
                  <div className="flex items-center gap-2 bg-red-50 rounded-md px-3 py-2 border border-red-100">
                    <span className="text-[12px] text-red-600">Delete this user and all their data?</span>
                    <button
                      onClick={handleDelete}
                      className="px-2.5 py-1 rounded text-[11px] font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="px-2 py-1 rounded text-[11px] text-[#999] hover:text-[#555] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="px-3 py-1.5 rounded-md border border-red-200 text-[12px] text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-all"
                  >
                    Delete User
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-[#eee]">
            <div>
              <p className="text-[10px] font-medium tracking-wider uppercase text-[#aaa]">Balance</p>
              <p className="text-[14px] font-mono text-[#333] mt-0.5">
                {user.currency_symbol}{parseFloat(total_balance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-wider uppercase text-[#aaa]">Currency</p>
              <p className="text-[14px] text-[#333] mt-0.5">{user.currency_symbol} {user.currency}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-wider uppercase text-[#aaa]">Transactions</p>
              <p className="text-[14px] text-[#333] mt-0.5 font-mono">{user.transactions_count}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-wider uppercase text-[#aaa]">Joined</p>
              <p className="text-[14px] text-[#333] mt-0.5">{formatDate(user.created_at)}</p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <h2 className="text-[12px] font-medium tracking-wider uppercase text-[#999] mb-3">
            Buckets ({buckets.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {buckets.map((bucket) => (
              <div
                key={bucket.id}
                className="rounded-md border border-[#e0dbd2] bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-[#333]">{bucket.name}</p>
                    <p className="text-[11px] text-[#bbb] font-mono mt-0.5">{bucket.slug}</p>
                  </div>
                  {!bucket.deletable && (
                    <span className="text-[9px] font-medium tracking-wider uppercase text-[#aaa] bg-[#f0ede7] rounded px-1.5 py-0.5">
                      System
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <p className="text-lg font-semibold font-mono text-[#333] tracking-tight">
                    {user.currency_symbol}{parseFloat(bucket.balance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-[#bbb]">{bucket.transactions_count} txns</p>
                </div>
              </div>
            ))}
            {buckets.length === 0 && (
              <p className="text-[13px] text-[#bbb] col-span-full py-6 text-center">No buckets</p>
            )}
          </div>
        </div>

        <div className="mt-5">
          <h2 className="text-[12px] font-medium tracking-wider uppercase text-[#999] mb-3">
            Recent Transactions ({recent_transactions.length})
          </h2>
          <div className="rounded-md border border-[#e0dbd2] bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#eee]">
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium tracking-wider uppercase text-[#aaa]">Description</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium tracking-wider uppercase text-[#aaa] hidden sm:table-cell">Bucket</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-medium tracking-wider uppercase text-[#aaa]">Amount</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-medium tracking-wider uppercase text-[#aaa] hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent_transactions.map((txn) => {
                  const amount = parseFloat(txn.amount)
                  const isPositive = amount > 0
                  const isTransfer = !!txn.transfer_group_id
                  return (
                    <tr
                      key={txn.id}
                      className="border-b border-[#f5f5f5] last:border-0 hover:bg-[#faf8f5] transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {isTransfer && <ArrowLeftRight className="size-3 text-[#ccc] shrink-0" />}
                          <span className="text-[13px] text-[#333] truncate">
                            {txn.description || (isTransfer ? 'Transfer' : 'Transaction')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-[#999] hidden sm:table-cell">{txn.bucket_name}</td>
                      <td className={`px-4 py-2.5 text-right text-[13px] font-mono ${
                        isPositive ? 'text-emerald-600' : 'text-[#c05050]'
                      }`}>
                        {isPositive ? '+' : ''}{amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[12px] text-[#aaa] hidden sm:table-cell">
                        {formatShortDate(txn.occurred_at)}
                      </td>
                    </tr>
                  )
                })}
                {recent_transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[13px] text-[#bbb]">
                      No transactions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
