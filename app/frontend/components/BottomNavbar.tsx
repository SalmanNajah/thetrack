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
} from "lucide-react";
import { classNames } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { Odometer } from "@/components/Odometer";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
}: {
  currentSlug?: string;
  buckets?: Bucket[];
  totalBalance?: string;
  currencySymbol?: string;
}) {
  const { url } = usePage();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOnDashboard = url.startsWith("/dashboard");
  const isOnSettings = url.startsWith("/settings");
  const isOnBuckets = url.startsWith("/buckets/") || !!currentSlug;

  useEffect(() => {
    if (!open) {
      setAdding(false);
      setNewName("");
      setConfirmDelete(null);
    }
  }, [open]);

  useEffect(() => {
    if (adding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [adding]);

  function handleCreateBucket() {
    const name = newName.trim();
    if (!name) return;
    router.post(
      "/buckets",
      { name },
      {
        onFinish: () => {
          setNewName("");
          setAdding(false);
          setOpen(false);
        },
      },
    );
  }

  function handleDeleteBucket(slug: string) {
    router.delete(`/buckets/${slug}`, {
      onFinish: () => {
        setConfirmDelete(null);
        setOpen(false);
      },
    });
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
      <div className="fixed bottom-0 left-0 right-0 z-45 bg-tt-surface border-t border-tt-border h-[calc(64px+env(safe-area-inset-bottom))] pt-2.5 pb-[calc(4px+env(safe-area-inset-bottom))] flex items-center justify-around">
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

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className={classNames(
                "flex flex-1 flex-col items-center justify-center h-full text-[11px] font-medium transition-colors focus:outline-none cursor-pointer",
                isOnBuckets ? "text-tt-positive" : "text-tt-text-secondary"
              )}
            >
              <Plus className="size-[22px]" />
              <span className="mt-0.5">Buckets</span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="bg-tt-surface border-t border-tt-border rounded-t-2xl max-h-[80vh] h-fit overflow-y-auto px-4 pt-5 pb-5 bottom-[calc(64px+env(safe-area-inset-bottom))]! left-0 right-0 w-full z-50 shadow-none!"
          >
            <SheetHeader className="px-3 pb-1 flex flex-row items-center justify-between">
              <SheetTitle className="text-base font-semibold tracking-tight text-tt-text">My Buckets</SheetTitle>
            </SheetHeader>
            <div className="pt-2 pb-3 space-y-2">
              {buckets.map((b) => {
                const isActive = b.slug === currentSlug;
                const isDeleting = confirmDelete === b.slug;
                const bucketBalance = parseFloat(b.balance) || 0;

                if (isDeleting) {
                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between px-3 py-2.5 border border-red-200 bg-red-50/50 rounded-xl"
                    >
                      <span className="text-[13px] text-red-600 font-medium">
                        Delete {b.name}?
                      </span>
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleDeleteBucket(b.slug)}
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
                    key={b.id}
                    className={classNames(
                      "group relative flex items-center justify-between px-3 py-2.5 rounded-xl border border-transparent transition-all",
                      isActive ? "bg-tt-positive/5 border-tt-positive/20" : "hover:bg-tt-bg"
                    )}
                  >
                    <Link
                      href={`/buckets/${b.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex-1 flex items-center justify-between pr-7 focus:outline-none"
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
                    {buckets.length > 1 && (
                      <button
                        onClick={() => setConfirmDelete(b.slug)}
                        className="absolute right-3 p-1 text-tt-text-tertiary/40 hover:text-red-600 transition-colors focus:outline-none cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
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
          </SheetContent>
        </Sheet>

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
