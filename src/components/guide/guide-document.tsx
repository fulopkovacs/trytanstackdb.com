import { GUIDE_SECTIONS } from "@/guide/content";

import { GuideSection } from "./guide-section";

export function GuideDocument() {
  return (
    <article className="mx-auto w-full max-w-[68ch] px-2 pt-4 pb-24 sm:px-4">
      <header className="px-5 pt-6 pb-4 sm:px-7">
        <p className="text-sm font-medium text-muted-foreground">An interactive guide</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-balance">
          Learn TanStack DB by poking at a notes app
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-foreground/75">
          Read the guide, play with the app. The section that matches what you're doing in the app
          lights up.
        </p>
      </header>
      {GUIDE_SECTIONS.map((section) => (
        <GuideSection
          key={section.id}
          id={section.id}
          eyebrow={section.eyebrow}
          title={section.title}
          tryIt={section.tryIt}
        >
          {section.content}
        </GuideSection>
      ))}
    </article>
  );
}
