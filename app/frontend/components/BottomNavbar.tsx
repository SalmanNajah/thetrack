import { Link, usePage, router } from "@inertiajs/react";
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Toaster } from "@/components/ui/sonner";
import {
  Home,
  Settings,
  Plus,
  Trash2,
  Wallet,
  Banknote,
  CircleDollarSign,
  Receipt,
  GripVertical,
  Check,
  X,
  Settings2,
} from "lucide-react";
import { classNames } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { Odometer } from "@/components/Odometer";
import { Drawer } from "vaul";
import type { Bucket } from "@/types";

function BucketIcon({ slug, className }: { slug: string; className?: string }) {
  switch (slug) {
    case "income":
      return <Wallet className={className} />;
    case "daily":
      return <Banknote className={className} />;
    default:
      return <CircleDollarSign className={className} />;
  }
}

export function BottomNavbar({
  currentSlug,
  buckets = [],
  currencySymbol = "₹",
  notesOpen,
  setNotesOpen,
}: {
  currentSlug?: string;
  buckets?: Bucket[];
  totalBalance?: string;
  currencySymbol?: string;
  notesOpen: boolean;
  setNotesOpen: (open: boolean) => void;
}) {
  const { url } = usePage();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [manageMode, setManageMode] = useState(false);
  const [items, setItems] = useState<Bucket[]>(buckets);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  useEffect(() => {
    setItems(buckets);
  }, [buckets]);

  useEffect(() => {
    if (open) setNotesOpen(false);
  }, [open]);

  useEffect(() => {
    if (notesOpen) setOpen(false);
  }, [notesOpen]);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const isOnDashboard = url.startsWith("/dashboard");
  const isOnSettings = url.startsWith("/settings");
  const isOnBuckets = url.startsWith("/buckets/") || !!currentSlug;

  useEffect(() => {
    if (!open) {
      setAdding(false);
      setNewName("");
      setConfirmDelete(null);
      setManageMode(false);
      setEditingId(null);
      setDragIdx(null);
      setOverIdx(null);
    }
  }, [open]);

  useEffect(() => {
    if (adding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [adding]);

  useEffect(() => {
    if (editingId !== null && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  function handleCreateBucket() {
    const name = newName.trim();
    if (!name) return;
    router.post(
      "/buckets",
      { name },
      {
        preserveScroll: true,
        onFinish: () => {
          setNewName("");
          setAdding(false);
          if (!manageMode) {
            setOpen(false);
          }
        },
      },
    );
  }

  function handleDeleteBucket(slug: string) {
    router.delete(`/buckets/${slug}`, {
      preserveScroll: true,
      onFinish: () => {
        setConfirmDelete(null);
        if (!manageMode) {
          setOpen(false);
        }
      },
    });
  }

  function handleDrop(toIdx: number) {
    if (dragIdx === null || dragIdx === toIdx) return;
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(toIdx, 0, moved);
    setItems(next);
    router.post(
      "/buckets/reorder",
      { bucket_ids: next.map((b) => b.id) },
      { preserveScroll: true }
    );
    setDragIdx(null);
    setOverIdx(null);
  }

  function togglePin(bucket: Bucket) {
    const next = !bucket.pinned;
    setItems((prev) =>
      prev.map((b) => (b.id === bucket.id ? { ...b, pinned: next } : b))
    );
    router.patch(
      `/buckets/${bucket.slug}`,
      { pinned: next ? "1" : "0" },
      { preserveScroll: true }
    );
  }

  function commitRename() {
    if (editingId === null) return;
    const trimmed = editValue.trim();
    const bucket = items.find((b) => b.id === editingId);
    setEditingId(null);
    if (!trimmed || !bucket || trimmed === bucket.name) return;

    setItems((prev) =>
      prev.map((b) => (b.id === editingId ? { ...b, name: trimmed } : b))
    );
    router.patch(
      `/buckets/${bucket.slug}`,
      { name: trimmed },
      { preserveScroll: true }
    );
  }

  function startRename(b: Bucket) {
    setEditingId(b.id);
    setEditValue(b.name);
    setConfirmDelete(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleCreateBucket();
    if (e.key === "Escape") {
      setAdding(false);
      setNewName("");
    }
  }

  return (
    <>
      <div
        onClick={() => {
          setOpen(false);
          setNotesOpen(false);
        }}
        className={classNames(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out md:hidden",
          (open || notesOpen) ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      <div className="fixed bottom-0 left-0 right-0 z-60 bg-tt-surface border-t border-tt-border h-[calc(64px+env(safe-area-inset-bottom))] pt-2.5 pb-[calc(4px+env(safe-area-inset-bottom))] flex items-center justify-around">
        <Link
          href="/dashboard"
          className={classNames(
            "flex flex-1 flex-col items-center justify-center h-full text-[11px] font-medium transition-colors focus:outline-none",
            isOnDashboard ? "text-tt-positive" : "text-tt-text-secondary"
          )}
        >
          <Home className="size-5 mb-0.5" />
          Dashboard
        </Link>

        <Drawer.Root open={open} onOpenChange={setOpen} modal={false}>
          <Drawer.Trigger asChild>
            <button
              className={classNames(
                "flex flex-1 flex-col items-center justify-center h-full text-[11px] font-medium transition-colors focus:outline-none cursor-pointer",
                isOnBuckets || open ? "text-tt-positive" : "text-tt-text-secondary"
              )}
            >
              <Plus
                className={classNames(
                  "size-[22px] transition-transform duration-300 ease-in-out origin-center",
                  open ? "-rotate-135 text-red-600" : ""
                )}
              />
              <span className="mt-0.5">Buckets</span>
            </button>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Content
              className="fixed z-50 bottom-0 left-0 right-0 max-h-[80vh] bg-tt-surface border-t border-tt-border rounded-t-2xl outline-none"
            >
              <div className="mx-auto mt-3 mb-2 h-1 w-10 rounded-full bg-tt-text-tertiary/30" />
              <div className="px-4 pb-[calc(--spacing(5)+64px+env(safe-area-inset-bottom))] overflow-y-auto max-h-[calc(80vh-40px)]">
                {manageMode ? (
                  <>
                    <div className="px-3 pb-1 flex flex-row items-center justify-between">
                      <h2 className="text-base font-semibold tracking-tight text-tt-text">Manage Buckets</h2>
                      <button
                        onClick={() => setManageMode(false)}
                        className="text-[14px] font-semibold text-tt-positive hover:opacity-80 transition-all cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                    <div className="pt-2 pb-3 space-y-2">
                      {items.map((bucket, index) => {
                        const isEditing = editingId === bucket.id;
                        const isDeleting = confirmDelete === bucket.slug;
                        const balance = parseFloat(bucket.balance) || 0;

                        if (isDeleting) {
                          return (
                            <div
                              key={bucket.id}
                              className="flex items-center justify-between px-3 py-2.5 bg-red-50/60 border border-red-200/60 rounded-xl"
                            >
                              <span className="text-[13px] text-red-600 font-medium truncate">
                                Delete "{bucket.name}"?
                              </span>
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => handleDeleteBucket(bucket.slug)}
                                  className="text-[13px] font-semibold text-red-600 hover:underline cursor-pointer"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  className="text-[13px] text-tt-text-secondary hover:underline cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={bucket.id}
                            draggable={!isEditing}
                            onDragStart={() => setDragIdx(index)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setOverIdx(index);
                            }}
                            onDrop={() => handleDrop(index)}
                            onDragEnd={() => {
                              setDragIdx(null);
                              setOverIdx(null);
                            }}
                            className={classNames(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent transition-all duration-100",
                              dragIdx === index && "opacity-25",
                              overIdx === index && dragIdx !== index && "bg-tt-bg",
                              !bucket.pinned && "opacity-50",
                            )}
                          >
                            <GripVertical className="size-4 shrink-0 cursor-grab active:cursor-grabbing text-tt-text-tertiary/30 hover:text-tt-text-tertiary/60 transition-colors" />

                            <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
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
                                    className="flex-1 min-w-0 bg-transparent border-0 border-b border-tt-text/15 px-0 py-0 text-[14px] text-tt-text focus:outline-none focus:ring-0 focus:border-tt-text/30"
                                  />
                                  <button
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      commitRename();
                                    }}
                                    className="p-0.5 text-green-600 hover:text-green-700 cursor-pointer"
                                  >
                                    <Check className="size-4" />
                                  </button>
                                  <button
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setEditingId(null);
                                    }}
                                    className="p-0.5 text-tt-text-tertiary hover:text-tt-text cursor-pointer"
                                  >
                                    <X className="size-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startRename(bucket)}
                                    className="text-left text-[14px] font-medium text-tt-text truncate min-w-0 cursor-pointer hover:underline underline-offset-2 decoration-tt-text-tertiary/30"
                                    title="Click to rename"
                                  >
                                    {bucket.name}
                                  </button>
                                  <span className="text-[13px] text-tt-text-tertiary font-medium font-mono tabular-nums shrink-0">
                                    {formatCurrency(balance.toFixed(2), currencySymbol)}
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => togglePin(bucket)}
                                className="relative w-[30px] h-[16px] rounded-full transition-colors duration-200 cursor-pointer focus:outline-none"
                                style={{ backgroundColor: bucket.pinned ? "var(--tt-text)" : "var(--tt-border)" }}
                                title={bucket.pinned ? "Hide from list" : "Show in list"}
                                role="switch"
                                aria-checked={bucket.pinned}
                              >
                                <span
                                  className="absolute top-[2px] left-[2px] size-[12px] rounded-full bg-white transition-transform duration-200 shadow-sm"
                                  style={{ transform: bucket.pinned ? "translateX(14px)" : "translateX(0)" }}
                                />
                              </button>

                              {items.length > 1 && (
                                <button
                                  onClick={() => {
                                    setConfirmDelete(bucket.slug);
                                    setEditingId(null);
                                  }}
                                  className="p-1 text-tt-text-tertiary/40 hover:text-red-600 transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {items.length - items.filter((b) => b.pinned).length > 0 && (
                        <p className="px-3 pt-2 text-[11px] text-tt-text-tertiary">
                          {items.length - items.filter((b) => b.pinned).length} bucket(s) hidden. Toggle switch to show in lists.
                        </p>
                      )}

                      {adding ? (
                        <div className="flex items-center gap-3 px-3 py-2.5 border border-dashed border-tt-border rounded-xl">
                          <Plus className="size-4 shrink-0 text-tt-positive" />
                          <input
                            ref={inputRef}
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={() => {
                              if (!newName.trim()) setAdding(false);
                            }}
                            placeholder="New bucket name…"
                            className="flex-1 border-0 bg-transparent p-0 text-[14px] text-tt-text placeholder:text-tt-text-tertiary/60 focus:outline-none focus:ring-0"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setAdding(true)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-tt-border/60 text-[14px] text-tt-text-secondary hover:text-tt-positive hover:border-tt-positive/40 transition-all cursor-pointer"
                        >
                          <Plus className="size-4" />
                          Add bucket
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-3 pb-1 flex flex-row items-center justify-between">
                      <h2 className="text-base font-semibold tracking-tight text-tt-text">My Buckets</h2>
                      <button
                        onClick={() => setManageMode(true)}
                        className="p-1.5 text-tt-text-tertiary hover:text-tt-text transition-colors cursor-pointer"
                        title="Manage buckets"
                      >
                        <Settings2 className="size-4" />
                      </button>
                    </div>
                    <div className="pt-2 pb-3 space-y-2">
                      {items.filter((b) => b.pinned).map((b) => {
                        const isActive = b.slug === currentSlug;
                        const bucketBalance = parseFloat(b.balance) || 0;

                        return (
                          <div
                            key={b.id}
                            className={classNames(
                              "group relative flex items-center justify-between px-3 py-2.5 rounded-xl border border-transparent transition-all",
                              isActive ? "bg-tt-positive/5 border-tt-positive/20" : "hover:bg-tt-bg"
                            )}
                          >
                            <Link
                              href={`/buckets/${b.slug}`}
                              onClick={() => setOpen(false)}
                              className="flex-1 flex items-center justify-between focus:outline-none"
                            >
                              <div className="flex items-center gap-3">
                                <BucketIcon
                                  slug={b.slug}
                                  className={classNames(
                                    "size-4 shrink-0",
                                    isActive ? "text-tt-positive" : "text-tt-text-tertiary"
                                  )}
                                />
                                <span className={classNames(
                                  "text-[14px]",
                                  isActive ? "text-tt-text font-semibold" : "text-tt-text-secondary"
                                )}>
                                  {b.name}
                                </span>
                              </div>
                              <span className={classNames(
                                "text-[13px] font-medium font-mono",
                                isActive ? "text-tt-positive" : "text-tt-text-secondary"
                              )}>
                                <Odometer value={formatCurrency(bucketBalance.toFixed(2), currencySymbol)} />
                              </span>
                            </Link>
                          </div>
                        );
                      })}

                      {adding ? (
                        <div className="flex items-center gap-3 px-3 py-2.5 border border-dashed border-tt-border rounded-xl">
                          <Plus className="size-4 shrink-0 text-tt-positive" />
                          <input
                            ref={inputRef}
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={() => {
                              if (!newName.trim()) setAdding(false);
                            }}
                            placeholder="New bucket name…"
                            className="flex-1 border-0 bg-transparent p-0 text-[14px] text-tt-text placeholder:text-tt-text-tertiary/60 focus:outline-none focus:ring-0"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setAdding(true)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-tt-border/60 text-[14px] text-tt-text-secondary hover:text-tt-positive hover:border-tt-positive/40 transition-all cursor-pointer"
                        >
                          <Plus className="size-4" />
                          Add bucket
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-notes"));
          }}
          className={classNames(
            "flex flex-1 flex-col items-center justify-center h-full text-[11px] font-medium transition-colors focus:outline-none cursor-pointer",
            notesOpen ? "text-tt-positive" : "text-tt-text-secondary"
          )}
        >
          <Receipt className="size-5 mb-0.5" />
          Notes
        </button>

        <Link
          href="/settings"
          className={classNames(
            "flex flex-1 flex-col items-center justify-center h-full text-[11px] font-medium transition-colors focus:outline-none",
            isOnSettings ? "text-tt-positive" : "text-tt-text-secondary"
          )}
        >
          <Settings className="size-5 mb-0.5" />
          Settings
        </Link>
      </div>
      <Toaster position="top-center" richColors />
    </>
  );
}
