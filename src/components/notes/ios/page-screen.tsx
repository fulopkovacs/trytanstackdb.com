import type { ReactNode } from "react";

import { BackLink, IosScreen, LargeTitle } from "./ui";

/** A pushed iPhone screen for pages that aren't notes (settings, analytics). */
export function IosPageScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <IosScreen leading={<BackLink to="/" aria-label="Folders" />}>
      <LargeTitle title={title} />
      {children}
    </IosScreen>
  );
}
