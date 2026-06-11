import { usePage, Link } from "@inertiajs/react";
import { Search } from "lucide-react";
import type { AuthUser } from "@/types";

type MobileTopBarProps = {
  onSearchClick: () => void;
};

export function MobileTopBar({ onSearchClick }: MobileTopBarProps) {
  const {
    auth: { user },
  } = usePage<{ auth: { user: AuthUser } }>().props;

  const initial = (user.name || user.email).charAt(0).toUpperCase();

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-tt-bg/80 backdrop-blur-md">
      <Link
        href="/settings"
        className="size-7 bg-tt-text/10 flex items-center justify-center text-[12px] font-medium text-tt-text-secondary select-none cursor-pointer hover:bg-tt-text/20 transition-all active:scale-95"
      >
        {initial}
      </Link>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          onSearchClick();
        }}
        className="flex items-center gap-1.5 text-[12px] text-tt-text-secondary hover:text-tt-text border border-dashed border-tt-text-tertiary px-2.5 py-1 bg-tt-surface transition-colors cursor-pointer"
      >
        <Search className="size-3.5" />
        <span>⌘K</span>
      </button>
    </div>
  );
}
