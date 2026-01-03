import CollectionsIntro from "@/data/tutorial/collections-intro.mdx";
import HowDoCollectionsWork from "@/data/tutorial/how-do-collections-work.mdx";
import OptimisticUpdates from "@/data/tutorial/optimistic-updates.mdx";
import WhatIsNext from "@/data/tutorial/what-is-next.mdx";

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
const tutorialArticlesWithoutNextSteps: Step[] = [
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
    title: "What is next?",
    file: WhatIsNext,
  },
];

export const tutorialArticles: Step[] = tutorialArticlesWithoutNextSteps.map(
  (step, index) => ({
    ...step,
    nextStepName: tutorialArticlesWithoutNextSteps[index + 1]?.title,
  }),
);

const deepDiveArticlesWithoutNextSteps: Step[] = [
  // {
  //   title: "Optimistic Actions",
  //   file: OptimisticActions,
  // },
];

// export const deepDiveArticles: Step[] = deepDiveArticlesWithoutNextSteps.map(
//   (step, index) => ({
//     ...step,
//     nextStepName: deepDiveArticlesWithoutNextSteps[index + 1]?.title,
//   }),
// );

export const deepDiveArticles: Step[] = deepDiveArticlesWithoutNextSteps;

export const steps = [...tutorialArticles, ...deepDiveArticles];
