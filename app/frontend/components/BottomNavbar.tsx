import { Link, usePage, router } from '@inertiajs/react'
import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { Menu, X, Home, Settings, Plus, Trash2, LogOut, Wallet, Banknote, CircleDollarSign } from 'lucide-react'
import { classNames } from '@/lib/utils'

type NavBucket = { id: number; name: string; slug: string }

function BucketIcon({ slug, className }: { slug: string; className?: string }) {
  switch (slug) {
    case 'income':
      return <Wallet className={className} />
    case 'daily':
      return <Banknote className={className} />
    default:
      return <CircleDollarSign className={className} />
  }
}

export function BottomNavbar({ currentSlug }: { currentSlug?: string }) {
  const { nav_buckets } = usePage<{ nav_buckets: NavBucket[] }>().props
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  if (!nav_buckets?.length) return null

  // Resolve the active navigation label. If we have a currentSlug, use the matching bucket name;
  // otherwise, default to 'Dashboard' (the main summary view).
  const current = nav_buckets.find(b => b.slug === currentSlug)
  const label = current?.name || 'Dashboard'

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
      setAdding(false)
      setNewName('')
      setConfirmDelete(null)
    }
  }, [open])

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus()
  }, [adding])

  function close() {
    setVisible(false)
    setTimeout(() => setOpen(false), 180)
  }

  function handleCreateBucket() {
    const name = newName.trim()
    if (!name) return
    router.post('/buckets', { name }, {
      onFinish: () => { setNewName(''); setAdding(false); close() },
    })
  }

  function handleDeleteBucket(slug: string) {
    router.delete(`/buckets/${slug}`, {
      onFinish: () => { setConfirmDelete(null); close() },
    })
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleCreateBucket()
    if (e.key === 'Escape') { setAdding(false); setNewName('') }
  }

  return (
    <>
      {open && (
        <div
          className={classNames(
            "fixed inset-0 z-42 transition-opacity duration-180",
            visible ? "opacity-100" : "opacity-0"
          )}
          style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
          onClick={close}
        />
      )}

      <div className={classNames(
        "fixed bottom-0 left-0 right-0 z-39 pointer-events-none bg-linear-to-t from-tt-bg via-tt-bg/60 to-transparent transition-all duration-200",
        currentSlug ? "h-48" : "h-28"
      )} />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3">
        {open && (
          <div
            className={classNames(
              "w-60 rounded-2xl border border-tt-border bg-tt-surface shadow-[0_16px_48px_-8px_rgba(0,0,0,0.05),0_6px_16px_-4px_rgba(0,0,0,0.06)] overflow-hidden origin-bottom transition-all duration-220",
              visible
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-[0.92] translate-y-2"
            )}
            style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
          >
            <div className="px-1.5">
              {nav_buckets.map(b => {
                const isActive = b.slug === currentSlug
                const isDeleting = confirmDelete === b.slug

                if (isDeleting) {
                  return (
                    <div key={b.id} className="flex items-center gap-1.5 rounded-xl px-3 py-2 bg-red-50">
                      <span className="flex-1 text-[13px] text-red-600">Delete {b.name}?</span>
                      <button
                        onClick={() => handleDeleteBucket(b.slug)}
                        className="text-[12px] font-medium text-red-600 hover:underline focus:outline-none"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-[12px] text-tt-text-tertiary hover:underline focus:outline-none"
                      >
                        No
                      </button>
                    </div>
                  )
                }

                return (
                  <div
                    key={b.id}
                    className={classNames(
                      "group relative flex items-center rounded-xl my-1.5",
                      isActive
                        ? "bg-tt-bg"
                        : "hover:bg-tt-bg"
                    )}
                  >
                    <Link
                      href={`/buckets/${b.slug}`}
                      onClick={close}
                      className={classNames(
                        "flex flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[14px] focus:outline-none",
                        isActive
                          ? "text-tt-text font-medium"
                          : "text-tt-text-secondary hover:text-tt-text"
                      )}
                    >
                      <BucketIcon
                        slug={b.slug}
                        className={classNames(
                          "size-3.5 shrink-0",
                          isActive ? "text-tt-accent" : "text-tt-text-tertiary"
                        )}
                      />
                      {b.name}
                    </Link>
                    {nav_buckets.length > 1 && (
                      <button
                        onClick={() => setConfirmDelete(b.slug)}
                        className="absolute right-1.5 p-1 rounded-lg text-red-300/60 hover:text-red-600 transition-colors focus:outline-none"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                )
              })}

              {adding ? (
                <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5">
                  <Plus className="size-3.5 shrink-0 text-tt-accent" />
                  <input
                    ref={inputRef}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => { if (!newName.trim()) setAdding(false) }}
                    placeholder="Bucket name…"
                    className="w-full border-0 bg-transparent p-0 text-[14px] text-tt-text placeholder:text-tt-text-tertiary focus:outline-none focus:ring-0"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[14px] text-tt-text-tertiary hover:text-tt-accent hover:bg-tt-bg transition-colors duration-100 focus:outline-none"
                >
                  <Plus className="size-3.5" />
                  Add bucket
                </button>
              )}
            </div>

            <div className="border-t border-tt-border-subtle mx-2" />

            <div className="p-1.5">
              <Link
                href="/dashboard"
                onClick={close}
                className={classNames(
                  "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[14px] transition-colors duration-100 focus:outline-none",
                  !currentSlug
                    ? "text-tt-text font-medium bg-tt-bg"
                    : "text-tt-text-tertiary hover:text-tt-text-secondary hover:bg-tt-bg"
                )}
              >
                <Home className="size-3.5" />
                Dashboard
              </Link>
              <Link
                href="/settings"
                onClick={close}
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[14px] text-tt-text-tertiary hover:text-tt-text-secondary hover:bg-tt-bg transition-colors duration-100 focus:outline-none"
              >
                <Settings className="size-3.5" />
                Settings
              </Link>
              <Link
                href="/users/sign_out"
                method="delete"
                as="button"
                onClick={close}
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[14px] text-tt-text-tertiary hover:text-tt-text-secondary hover:bg-tt-bg transition-colors duration-100 focus:outline-none"
              >
                <LogOut className="size-3.5" />
                Log out
              </Link>
            </div>
          </div>
        )}

        <button
          onClick={() => open ? close() : setOpen(true)}
          className="flex items-center rounded-xl border border-tt-text-tertiary/50 bg-tt-surface text-[15px] text-tt-text-secondary shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-180 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] active:scale-[0.96] focus:outline-none focus-visible:outline-none overflow-hidden"
          style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
        >
          <span className="flex items-center justify-center px-4 py-2.5">
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </span>
          <span
            className="self-stretch w-0"
            style={{
              borderLeft: '1px dashed var(--tt-text-tertiary)',
              opacity: 0.35,
            }}
          />
          <span className="px-5 py-2.5 font-medium">{label}</span>
        </button>
      </div>
      <Toaster position="top-center" richColors />
    </>
  )
}
