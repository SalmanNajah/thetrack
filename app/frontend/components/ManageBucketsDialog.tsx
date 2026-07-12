import { useState, useRef, useEffect, useCallback } from "react";
import { router } from "@inertiajs/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GripVertical, Trash2, Check, X } from "lucide-react";
import { classNames } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { Bucket } from "@/types";

type ManageBucketsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buckets: Bucket[];
  currencySymbol: string;
};

export function ManageBucketsDialog({
  open,
  onOpenChange,
  buckets: initialBuckets,
  currencySymbol,
}: ManageBucketsDialogProps) {
  const [items, setItems] = useState(initialBuckets);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => setItems(initialBuckets), [initialBuckets]);

  useEffect(() => {
    if (editingId !== null && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setDeleteConfirmId(null);
      setDragIdx(null);
      setOverIdx(null);
    }
  }, [open]);

  const startRename = useCallback((b: Bucket) => {
    setEditingId(b.id);
    setEditValue(b.name);
    setDeleteConfirmId(null);
  }, []);

  function commitRename() {
    if (editingId === null) return;
    const trimmed = editValue.trim();
    const bucket = items.find((b) => b.id === editingId);
    setEditingId(null);
    if (!trimmed || !bucket || trimmed === bucket.name) return;

    setItems((prev) =>
      prev.map((b) => (b.id === editingId ? { ...b, name: trimmed } : b)),
    );
    router.patch(`/buckets/${bucket.slug}`, { name: trimmed }, { preserveScroll: true });
  }

  function togglePin(bucket: Bucket) {
    const next = !bucket.pinned;
    setItems((prev) =>
      prev.map((b) => (b.id === bucket.id ? { ...b, pinned: next } : b)),
    );
    router.patch(
      `/buckets/${bucket.slug}`,
      { pinned: next ? "1" : "0" },
      { preserveScroll: true },
    );
  }

  function deleteBucket(bucket: Bucket) {
    router.delete(`/buckets/${bucket.slug}`, {
      preserveScroll: true,
      onFinish: () => setDeleteConfirmId(null),
    });
  }

  function handleDrop(toIdx: number) {
    if (dragIdx === null || dragIdx === toIdx) return;
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(toIdx, 0, moved);
    setItems(next);
    router.post("/buckets/reorder", { bucket_ids: next.map((b) => b.id) }, { preserveScroll: true });
    setDragIdx(null);
    setOverIdx(null);
  }

  const canDelete = items.length > 1;
  const pinnedCount = items.filter((b) => b.pinned).length;
  const hiddenCount = items.length - pinnedCount;

  function BucketRow({ bucket, index }: { bucket: Bucket; index: number }) {
    const isEditing = editingId === bucket.id;
    const isDeleting = deleteConfirmId === bucket.id;
    const balance = parseFloat(bucket.balance) || 0;

    if (isDeleting) {
      return (
        <div className="flex items-center justify-between px-4 py-2.5 mx-2 bg-red-50/60 border border-red-200/60 rounded-lg">
          <span className="text-[12px] text-red-600 font-medium">
            Delete "{bucket.name}"?
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => deleteBucket(bucket)}
              className="text-[11px] font-semibold text-red-600 hover:text-red-700 cursor-pointer"
            >
              Delete
            </button>
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="text-[11px] text-tt-text-tertiary hover:text-tt-text cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        draggable={!isEditing}
        onDragStart={() => setDragIdx(index)}
        onDragOver={(e) => { e.preventDefault(); setOverIdx(index); }}
        onDrop={() => handleDrop(index)}
        onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
        className={classNames(
          "flex items-center gap-2 px-2 py-1 mx-2 rounded-lg group transition-all duration-100",
          dragIdx === index && "opacity-25",
          overIdx === index && dragIdx !== index && "bg-tt-bg",
          !bucket.pinned && "opacity-50",
        )}
      >
        <GripVertical className="size-3 shrink-0 cursor-grab active:cursor-grabbing text-tt-text-tertiary/30 group-hover:text-tt-text-tertiary/60 transition-colors" />

        <div className="flex-1 min-w-0 flex items-center justify-between gap-2 py-1.5">
          {isEditing ? (
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <input
                ref={editRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setEditingId(null);
                }}
                onBlur={commitRename}
                className="flex-1 min-w-0 bg-transparent border-0 border-b border-tt-text/15 px-0 py-0 text-[13px] text-tt-text focus:outline-none focus:ring-0 focus:border-tt-text/30"
              />
              <button
                onMouseDown={(e) => { e.preventDefault(); commitRename(); }}
                className="p-0.5 text-green-600 hover:text-green-700 cursor-pointer"
              >
                <Check className="size-3.5" />
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); setEditingId(null); }}
                className="p-0.5 text-tt-text-tertiary hover:text-tt-text cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => startRename(bucket)}
                className="text-left text-[13px] font-medium text-tt-text truncate min-w-0 cursor-pointer hover:underline underline-offset-2 decoration-tt-text-tertiary/30"
                title="Click to rename"
              >
                {bucket.name}
              </button>
              <span className="text-[11px] text-tt-text-tertiary tabular-nums shrink-0">
                {formatCurrency(balance.toFixed(2), currencySymbol)}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => togglePin(bucket)}
            className="relative w-[30px] h-[16px] rounded-full transition-colors duration-200 cursor-pointer focus:outline-none"
            style={{ backgroundColor: bucket.pinned ? "var(--tt-text)" : "var(--tt-border)" }}
            title={bucket.pinned ? "Hide from sidebar" : "Show in sidebar"}
            role="switch"
            aria-checked={bucket.pinned}
          >
            <span
              className="absolute top-[2px] left-[2px] size-[12px] rounded-full bg-white transition-transform duration-200 shadow-sm"
              style={{ transform: bucket.pinned ? "translateX(14px)" : "translateX(0)" }}
            />
          </button>

          {canDelete && (
            <button
              onClick={() => { setDeleteConfirmId(bucket.id); setEditingId(null); }}
              className="p-0.5 text-transparent group-hover:text-tt-text-tertiary/40 hover:text-red-500! transition-colors cursor-pointer"
              title="Delete"
            >
              <Trash2 className="size-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0! gap-0!">
        <DialogHeader>
          <DialogTitle className="text-[14px] font-semibold px-4 py-3.5 border-b border-dashed">
            Manage Buckets
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 max-h-[60vh] overflow-y-auto scrollbar-none">
          <div className="px-4 pb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-tt-text-secondary">
              Visible in sidebar
            </span>
            <span className="text-[10px] text-tt-text-tertiary tabular-nums">
              {pinnedCount} of {items.length}
            </span>
          </div>

          <div className="space-y-0.5">
            {items.map((bucket, i) => (
              <BucketRow key={bucket.id} bucket={bucket} index={i} />
            ))}
          </div>

          {hiddenCount > 0 && (
            <p className="px-4 pt-3 pb-1 text-[10px] text-tt-text-tertiary">
              {hiddenCount} bucket{hiddenCount > 1 ? "s" : ""} hidden from the sidebar. Toggle to show.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
