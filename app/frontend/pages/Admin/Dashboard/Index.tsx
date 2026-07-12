import { usePage, Link } from '@inertiajs/react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../AdminLayout'
import type { AdminStats, AdminUserSummary, AuthUser } from '@/types'

type PageProps = {
  auth: { user: AuthUser }
  flash: { notice: string | null; alert: string | null }
  stats: AdminStats
  recent_users: AdminUserSummary[]
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Index() {
  const { flash, stats, recent_users } = usePage<PageProps>().props

  useEffect(() => {
    if (flash?.notice) toast.success(flash.notice, { id: 'flash-notice', action: undefined })
    if (flash?.alert) toast.error(flash.alert, { id: 'flash-alert' })
  }, [flash?.notice, flash?.alert])

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <h1 className="text-xl font-semibold text-[#1a1a1a] tracking-tight">Dashboard</h1>
        <p className="mt-1 text-[13px] text-[#999]">Platform overview</p>

        <div className="mt-6 rounded-md border border-[#e0dbd2] bg-white">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-[#f0ede7]">
            <div className="p-4">
              <p className="text-[12px] font-medium text-[#777]">Total users</p>
              <p className="mt-1.5 text-2xl font-semibold text-[#1a1a1a] tracking-tight">{stats.total_users}</p>
              <p className="text-[11px] text-[#bbb] mt-0.5">+{stats.new_users_7d} registered this week</p>
            </div>
            <div className="p-4">
              <p className="text-[12px] font-medium text-[#777]">Active users (DAU)</p>
              <p className="mt-1.5 text-2xl font-semibold text-[#1a1a1a] tracking-tight">{stats.active_users_24h}</p>
              <p className="text-[11px] text-[#bbb] mt-0.5">{stats.active_users_rate}% active rate</p>
            </div>
            <div className="p-4">
              <p className="text-[12px] font-medium text-[#777]">Onboarded users</p>
              <p className="mt-1.5 text-2xl font-semibold text-[#1a1a1a] tracking-tight">{stats.onboarded_users}</p>
              <p className="text-[11px] text-[#bbb] mt-0.5">{stats.onboarded_rate}% completion rate</p>
            </div>
            <div className="p-4">
              <p className="text-[12px] font-medium text-[#777]">Total buckets</p>
              <p className="mt-1.5 text-2xl font-semibold text-[#1a1a1a] tracking-tight">{stats.total_buckets}</p>
              <p className="text-[11px] text-[#bbb] mt-0.5">Avg. {stats.avg_buckets} per user</p>
            </div>
            <div className="p-4">
              <p className="text-[12px] font-medium text-[#777]">Total transactions</p>
              <p className="mt-1.5 text-2xl font-semibold text-[#1a1a1a] tracking-tight">{stats.total_transactions.toLocaleString()}</p>
              <p className="text-[11px] text-[#bbb] mt-0.5">Avg. {stats.avg_transactions} per user</p>
            </div>
            <div className="p-4">
              <p className="text-[12px] font-medium text-[#777]">New transactions (7d)</p>
              <p className="mt-1.5 text-2xl font-semibold text-[#1a1a1a] tracking-tight">{stats.new_transactions_7d.toLocaleString()}</p>
              <p className="text-[11px] text-[#bbb] mt-0.5">
                {stats.transactions_growth_rate >= 0 ? '+' : ''}{stats.transactions_growth_rate}% week-over-week
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-semibold text-[#555]">
              Recent signups
            </h2>
            <Link
              href="/admin/users"
              className="text-[12px] text-[#777] hover:text-[#333] transition-colors"
            >
              View all →
            </Link>
          </div>

          <div className="rounded-md border border-[#e0dbd2] bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#eee]">
                  <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#666]">User</th>
                  <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#666] hidden sm:table-cell">Currency</th>
                  <th className="px-4 py-2.5 text-right text-[12px] font-semibold text-[#666] hidden md:table-cell">Buckets</th>
                  <th className="px-4 py-2.5 text-right text-[12px] font-semibold text-[#666] hidden md:table-cell">Txns</th>
                  <th className="px-4 py-2.5 text-right text-[12px] font-semibold text-[#666]">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recent_users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[#f5f5f5] last:border-0 hover:bg-[#faf8f5] transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/users/${user.id}`} className="group">
                        <p className="text-[13px] text-[#333] group-hover:text-black transition-colors">
                          {user.name || '—'}
                          {user.admin && (
                            <span className="ml-1.5 inline-flex items-center rounded bg-[#f0edf9] px-1.5 py-0.5 text-[10px] font-medium text-[#7c5cbf]">
                              Admin
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-[#aaa] font-mono">{user.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-[#777] hidden sm:table-cell">{user.currency}</td>
                    <td className="px-4 py-2.5 text-right text-[12px] text-[#777] font-mono hidden md:table-cell">{user.buckets_count}</td>
                    <td className="px-4 py-2.5 text-right text-[12px] text-[#777] font-mono hidden md:table-cell">{user.transactions_count}</td>
                    <td className="px-4 py-2.5 text-right text-[12px] text-[#aaa]">{formatRelativeDate(user.created_at)}</td>
                  </tr>
                ))}
                {recent_users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-[#bbb]">
                      No users yet
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
