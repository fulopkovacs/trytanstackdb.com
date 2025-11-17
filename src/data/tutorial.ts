import CollectionsIntro from "@/data/tutorial/01-collections-intro.mdx";

export type Step = {
  title: string;
  text: string;
  file: React.ComponentType;
};

export const steps: Step[] = [
  "What are collections?",
  "Optimistic updates",
  "Data lifecycle",
].map((title) => ({
  title,
  text: `Text for ${title}`,
  file: CollectionsIntro,
}));
