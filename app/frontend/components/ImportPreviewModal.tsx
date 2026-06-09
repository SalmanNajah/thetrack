import { useState, useRef, useCallback } from 'react'
import { router } from '@inertiajs/react'
import { Upload, Check, AlertCircle, Loader2, FileText, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

type ParsedRow = {
  index: number
  date: string
  description: string
  amount: string
  selected: boolean
}

type Props = {
  bucketId: number
  currentBalance: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="shrink-0 group" type="button">
      <div className={`size-[18px] rounded-[4px] border-[1.5px] flex items-center justify-center transition-all duration-150 ${
        checked
          ? 'bg-tt-text border-tt-text'
          : 'border-tt-border-subtle group-hover:border-tt-text-tertiary'
      }`}>
        {checked && <Check className="size-3 text-tt-bg" strokeWidth={3} />}
      </div>
    </button>
  )
}

export function ImportPreviewModal({ bucketId, currentBalance, open, onOpenChange }: Props) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload')
  const [mode, setMode] = useState<'file' | 'text'>('file')
  const [pastedText, setPastedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setStep('upload')
    setRows([])
    setParseErrors([])
    setPastedText('')
    setLoading(false)
  }, [])

  function handleOpenChange(v: boolean) {
    if (!v) reset()
    onOpenChange(v)
  }

  function processFile(file: File) {
    const isCsv = file.name.toLowerCase().endsWith('.csv')
    const isPdf = file.name.toLowerCase().endsWith('.pdf')

    if (!isCsv && !isPdf) {
      setParseErrors(['Please upload a CSV or PDF statement file.'])
      return
    }

    setLoading(true)
    setParseErrors([])

    const formData = new FormData()
    formData.append('file', file)

    fetch('/imports/parse', {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
      }
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false)
        if (data.success) {
          setRows(data.rows)
          setParseErrors(data.errors || [])
          if (data.rows.length > 0) setStep('preview')
        } else {
          setParseErrors(data.errors || ['Failed to parse statement file'])
        }
      })
      .catch(() => {
        setLoading(false)
        setParseErrors(['An error occurred while uploading.'])
      })
  }

  function processText() {
    if (!pastedText.trim()) return

    setLoading(true)
    setParseErrors([])

    fetch('/imports/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
      },
      body: JSON.stringify({ text: pastedText })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false)
        if (data.success) {
          setRows(data.rows)
          setParseErrors(data.errors || [])
          if (data.rows.length > 0) setStep('preview')
        } else {
          setParseErrors(data.errors || ['Could not extract any transactions. Check formatting.'])
        }
      })
      .catch(() => {
        setLoading(false)
        setParseErrors(['An error occurred while parsing text.'])
      })
  }

  function toggleRow(idx: number) {
    setRows(prev => prev.map(r => r.index === idx ? { ...r, selected: !r.selected } : r))
  }

  function toggleAll() {
    const allOn = rows.every(r => r.selected)
    setRows(prev => prev.map(r => ({ ...r, selected: !allOn })))
  }

  function updateDesc(idx: number, description: string) {
    setRows(prev => prev.map(r => r.index === idx ? { ...r, description } : r))
  }

  function updateAmount(idx: number, amount: string) {
    setRows(prev => prev.map(r => r.index === idx ? { ...r, amount } : r))
  }

  function handleImport() {
    const selected = rows.filter(r => r.selected)
    if (!selected.length) return
    setStep('importing')
    router.post('/imports/create', {
      bucket_id: bucketId,
      rows: selected.map(({ date, description, amount }) => ({ date, description, amount })),
    }, {
      onFinish: () => { reset(); onOpenChange(false) },
    })
  }

  const cleanAmt = useCallback((str: string) => {
    if (!str) return 0
    const cleaned = str.replace(/[, ]/g, '')
    return parseFloat(cleaned)
  }, [])

  const selected = rows.filter(r => r.selected)
  const credits = selected.reduce((s, r) => {
    const val = cleanAmt(r.amount)
    return (!isNaN(val) && val > 0) ? s + val : s
  }, 0)
  const debits  = selected.reduce((s, r) => {
    const val = cleanAmt(r.amount)
    return (!isNaN(val) && val < 0) ? s + Math.abs(val) : s
  }, 0)
  const netImpact = credits - debits
  const projectedBalance = currentBalance + netImpact
  const wouldGoNegative = projectedBalance < -0.001

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={step === 'preview' ? 'sm:max-w-xl max-h-[80vh] flex flex-col' : 'sm:max-w-sm'}>
        <DialogHeader>
          <DialogTitle className="text-[15px]">
            {step === 'upload' ? 'Import Transactions' : step === 'preview' ? 'Review & Import' : 'Importing…'}
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 pt-1">
            <div className="flex bg-tt-bg rounded-lg p-1 gap-1 border border-tt-border-subtle">
              <button
                type="button"
                onClick={() => { setMode('file'); setParseErrors([]) }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-semibold rounded-md transition-all ${
                  mode === 'file' ? 'bg-tt-surface text-tt-text shadow-xs' : 'text-tt-text-tertiary hover:text-tt-text'
                }`}
              >
                <FileText className="size-3.5" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => { setMode('text'); setParseErrors([]) }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-semibold rounded-md transition-all ${
                  mode === 'text' ? 'bg-tt-surface text-tt-text shadow-xs' : 'text-tt-text-tertiary hover:text-tt-text'
                }`}
              >
                <ClipboardList className="size-3.5" />
                Paste Text
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center">
                <Loader2 className="size-6 text-tt-text-tertiary mx-auto mb-3 animate-spin" />
                <p className="text-sm text-tt-text-secondary">Parsing statement…</p>
              </div>
            ) : mode === 'file' ? (
              <div className="space-y-3">
                <div
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                    dragOver ? 'border-tt-accent/60 bg-tt-accent/5 scale-[1.01]' : 'border-tt-border hover:border-tt-text-tertiary/50'
                  }`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); e.dataTransfer.files[0] && processFile(e.dataTransfer.files[0]) }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="size-10 rounded-xl bg-tt-bg flex items-center justify-center mx-auto mb-3">
                    <Upload className="size-5 text-tt-text-tertiary" />
                  </div>
                  <p className="text-sm text-tt-text font-medium">Drop CSV file</p>
                  <p className="text-[12px] text-tt-text-tertiary mt-1">Supports bank CSV exports</p>
                  <input ref={fileInputRef} type="file" accept=".csv" onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" />
                </div>
                <p className="text-[11px] text-tt-text-tertiary leading-relaxed">
                  Tip: Export transactions as CSV from your bank app and upload here. Columns should include date, description, and amount (or debit/credit).
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="Paste WhatsApp logs, Google Keep lists, or copied PDF text here...&#10;&#10;Examples:&#10;-200 coffee&#10;Yesterday -150 lunch&#10;27 Jan 2026 Transfer to Daily Rs.1,86,370.35"
                  className="w-full h-36 rounded-xl border border-tt-border bg-tt-bg p-3.5 text-[13px] text-tt-text placeholder:text-tt-text-tertiary/45 focus:border-tt-text-tertiary/60 focus:outline-none focus:ring-0 resize-none font-sans"
                />
                <Button
                  onClick={processText}
                  disabled={!pastedText.trim()}
                  className="w-full bg-tt-text hover:bg-tt-text/90 text-tt-bg font-medium h-9.5 rounded-lg"
                >
                  Parse Paste
                </Button>
              </div>
            )}

            {parseErrors.length > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-3 flex items-start gap-2">
                <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                <div className="text-[12px] text-red-600 space-y-0.5">
                  {parseErrors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'preview' && (
          <>
            <div className="flex items-center justify-between pb-2 border-b border-tt-border-subtle">
              <div className="flex items-center gap-2.5">
                <Checkbox checked={rows.every(r => r.selected)} onChange={toggleAll} />
                <span className="text-[12px] text-tt-text-tertiary">
                  {selected.length}/{rows.length} selected
                </span>
              </div>
              <button onClick={() => setStep('upload')} className="text-[12px] text-tt-accent hover:underline">
                Go back
              </button>
            </div>

            {parseErrors.length > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-100/70 p-3 mb-3">
                <div className="flex items-center gap-1.5 text-amber-800 text-[12px] font-semibold mb-1">
                  <AlertCircle className="size-3.5 text-amber-600 shrink-0" />
                  <span>Skipped Lines ({parseErrors.length})</span>
                </div>
                <div className="max-h-20 overflow-y-auto text-[11px] text-amber-700 font-mono space-y-0.5 leading-relaxed pr-1">
                  {parseErrors.map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
              {rows.map(row => {
                const amt = cleanAmt(row.amount) || 0
                const isPos = amt > 0
                const isNeg = amt < 0
                return (
                  <div
                    key={row.index}
                    className={`flex items-center gap-2.5 py-2.5 border-b border-tt-border-subtle last:border-0 transition-opacity duration-150 ${
                      !row.selected ? 'opacity-30' : ''
                    }`}
                  >
                    <Checkbox checked={row.selected} onChange={() => toggleRow(row.index)} />
                    <div className="flex-1 min-w-0">
                      <input
                        value={row.description}
                        onChange={e => updateDesc(row.index, e.target.value)}
                        spellCheck={false}
                        autoComplete="off"
                        placeholder="Add description…"
                        className="w-full bg-transparent p-0 text-[13px] text-tt-text placeholder:text-tt-text-tertiary/40 border-0 focus:outline-none focus:ring-0"
                      />
                      <p className="text-[11px] text-tt-text-tertiary mt-0.5 font-mono tabular-nums">{row.date}</p>
                    </div>
                    <input
                      type="text"
                      value={row.amount}
                      onChange={e => updateAmount(row.index, e.target.value)}
                      spellCheck={false}
                      autoComplete="off"
                      placeholder="0.00"
                      className={`w-28 bg-transparent p-0 text-right text-[13px] font-mono font-medium tabular-nums border-0 focus:outline-none focus:ring-0 ${
                        isPos ? 'text-tt-positive' : isNeg ? 'text-tt-negative' : 'text-tt-text'
                      }`}
                    />
                  </div>
                )
              })}
            </div>

            <div className="border-t border-tt-border pt-3 space-y-3">
              <div className="flex justify-between text-[12px] text-tt-text-tertiary">
                <span>
                  <span className="text-tt-positive font-medium">+{credits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  {' / '}
                  <span className="text-tt-negative font-medium">-{debits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </span>
                <span className="text-tt-text font-medium">
                  Net {netImpact >= 0 ? '+' : ''}{netImpact.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {wouldGoNegative && selected.length > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-100/70 px-3 py-2 flex items-start gap-2">
                  <AlertCircle className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Importing these transactions would make the balance negative
                    ({projectedBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}). Deselect some expenses or add funds first.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleOpenChange(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!selected.length || wouldGoNegative}
                  className="flex-1 bg-tt-text hover:bg-tt-text/90 text-tt-bg font-medium"
                >
                  Import {selected.length} transaction{selected.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'importing' && (
          <div className="py-12 text-center">
            <Loader2 className="size-6 text-tt-text-tertiary mx-auto mb-3 animate-spin" />
            <p className="text-sm text-tt-text-secondary">Creating transactions…</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
