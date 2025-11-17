import CollectionsIntro from "@/data/tutorial/01-collections-intro.mdx";
import OptimisticUpdates from "@/data/tutorial/02-optimistic-updates.mdx";

export type Step = {
  title: string;
  // text: string;
  file: React.ComponentType;
};

// export const steps: Step[] = [
//   "What are collections?",
//   "Optimistic updates",
//   "Data lifecycle",
// ].map((title) => ({
//   title,
//   text: `Text for ${title}`,
//   file: CollectionsIntro,
// }));
//
export const steps: Step[] = [
  {
    title: "What are collections?",
    file: CollectionsIntro,
  },
  {
    title: "Optimistic updates",
    file: OptimisticUpdates,
  },
  {
    title: "Data lifecycle",
    file: CollectionsIntro,
  },
];
