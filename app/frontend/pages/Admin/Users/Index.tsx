import { usePage, router, Link } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../AdminLayout'
import { Pagination } from '@/components/Pagination'
import type { AdminUser, PaginationData, AuthUser } from '@/types'
import { Search } from 'lucide-react'

type PageProps = {
  auth: { user: AuthUser }
  flash: { notice: string | null; alert: string | null }
  users: AdminUser[]
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
  const { flash, users, pagination, search: initialSearch } = usePage<PageProps>().props
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  useEffect(() => {
    if (flash?.notice) toast.success(flash.notice, { id: 'flash-notice' })
    if (flash?.alert) toast.error(flash.alert, { id: 'flash-alert' })
  }, [flash?.notice, flash?.alert])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== initialSearch) {
        router.get('/admin/users', { search: searchInput, page: 1 }, {
          preserveState: true,
          replace: true,
        })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  function handleDelete(userId: number) {
    router.delete(`/admin/users/${userId}`, {
      onFinish: () => setDeleteConfirm(null),
    })
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[#1a1a1a] tracking-tight">Users</h1>
            <p className="mt-1 text-[13px] text-[#999]">
              {pagination.total.toLocaleString()} total users
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#bbb]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by email…"
              className="w-full sm:w-72 rounded-md border border-[#e0dbd2] bg-white pl-10 pr-4 py-2 text-[13px] text-[#333] placeholder:text-[#bbb] focus:outline-none focus:border-[#999] focus:ring-1 focus:ring-[#ddd] transition-all"
            />
          </div>
        </div>

        <div className="mt-5 rounded-md border border-[#e0dbd2] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#eee]">
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium tracking-wider uppercase text-[#aaa]">User</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium tracking-wider uppercase text-[#aaa] hidden sm:table-cell">Currency</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-medium tracking-wider uppercase text-[#aaa] hidden md:table-cell">Balance</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-medium tracking-wider uppercase text-[#aaa] hidden md:table-cell">Buckets</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-medium tracking-wider uppercase text-[#aaa] hidden lg:table-cell">Txns</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium tracking-wider uppercase text-[#aaa] hidden lg:table-cell">Status</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-medium tracking-wider uppercase text-[#aaa]">Joined</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-medium tracking-wider uppercase text-[#aaa] w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[#f5f5f5] last:border-0 hover:bg-[#faf8f5] transition-colors group"
                  >
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/users/${user.id}`} className="block">
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
                    <td className="px-4 py-2.5 text-[12px] text-[#777] hidden sm:table-cell">
                      {user.currency_symbol} {user.currency}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-mono text-[#555] hidden md:table-cell">
                      {user.currency_symbol}{parseFloat(user.total_balance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[12px] text-[#777] font-mono hidden md:table-cell">
                      {user.buckets_count}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[12px] text-[#777] font-mono hidden lg:table-cell">
                      {user.transactions_count}
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${user.email_verified ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        <span className="text-[11px] text-[#aaa]">
                          {user.email_verified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-[12px] text-[#aaa]">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="px-2 py-1 rounded text-[11px] text-[#999] hover:text-[#333] hover:bg-[#f0ede7] transition-all"
                        >
                          View
                        </Link>
                        {!user.admin && (
                          deleteConfirm === user.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="px-2 py-1 rounded text-[11px] font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 rounded text-[11px] text-[#999] hover:text-[#333] transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              className="px-2 py-1 rounded text-[11px] text-[#ccc] hover:text-red-500 hover:bg-red-50 transition-all"
                              title="Delete user"
                            >
                              Delete
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[13px] text-[#bbb]">
                      {initialSearch ? `No users matching "${initialSearch}"` : 'No users yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4">
          <Pagination pagination={pagination} baseUrl="/admin/users" search={searchInput} />
        </div>
      </div>
    </AdminLayout>
  )
}
