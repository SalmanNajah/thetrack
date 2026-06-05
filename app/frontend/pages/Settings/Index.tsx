import { usePage, router, Link, useForm } from '@inertiajs/react'
import { useState, useEffect } from 'react'
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
import type { AuthUser, CurrencyOption } from '@/types'
import { ArrowLeft, Download, FileText, FileSpreadsheet } from 'lucide-react'

type PageProps = {
  auth: { user: AuthUser }
  flash: { notice: string | null; alert: string | null }
  user: {
    email: string
    name: string | null
    currency: string
    unsigned_adds: boolean
    provider: string | null
    created_at: string
  }
  currencies: CurrencyOption[]
  stats: {
    buckets_count: number
    transactions_count: number
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-tt-border-subtle last:border-0">
      <span className="text-sm text-tt-text-secondary">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}

function ProfileSection({ user }: { user: PageProps['user'] }) {
  const [name, setName] = useState(user.name || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  function handleSave() {
    setSaving(true)
    router.post('/settings/update_profile', { name }, {
      preserveScroll: true,
      onFinish: () => { setSaving(false); setEditing(false) },
    })
  }

  return (
    <section>
      <h2 className="text-[13px] font-medium tracking-wide uppercase text-tt-text-tertiary mb-1">
        Account
      </h2>
      <div>
        <Field label="Email">
          <span className="text-sm font-mono text-tt-text">{user.email}</span>
        </Field>
        <Field label="Name">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                autoFocus
                className="w-32 rounded-lg border border-tt-border bg-tt-bg px-2.5 py-1 text-sm text-tt-text text-right focus:outline-none focus:ring-1 focus:ring-tt-accent"
              />
              <button onClick={handleSave} disabled={saving} className="text-[12px] font-medium text-tt-accent">
                {saving ? '…' : 'Save'}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="text-sm text-tt-text border-b border-dashed border-tt-text-tertiary/40 hover:border-tt-accent hover:text-tt-accent cursor-pointer transition-colors">
              {user.name || 'Add name'}
            </button>
          )}
        </Field>
        <Field label="Member since">
          <span className="text-sm text-tt-text-tertiary">{user.created_at}</span>
        </Field>
      </div>
    </section>
  )
}

function CurrencySection({ currentCurrency, currencies }: {
  currentCurrency: string
  currencies: CurrencyOption[]
}) {
  const [saving, setSaving] = useState(false)

  function handleChange(value: string) {
    setSaving(true)
    router.post('/settings/update_currency', { currency: value }, {
      preserveScroll: true,
      onFinish: () => setSaving(false),
    })
  }

  return (
    <section>
      <h2 className="text-[13px] font-medium tracking-wide uppercase text-tt-text-tertiary mb-1">
        Preferences
      </h2>
      <Field label="Currency">
        <Select value={currentCurrency} onValueChange={handleChange} disabled={saving}>
          <SelectTrigger className="w-28 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencies.map(c => (
              <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </section>
  )
}

function SignConventionSection({ unsignedAdds }: { unsignedAdds: boolean }) {
  const [saving, setSaving] = useState(false)

  function handleToggle(value: boolean) {
    setSaving(true)
    router.post('/settings/update_sign_convention', { unsigned_adds: value }, {
      preserveScroll: true,
      onFinish: () => setSaving(false),
    })
  }

  return (
    <section>
      <h2 className="text-[13px] font-medium tracking-wide uppercase text-tt-text-tertiary mb-1">
        Input Behavior
      </h2>
      <div>
        <Field label="Unsigned amounts">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleToggle(false)}
              disabled={saving}
              className={`px-2.5 py-1 text-[12px] font-medium rounded-l-md border transition-all ${
                !unsignedAdds
                  ? 'bg-tt-text text-tt-bg border-tt-text'
                  : 'bg-tt-bg text-tt-text-secondary border-tt-border hover:text-tt-text'
              }`}
            >
              − Subtract
            </button>
            <button
              onClick={() => handleToggle(true)}
              disabled={saving}
              className={`px-2.5 py-1 text-[12px] font-medium rounded-r-md border transition-all ${
                unsignedAdds
                  ? 'bg-tt-text text-tt-bg border-tt-text'
                  : 'bg-tt-bg text-tt-text-secondary border-tt-border hover:text-tt-text'
              }`}
            >
              + Add
            </button>
          </div>
        </Field>
        <p className="text-[11px] text-tt-text-tertiary mt-1.5 leading-relaxed px-0">
          {unsignedAdds
            ? <>Typing <span className="font-mono text-tt-text-secondary">50 chai</span> will <span className="text-tt-positive font-medium">add</span> ₹50. Use <span className="font-mono text-tt-text-secondary">-50</span> to subtract.</>
            : <>Typing <span className="font-mono text-tt-text-secondary">50 chai</span> will <span className="text-tt-negative font-medium">subtract</span> ₹50. Use <span className="font-mono text-tt-text-secondary">+50</span> to add.</>
          }
        </p>
      </div>
    </section>
  )
}

function DangerZone({ stats }: { stats: PageProps['stats'] }) {
  const [resetOpen, setResetOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [processing, setProcessing] = useState(false)

  function handleReset() {
    setProcessing(true)
    router.delete('/settings/reset_all', {
      preserveScroll: true,
      onFinish: () => { setProcessing(false); setResetOpen(false) },
    })
  }

  function handleDelete() {
    if (confirmText !== 'DELETE') return
    setProcessing(true)
    router.delete('/settings/delete_account', {
      onFinish: () => setProcessing(false),
    })
  }

  return (
    <section>
      <h2 className="text-[13px] font-medium tracking-wide uppercase text-tt-negative mb-1">
        Danger Zone
      </h2>
      <div className="rounded-xl border border-dotted border-tt-negative/25 overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-3.5 border-b border-tt-negative/10">
          <div>
            <p className="text-sm text-tt-text">Reset all data</p>
            <p className="text-[12px] text-tt-text-tertiary mt-0.5">
              {stats.transactions_count} transactions · {stats.buckets_count} buckets
            </p>
          </div>
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogTrigger asChild>
              <button className="shrink-0 rounded-lg bg-tt-negative px-3 py-1.5 text-[13px] font-medium text-white hover:bg-tt-negative/85 transition-colors">
                Reset
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-[15px]">Reset all data?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-tt-text-secondary">
                This will permanently delete all your transactions and buckets. Default buckets will be recreated.
              </p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setResetOpen(false)} className="flex-1">Cancel</Button>
                <Button
                  onClick={handleReset}
                  disabled={processing}
                  className="flex-1 bg-tt-negative hover:bg-tt-negative/90 text-white"
                >
                  {processing ? 'Resetting…' : 'Reset everything'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div>
            <p className="text-sm text-tt-text">Delete account</p>
            <p className="text-[12px] text-tt-text-tertiary mt-0.5">This cannot be undone</p>
          </div>
          <Dialog open={deleteOpen} onOpenChange={v => { setDeleteOpen(v); setConfirmText('') }}>
            <DialogTrigger asChild>
              <button className="shrink-0 rounded-lg bg-tt-negative px-3 py-1.5 text-[13px] font-medium text-white hover:bg-tt-negative/85 transition-colors">
                Delete
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-[15px]">Delete your account?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-tt-text-secondary">
                We're sorry to see you go. Once your account is deleted, all your data — buckets, transactions, and settings — will be permanently erased. This action cannot be reversed or recovered.
              </p>
              <p className="text-sm text-tt-text-secondary mt-2">
                Type <span className="font-mono font-medium text-tt-text">DELETE</span> below to confirm.
              </p>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="font-mono"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDeleteOpen(false)} className="flex-1">Cancel</Button>
                <Button
                  onClick={handleDelete}
                  disabled={processing || confirmText !== 'DELETE'}
                  className="flex-1 bg-tt-negative hover:bg-tt-negative/90 text-white"
                >
                  {processing ? 'Deleting…' : 'Delete account'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  )
}

function SecuritySection({ user }: { user: PageProps['user'] }) {
  const [open, setOpen] = useState(false)
  const isGoogleUser = !!user.provider

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    clearErrors()

    post('/settings/update_password', {
      preserveScroll: true,
      onSuccess: () => {
        setOpen(false)
        reset()
      },
    })
  }

  return (
    <section>
      <h2 className="text-[13px] font-medium tracking-wide uppercase text-tt-text-tertiary mb-1">
        Security
      </h2>
      <div>
        <Field label="Password">
          <Dialog open={open} onOpenChange={v => {
            setOpen(v)
            if (!v) {
              reset()
              clearErrors()
            }
          }}>
            <DialogTrigger asChild>
              <button className="text-sm text-tt-text border-b border-dashed border-tt-text-tertiary/40 hover:border-tt-accent hover:text-tt-accent cursor-pointer transition-colors">
                {isGoogleUser ? 'Set password' : 'Change password'}
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-[15px]">
                  {isGoogleUser ? 'Set Account Password' : 'Change Password'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 pt-2">
                {isGoogleUser ? (
                  <p className="text-sm text-tt-text-secondary leading-relaxed">
                    Set a password to enable email & password sign-in alongside Google. Your Google login remains fully active.
                  </p>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-tt-text-secondary mb-1.5">
                      Current Password
                    </label>
                    <Input
                      type="password"
                      value={data.current_password}
                      onChange={e => setData('current_password', e.target.value)}
                      placeholder="••••••••"
                      className={errors.current_password ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    {errors.current_password && (
                      <p className="mt-1.5 text-[11px] font-medium text-red-600 leading-normal">{errors.current_password}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-tt-text-secondary mb-1.5">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={data.password}
                    onChange={e => setData('password', e.target.value)}
                    placeholder="••••••••"
                    className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.password && (
                    <p className="mt-1.5 text-[11px] font-medium text-red-600 leading-normal">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-tt-text-secondary mb-1.5">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={data.password_confirmation}
                    onChange={e => setData('password_confirmation', e.target.value)}
                    placeholder="••••••••"
                    className={errors.password_confirmation ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.password_confirmation && (
                    <p className="mt-1.5 text-[11px] font-medium text-red-600 leading-normal">{errors.password_confirmation}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={processing}
                    className="flex-1 bg-tt-text hover:bg-tt-text/90 text-tt-bg font-medium"
                  >
                    {processing ? 'Saving…' : (isGoogleUser ? 'Set password' : 'Update password')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </Field>
      </div>
    </section>
  )
}

function DataSection() {
  return (
    <section>
      <h2 className="text-[13px] font-medium tracking-wide uppercase text-tt-text-tertiary mb-1">
        Data
      </h2>
      <div>
        <a
          href="/exports/csv"
          className="flex items-center justify-between py-3.5 border-b border-tt-border-subtle hover:bg-tt-bg/50 transition-colors -mx-1 px-1 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="size-4 text-tt-text-tertiary" />
            <div>
              <span className="text-sm text-tt-text-secondary">Export all transactions</span>
              <p className="text-[11px] text-tt-text-tertiary">CSV spreadsheet</p>
            </div>
          </div>
          <Download className="size-3.5 text-tt-text-tertiary" />
        </a>
        <a
          href="/exports/pdf"
          className="flex items-center justify-between py-3.5 hover:bg-tt-bg/50 transition-colors -mx-1 px-1 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <FileText className="size-4 text-tt-text-tertiary" />
            <div>
              <span className="text-sm text-tt-text-secondary">Export all transactions</span>
              <p className="text-[11px] text-tt-text-tertiary">PDF bank statement</p>
            </div>
          </div>
          <Download className="size-3.5 text-tt-text-tertiary" />
        </a>
      </div>
    </section>
  )
}

export default function Index() {
  const { flash, user, currencies, stats } = usePage<PageProps>().props

  useEffect(() => {
    if (flash?.notice) toast.success(flash.notice, { id: 'flash-notice', action: undefined })
    if (flash?.alert) toast.error(flash.alert, { id: 'flash-alert' })
  }, [flash?.notice, flash?.alert])

  return (
    <div className="min-h-screen bg-tt-bg pb-20">
      <header className="sticky top-0 z-30 bg-tt-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-[13px] text-tt-text-tertiary hover:text-tt-text transition-colors">
            <ArrowLeft className="size-[14px]" />
            Back
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-6">
        <h1 className="text-lg font-semibold text-tt-text">Settings</h1>

        <div className="mt-8 space-y-8">
          <ProfileSection user={user} />
          <CurrencySection currentCurrency={user.currency} currencies={currencies} />
          <SignConventionSection unsignedAdds={user.unsigned_adds} />
          <SecuritySection user={user} />
          <DataSection />
          <DangerZone stats={stats} />
        </div>
      </div>

      <BottomNavbar />
    </div>
  )
}
