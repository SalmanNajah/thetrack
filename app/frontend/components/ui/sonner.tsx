import { Toaster as Sonner, type ToasterProps } from "sonner"
import { Check, Info, AlertTriangle, XCircle, Loader2 } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group font-sans"
      icons={{
        success: <Check className="size-[15px] text-emerald-600 stroke-[2.5]" />,
        info: <Info className="size-[15px] text-[#5b5bd6] stroke-[2.5]" />,
        warning: <AlertTriangle className="size-[15px] text-amber-600 stroke-[2.5]" />,
        error: <XCircle className="size-[15px] text-red-600 stroke-[2.5]" />,
        loading: <Loader2 className="size-[15px] text-[#5b5bd6] stroke-[2.5] animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "flex items-center gap-3 w-full max-w-[350px] bg-white border border-dashed border-[#a1a1aa]/40 px-4 py-3.5 text-[13px] text-[#18181b] font-sans",
          title: "font-medium text-[#18181b] leading-tight",
          description: "text-[#71717a] text-[11px] leading-relaxed",
          actionButton: "bg-[#18181b] text-[#f7f7f5] hover:opacity-90 px-2.5 py-1 text-[11px] font-medium transition-opacity shrink-0 ml-auto",
          cancelButton: "text-[#71717a] hover:text-[#18181b] px-2.5 py-1 text-[11px] font-medium transition-colors shrink-0",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
