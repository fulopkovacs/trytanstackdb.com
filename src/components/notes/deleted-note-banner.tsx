import { restoreNote } from "@/db/mutations";
import { cn } from "@/lib/utils";

/** Notes in Recently Deleted are read-only, like in Notes; recover one to edit it again. */
export function DeletedNoteBanner({
  noteId,
  variant,
  onRestored,
}: {
  noteId: string;
  variant: "mac" | "ios";
  onRestored?: () => void;
}) {
  return (
    <div
      className={cn(
        "mx-auto mt-2 mb-1 flex max-w-md items-center justify-between gap-3 rounded-xl bg-black/[0.04] px-3 py-2 dark:bg-white/[0.06]",
        variant === "ios" ? "text-[15px]" : "text-[12px]",
      )}
    >
      <span className="text-mac-text-secondary">Recently deleted notes can't be edited.</span>
      <button
        type="button"
        onClick={() => {
          restoreNote(noteId);
          onRestored?.();
        }}
        className="shrink-0 font-semibold text-notes-accent"
      >
        Recover
      </button>
    </div>
  );
}
