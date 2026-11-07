import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const VARIANTS = {
  note: {
    icon: Info,
    title: "Note",
    className:
      "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
    iconClassName: "text-sky-600 dark:text-sky-400",
  },
  tip: {
    icon: Lightbulb,
    title: "Try it",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    icon: TriangleAlert,
    title: "Watch out",
    className:
      "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
    iconClassName: "text-amber-600 dark:text-amber-400",
  },
} as const;

interface CalloutProps {
  variant?: keyof typeof VARIANTS;
  title?: string;
  children: ReactNode;
}

export function Callout({ variant = "note", title, children }: CalloutProps) {
  const { icon: Icon, className, iconClassName, title: defaultTitle } = VARIANTS[variant];
  return (
    <aside className={cn("my-5 flex gap-3 rounded-xl border px-4 py-3 text-sm", className)}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", iconClassName)} aria-hidden />
      <div className="space-y-1 leading-relaxed">
        <p className="font-semibold">{title ?? defaultTitle}</p>
        <div className="[&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] dark:[&_code]:bg-white/10">
          {children}
        </div>
      </div>
    </aside>
  );
}
