import { useState, useEffect, useRef } from "react";
import { usePage, router } from "@inertiajs/react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { classNames } from "@/lib/utils";

type NotesContentProps = {
  defaultBucketSlug?: string;
  defaultTab?: "global" | "bucket";
};

type SavingStatus = "idle" | "saving" | "saved" | "error";

export function NotesContent({
  defaultBucketSlug,
  defaultTab = "global",
}: NotesContentProps) {
  const { auth, nav_buckets } = usePage<any>().props;

  const user = auth.user;
  const buckets = nav_buckets || [];

  const [activeTab, setActiveTab] = useState<"global" | "bucket">(defaultTab);
  const [selectedBucketSlug, setSelectedBucketSlug] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [savingStatus, setSavingStatus] = useState<SavingStatus>("idle");

  useEffect(() => {
    if (defaultBucketSlug) {
      setSelectedBucketSlug(defaultBucketSlug);
      setActiveTab("bucket");
    } else if (buckets.length > 0 && !selectedBucketSlug) {
      setSelectedBucketSlug(buckets[0].slug);
    }
  }, [defaultBucketSlug, buckets]);

  const currentOriginalContent = (() => {
    if (activeTab === "global") {
      return user.notes || "";
    }
    const currentBucket = buckets.find((b: any) => b.slug === selectedBucketSlug);
    return currentBucket?.notes || "";
  })();

  const activeId = activeTab === "global" ? user.id : selectedBucketSlug;
  const lastLoadedRef = useRef({ tab: activeTab, id: activeId });

  useEffect(() => {
    if (lastLoadedRef.current.tab !== activeTab || lastLoadedRef.current.id !== activeId) {
      setLocalContent(currentOriginalContent);
      setSavingStatus("idle");
      lastLoadedRef.current = { tab: activeTab, id: activeId };
    } else if (savingStatus !== "saving") {
      setLocalContent(currentOriginalContent);
    }
  }, [activeTab, activeId, currentOriginalContent, savingStatus]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveNote = (value: string) => {
    if (value === currentOriginalContent) return;
    setSavingStatus("saving");

    router.post(
      "/notes",
      {
        type: activeTab,
        id: activeTab === "global" ? user.id : selectedBucketSlug,
        content: value,
      },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => setSavingStatus("saved"),
        onError: () => setSavingStatus("error"),
      }
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalContent(val);
    setSavingStatus("idle");

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(val);
    }, 800);
  };

  const handleBlur = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveNote(localContent);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const renderStatus = () => {
    switch (savingStatus) {
      case "saving":
        return (
          <div className="flex items-center gap-1 text-[11px] text-tt-text-secondary select-none">
            <Loader2 className="size-3 animate-spin text-tt-accent" />
            <span>Saving…</span>
          </div>
        );
      case "saved":
        return (
          <div className="flex items-center gap-1 text-[11px] text-tt-positive select-none">
            <Check className="size-3" />
            <span>Saved</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-1 text-[11px] text-tt-negative select-none">
            <AlertCircle className="size-3" />
            <span>Failed to save</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 pt-2 pb-4">
      <div className="flex items-center justify-between border-b border-tt-border pb-2 px-1">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("global")}
            className={classNames(
              "text-[13px] font-semibold pb-1.5 border-b-2 transition-colors cursor-pointer focus:outline-none",
              activeTab === "global"
                ? "border-tt-accent text-tt-text"
                : "border-transparent text-tt-text-secondary hover:text-tt-text"
            )}
          >
            Global
          </button>
          <button
            onClick={() => setActiveTab("bucket")}
            className={classNames(
              "text-[13px] font-semibold pb-1.5 border-b-2 transition-colors cursor-pointer focus:outline-none",
              activeTab === "bucket"
                ? "border-tt-accent text-tt-text"
                : "border-transparent text-tt-text-secondary hover:text-tt-text"
            )}
          >
            Buckets
          </button>
        </div>
        <div>{renderStatus()}</div>
      </div>

      {activeTab === "bucket" && (
        <div className="mt-3">
          <select
            value={selectedBucketSlug}
            onChange={(e) => setSelectedBucketSlug(e.target.value)}
            className="w-full border border-tt-border bg-tt-surface px-3 py-2 text-[12px] font-medium text-tt-text focus:outline-none focus:ring-1 focus:ring-tt-accent transition-all"
          >
            {buckets.map((b: any) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1 min-h-0 mt-3 flex flex-col">
        <textarea
          value={localContent}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={
            activeTab === "global"
              ? "Write down anything important for your workspace…"
              : "Write notes, goals, or rules for this bucket…"
          }
          className="w-full flex-1 min-h-[220px] resize-none border border-tt-border bg-tt-surface p-3 text-[13px] text-tt-text placeholder:text-tt-text-tertiary focus:outline-none focus:ring-1 focus:ring-tt-accent focus:border-tt-accent font-sans leading-relaxed"
        />
      </div>
    </div>
  );
}
