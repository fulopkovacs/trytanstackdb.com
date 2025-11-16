export type Step = {
  title: string;
  text: string;
};

export const steps: Step[] = [
  "What are collections?",
  "Optimistic updates",
  "Data lifecycle",
].map((title) => ({
  title,
  text: `Text for ${title}`,
}));
