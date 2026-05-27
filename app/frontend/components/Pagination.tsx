import { router } from '@inertiajs/react'
import type { PaginationData } from '@/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type PaginationProps = {
  pagination: PaginationData
  baseUrl: string
  search?: string
}

export function Pagination({ pagination, baseUrl, search }: PaginationProps) {
  const { page, total_pages, total } = pagination

  if (total_pages <= 1) return null

  function goTo(p: number) {
    const params: Record<string, string | number> = { page: p }
    if (search) params.search = search
    router.get(baseUrl, params, { preserveState: true })
  }

  const pages: (number | '...')[] = []
  if (total_pages <= 7) {
    for (let i = 1; i <= total_pages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(total_pages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < total_pages - 2) pages.push('...')
    pages.push(total_pages)
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t border-[#e0dbd2]">
      <p className="text-[12px] text-[#aaa]">
        {total.toLocaleString()} total
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="flex items-center justify-center size-8 rounded-md text-[#999] hover:text-[#333] hover:bg-[#eae7e0] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="size-4" />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1 text-[12px] text-[#ccc]">…</span>
          ) : (
            <button
              key={p}
              onClick={() => goTo(p)}
              className={`flex items-center justify-center size-8 rounded-md text-[12px] font-medium transition-all ${
                p === page
                  ? 'bg-[#1a1a1d] text-white'
                  : 'text-[#999] hover:text-[#333] hover:bg-[#eae7e0]'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= total_pages}
          className="flex items-center justify-center size-8 rounded-md text-[#999] hover:text-[#333] hover:bg-[#eae7e0] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
