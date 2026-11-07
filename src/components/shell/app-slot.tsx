import { useLayoutEffect, useRef } from "react";

/**
 * Where the Notes app currently sits on screen. The app itself is rendered
 * once (into `host`, through a portal) and the active layout's slot adopts
 * the host element, so crossing a breakpoint moves the app's DOM instead of
 * recreating its React tree.
 */
export function AppSlot({ host }: { host: HTMLElement }) {
  const slotRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    slot.append(host);
    return () => {
      if (host.parentElement === slot) host.remove();
    };
  }, [host]);

  return <div ref={slotRef} className="h-full" />;
}
