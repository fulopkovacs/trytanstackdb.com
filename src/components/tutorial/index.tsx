import { Link } from "@tanstack/react-router";
import { GithubIcon, SearchIcon } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import z from "zod";
import { Button } from "../ui/button";

/**
  Naming convention:
    - `project` highlights any ids starting with `project` (e.g., `project`, `project_sidebar`)
*/
export const highlightParamSchema = z.object({
  highlight: z
    .enum([
      "project",
      "project_sidebar",
      "project_projectPage",
      "board",
      "editProject",
      "apiLatencyConfigurator",
    ])
    .optional(),
});

export type HighlightParam = z.infer<typeof highlightParamSchema>["highlight"];

function getFilePathFromGithubFileUrl(href: string) {
  return href.split("src/")[1].replace(/#.*/, "");
}

/**
  A "Source GitHub" link component that extracts
  and displays the file path from a GitHub URL.
*/
export function GHLink({ href }: { href: string }) {
  const label = useMemo(() => {
    try {
      const filePath = getFilePathFromGithubFileUrl(href);
      return filePath;
    } catch (e) {
      return "View source";
    }
  }, [href]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-xs text-neutral-500 transition-colors underline hover:text-orange-500 mb-4 block w-fit"
    >
      <div className="flex items-center gap-1">
        <GithubIcon className="h-4 w-4" /> {label}
      </div>
    </a>
  );
}

export function HighLightComponent({
  h_id: newHighLightGroupId,
  children,
}: {
  h_id: string;
  children?: ReactNode;
}) {
  const highlight = useMemo(() => {
    try {
      return highlightParamSchema.parse({
        highlight: newHighLightGroupId,
      }).highlight;
    } catch (e) {
      return undefined;
    }
  }, [newHighLightGroupId]);

  return (
    <div className="flex items-center gap-2">
      <Link
        to="."
        replace={true}
        search={(s) => ({
          ...s,
          highlight,
        })}
      >
        <Button>
          <SearchIcon />
          {children}
        </Button>
      </Link>
    </div>
  );
}

export function LinkToArticle({
  children,
  articleTitle,
}: {
  children: ReactNode;
  articleTitle: string;
}) {
  const encodedTitle = useMemo(
    () => encodeURIComponent(articleTitle.toLowerCase()),
    [articleTitle],
  );

  return (
    <Link
      to="."
      search={{
        article: encodedTitle,
      }}
      className="text-orange-500 underline hover:text-orange-600 transition-colors cursor-pointer"
    >
      {children}
    </Link>
  );
}
