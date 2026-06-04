import { Link, usePage } from '@inertiajs/react'
import { useState } from 'react'
import { Toaster } from 'sonner'
import type { AuthUser } from '@/types'
import { Menu, X, ChevronLeft, LogOut } from 'lucide-react'
import { classNames } from '@/lib/utils'

type AdminLayoutProps = {
  children: React.ReactNode
}

const BASE_NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Transactions', href: '/admin/transactions' },
]

const SUPER_ADMIN_NAV_ITEMS = [
  { label: 'Audit Logs', href: '/admin/audit_logs' },
]

function isActive(href: string, currentPath: string): boolean {
  if (href === '/admin') return currentPath === '/admin'
  return currentPath.startsWith(href)
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { auth } = usePage<{
    auth: { user: AuthUser }
    flash: { notice: string | null; alert: string | null }
  }>().props
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
  const navItems = auth.user.super_admin
    ? [...BASE_NAV_ITEMS, ...SUPER_ADMIN_NAV_ITEMS]
    : BASE_NAV_ITEMS

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-[#1a1a1d] border-r border-[#2a2a2e] transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2e]">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-white tracking-tight">TheTrack</span>
            <span className="text-[10px] font-medium tracking-wider uppercase text-[#8b8b8d] bg-[#2a2a2e] px-1.5 py-0.5 rounded">Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#666] hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href, currentPath)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={classNames(
                  "flex items-center px-3 py-2 text-[13px] font-medium rounded-md transition-all duration-100",
                  active
                    ? "bg-[#2a2a2e] text-white"
                    : "text-[#8b8b8d] hover:text-white hover:bg-[#222225]"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-[#2a2a2e] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-7 rounded-full bg-[#2a2a2e] text-[10px] font-bold text-white uppercase">
              {auth.user.email[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-[#ccc] truncate">
                {auth.user.name || auth.user.email.split('@')[0]}
              </p>
              <p className="text-[10px] text-[#666] truncate">{auth.user.email}</p>
            </div>
          </div>
          <Link
            href="/users/sign_out"
            method="delete"
            as="button"
            className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-[#666] hover:text-[#ccc] hover:bg-[#222225] transition-colors"
          >
            <LogOut className="size-3.5" />
            Log out
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f4f1eb]">
        <header className="flex items-center gap-4 border-b border-[#e0dbd2] bg-[#f4f1eb] px-6 py-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[#999] hover:text-[#333] transition-colors"
          >
            <Menu className="size-5" />
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-[12px] text-[#999] hover:text-[#555] transition-colors"
          >
            <ChevronLeft className="size-3.5" />
            Back to app
          </Link>
          <div className="flex-1" />
          <span className="text-[12px] text-[#999]">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#fff',
            border: '1px solid #e0dbd2',
            color: '#333',
            fontSize: '13px',
          },
        }}
      />
    </div>
  )
}
