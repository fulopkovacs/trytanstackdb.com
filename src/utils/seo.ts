// Copied from:
//https://github.com/TanStack/tanstack.com/blob/30a888a492d190cdba0571bd010a250ad0ce5133/src/utils/seo.ts#L1-L33
export const seo = ({
  title,
  description,
  keywords,
  image,
}: {
  title: string;
  description?: string;
  image?: string;
  keywords?: string;
}) => {
  const tags = [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: keywords },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:creator", content: "@notacheetah" },
    { name: "twitter:site", content: "@notacheetah" },
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: "https://trytanstackdb.com" },
    ...(image
      ? [
          { name: "twitter:image", content: image },
          { name: "twitter:card", content: "summary_large_image" },
          { property: "og:image", content: image },
        ]
      : []),
  ];

  return tags;
};
