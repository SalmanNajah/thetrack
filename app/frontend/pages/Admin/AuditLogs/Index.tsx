import { usePage, router } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../AdminLayout'
import { Pagination } from '@/components/Pagination'
import type { AuditLogEntry, PaginationData, AuthUser } from '@/types'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'

type PageProps = {
  auth: { user: AuthUser }
  flash: { notice: string | null; alert: string | null }
  logs: AuditLogEntry[]
  pagination: PaginationData
  search: string
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago · ${time}`
  if (diffDays < 7) return `${diffDays}d ago · ${time}`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ` · ${time}`
}

function actionBadgeColor(action: string): string {
  if (action.includes('delete')) return 'bg-red-50 text-red-600'
  if (action.includes('update')) return 'bg-amber-50 text-amber-700'
  if (action.includes('create')) return 'bg-emerald-50 text-emerald-700'
  return 'bg-[#f0ede7] text-[#999]'
}

function actionLabel(action: string): string {
  const parts = action.split('.')
  return parts[parts.length - 1].toUpperCase()
}

export default function Index() {
  const { flash, logs, pagination, search: initialSearch } = usePage<PageProps>().props
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    if (flash?.notice) toast.success(flash.notice, { id: 'flash-notice' })
    if (flash?.alert) toast.error(flash.alert, { id: 'flash-alert' })
  }, [flash?.notice, flash?.alert])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== initialSearch) {
        router.get('/admin/audit_logs', { search: searchInput, page: 1 }, {
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
            <h1 className="text-xl font-semibold text-[#1a1a1a] tracking-tight">Audit Logs</h1>
            <p className="mt-1 text-[13px] text-[#999]">
              {pagination.total.toLocaleString()} recorded events
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#bbb]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by email or action…"
              className="w-full sm:w-72 rounded-md border border-[#e0dbd2] bg-white pl-10 pr-4 py-2 text-[13px] text-[#333] placeholder:text-[#bbb] focus:outline-none focus:border-[#999] focus:ring-1 focus:ring-[#ddd] transition-all"
            />
          </div>
        </div>

        <div className="mt-5 rounded-md border border-[#e0dbd2] bg-white overflow-hidden">
          <div className="divide-y divide-[#f5f5f5]">
            {logs.map((log) => {
              const isExpanded = expandedId === log.id
              return (
                <div key={log.id} className="hover:bg-[#faf8f5] transition-colors">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="w-full px-4 py-3 flex items-start gap-3 text-left"
                  >
                    <div className="mt-0.5 shrink-0 text-[#ccc]">
                      {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#333] leading-snug">{log.description}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wide ${actionBadgeColor(log.action)}`}>
                          {actionLabel(log.action)}
                        </span>
                        <span className="text-[11px] text-[#bbb]">{formatTimestamp(log.created_at)}</span>
                        {log.ip_address && (
                          <span className="text-[10px] text-[#ccc] font-mono">
                            {log.ip_address === '::1' || log.ip_address === '127.0.0.1' ? 'localhost' : log.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3 pl-11">
                      <div className="rounded-md bg-[#fafaf8] border border-[#eee] p-3">
                        <p className="text-[10px] font-medium tracking-wider uppercase text-[#aaa] mb-2">Raw Metadata</p>
                        <pre className="text-[11px] text-[#666] font-mono whitespace-pre-wrap break-all leading-relaxed">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                        <div className="mt-3 pt-2 border-t border-[#eee] flex flex-wrap items-center gap-x-6 gap-y-2">
                          <div>
                            <span className="text-[10px] text-[#bbb]">Action: </span>
                            <span className="text-[11px] text-[#777] font-mono">{log.action}</span>
                          </div>
                          {log.actor_email && (
                            <div>
                              <span className="text-[10px] text-[#bbb]">Actor: </span>
                              <span className="text-[11px] text-[#777] font-mono">{log.actor_email}</span>
                            </div>
                          )}
                          {log.target_email && (
                            <div>
                              <span className="text-[10px] text-[#bbb]">Target: </span>
                              <span className="text-[11px] text-[#777] font-mono">{log.target_email}</span>
                            </div>
                          )}
                          {typeof log.metadata?.target_created_at === 'string' && (
                            <div>
                              <span className="text-[10px] text-[#bbb]">Target Joined: </span>
                              <span className="text-[11px] text-[#777] font-mono">
                                {new Date(log.metadata.target_created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {logs.length === 0 && (
              <div className="px-4 py-12 text-center text-[13px] text-[#bbb]">
                {initialSearch ? `No logs matching "${initialSearch}"` : 'No audit logs recorded yet'}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Pagination pagination={pagination} baseUrl="/admin/audit_logs" search={searchInput} />
        </div>
      </div>
    </AdminLayout>
  )
}
