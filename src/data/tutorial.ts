import CollectionsIntro from "@/data/tutorial/01-collections-intro.mdx";
import HowDoCollectionsWork from "@/data/tutorial/02-how-do-collections-work.mdx";
import OptimisticUpdates from "@/data/tutorial/02-optimistic-updates.mdx";

export type Step = {
  title: string;
  // text: string;
  file: React.ComponentType;
  nextStepName?: string;
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
const stepsWithoutNames: Omit<Step, "nextSteName">[] = [
  {
    title: "What are collections?",
    file: CollectionsIntro,
  },
  {
    title: "Optimistic updates",
    file: OptimisticUpdates,
  },
  {
    title: "How do collections work?",
    file: HowDoCollectionsWork,
  },
  {
    title: "Data lifecycle",
    file: CollectionsIntro,
  },
];

export const steps: Step[] = stepsWithoutNames.map((step, index) => ({
  ...step,
  nextStepName: stepsWithoutNames[index + 1]?.title,
}));
