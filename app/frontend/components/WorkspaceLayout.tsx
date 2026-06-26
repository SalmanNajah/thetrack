import { ReactNode, useState, useEffect } from "react";
import { BucketSidebar } from "@/components/BucketSidebar";
import { MobileTopBar } from "@/components/MobileTopBar";
import { SearchPopup } from "@/components/SearchPopup";
import { BottomNavbar } from "@/components/BottomNavbar";
import { Odometer } from "@/components/Odometer";
import { formatCurrency } from "@/lib/format";
import type { Bucket } from "@/types";
import { Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer } from "vaul";
import { NotesContent } from "@/components/NotesContent";

type WorkspaceLayoutProps = {
  children: ReactNode;
  buckets: Bucket[];
  totalBalance: string;
  currencySymbol: string;
  activeBucketSlug?: string;
  showMobileBalance?: boolean;
  onboarded?: boolean;
};

export function WorkspaceLayout({
  children,
  buckets,
  totalBalance,
  currencySymbol,
  activeBucketSlug,
  showMobileBalance = false,
  onboarded = true,
}: WorkspaceLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [defaultBucketSlug, setDefaultBucketSlug] = useState<string | undefined>(undefined);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    setIsDesktop(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    function handleOpenNotes(e: Event) {
      const detail = (e as CustomEvent<{ bucketSlug?: string }>).detail;
      setDefaultBucketSlug(detail?.bucketSlug ?? undefined);
      const notesSidebarVisible = window.matchMedia("(min-width: 1024px)").matches;
      if (!notesSidebarVisible) setNotesOpen(true);
    }
    window.addEventListener("open-notes", handleOpenNotes);
    return () => window.removeEventListener("open-notes", handleOpenNotes);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    function handleOpenSearch() {
      setSearchOpen(true);
    }
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-search", handleOpenSearch);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-search", handleOpenSearch);
    };
  }, []);

  const numericBalance = parseFloat(totalBalance) || 0;
  const formattedBalance = formatCurrency(numericBalance.toFixed(2), currencySymbol);
  const mobileBalanceFontSize =
    formattedBalance.length > 14
      ? "text-[1.875rem]"
      : formattedBalance.length > 10
        ? "text-[2.5rem]"
        : "text-[3.25rem]";

  return (
    <div className="min-h-screen bg-tt-bg">
      {onboarded && (
        <div
          className="hidden md:block fixed left-0 top-0 bottom-0 border-r border-tt-border"
          style={{ width: "var(--tt-sidebar-width)" }}
        >
          <BucketSidebar
            buckets={buckets}
            totalBalance={totalBalance}
            currencySymbol={currencySymbol}
            activeBucketSlug={activeBucketSlug}
          />
        </div>
      )}

      {onboarded && (
        <div className="md:hidden">
          <MobileTopBar onSearchClick={() => setSearchOpen(true)} />
        </div>
      )}

      <div className={onboarded ? "md:ml-(--tt-sidebar-width)" : ""}>
        <div className={onboarded ? "lg:mr-(--tt-right-sidebar-width)" : ""}>
          {showMobileBalance && onboarded && (
            <div className="md:hidden px-6 pt-4 pb-6 overflow-hidden">
              <p className={`${mobileBalanceFontSize} font-semibold leading-none tracking-tighter text-tt-text truncate overflow-hidden`}>
                <Odometer
                  value={formattedBalance}
                />
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <p className="text-[12px] text-tt-text-tertiary">
                  Total balance
                </p>
              </div>
            </div>
          )}

          <main className="mx-auto max-w-2xl px-6 pb-48 md:pb-20 lg:max-w-none">
            {children}
          </main>
        </div>
      </div>

      {onboarded && (
        <div
          className="hidden lg:flex fixed right-0 top-0 bottom-0 flex-col bg-tt-sidebar-bg border-l border-tt-border"
          style={{ width: "var(--tt-right-sidebar-width)" }}
        >
          <div className="px-5 pt-5 pb-2 flex items-center gap-2 border-b border-dashed border-tt-border">
            <Receipt className="size-3.5 text-tt-accent shrink-0" />
            <h2 className="text-[14px] font-semibold text-tt-text">Notes</h2>
          </div>
          <div className="flex-1 min-h-0 px-4 overflow-y-auto">
            <NotesContent defaultBucketSlug={defaultBucketSlug} />
          </div>
        </div>
      )}

      {onboarded && (
        <div className="md:hidden">
          <BottomNavbar
            currentSlug={activeBucketSlug}
            buckets={buckets}
            totalBalance={totalBalance}
            currencySymbol={currencySymbol}
            notesOpen={notesOpen}
            setNotesOpen={setNotesOpen}
          />
        </div>
      )}

      {onboarded && !isDesktop && (
        <Drawer.Root open={notesOpen} onOpenChange={setNotesOpen} modal={false}>
          <Drawer.Portal>
            <Drawer.Content className="fixed z-50 bottom-0 left-0 right-0 max-h-[80vh] bg-tt-surface border-t border-tt-border rounded-t-2xl outline-none">
              <div className="mx-auto mt-3 mb-2 h-1 w-10 rounded-full bg-tt-text-tertiary/30" />
              <div className="px-4 pb-[calc(--spacing(5)+64px+env(safe-area-inset-bottom))] overflow-y-auto max-h-[calc(80vh-40px)] flex flex-col">
                <div className="px-3 pb-1 flex flex-row items-center justify-between">
                  <h2 className="text-base font-semibold tracking-tight text-tt-text">Workspace Notes</h2>
                </div>
                <NotesContent defaultBucketSlug={defaultBucketSlug} />
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}

      {onboarded && isDesktop && (
        <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
          <DialogContent className="sm:max-w-md h-[460px] p-0 flex flex-col gap-0 overflow-hidden">
            <DialogHeader className="px-4 pt-4 pb-2 flex-row items-center gap-2 border-b border-dashed">
              <Receipt className="size-4 text-tt-accent shrink-0" />
              <DialogTitle className="text-[15px] font-semibold">
                Workspace Notes
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 px-4">
              <NotesContent defaultBucketSlug={defaultBucketSlug} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <SearchPopup open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
