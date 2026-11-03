import { Signature, Users } from "lucide-react";

import { cn } from "@/lib/utils";

/** The yellow Quick Notes tile from the Notes sidebar. */
export function QuickNotesIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-[5px] bg-notes-quick text-white",
        className,
      )}
    >
      <Signature className="size-[70%]" strokeWidth={2.2} />
    </span>
  );
}

/** The blue Shared tile from the Notes sidebar. */
export function SharedIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-[5px] bg-notes-shared text-white",
        className,
      )}
    >
      <Users className="size-[70%]" strokeWidth={2.4} />
    </span>
  );
}

/** Account avatar: initials on a gradient, like an iCloud account without a photo. */
export function AccountAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#a1a1aa] to-[#71717a] text-[11px] font-semibold text-white",
        className,
      )}
    >
      {initials}
    </span>
  );
}
