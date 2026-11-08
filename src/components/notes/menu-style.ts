/**
 * Makes a shadcn menu (context menu, dropdown, or their submenus) look like a
 * macOS 26 menu: frosted glass, rounder corners, a soft shadow.
 *
 * It swaps the theme tokens that the menu, its items and its separators read,
 * so the shadcn components need no changes.
 *
 * The frosted glass sits on a `::before` layer, not on the menu itself: a
 * `backdrop-filter` makes an element the containing block of its fixed
 * descendants, and Radix renders submenus inside their parent menu, so a blur
 * on the menu would trap its submenus inside it.
 */
export const notesMenuClassName =
  "relative isolate rounded-[12px] border-0 bg-transparent p-[5px] text-[13px] shadow-[0_8px_30px_rgb(0_0_0/0.16)] ring-1 ring-black/10 before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-(--mac-menu) before:backdrop-blur-xl before:backdrop-saturate-150 dark:ring-white/10 [&_[role=separator]]:mx-2 [&_[role^=menuitem]]:text-[13px] [--accent-foreground:var(--mac-text)] [--accent:var(--mac-menu-hover)] [--border:var(--mac-menu-separator)] [--popover-foreground:var(--mac-text)]";
