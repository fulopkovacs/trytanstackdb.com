import { Link } from "@tanstack/react-router";
import { GithubIcon, HighlighterIcon, XCircleIcon } from "lucide-react";
import { useMemo } from "react";
import z from "zod";

export const highlightParamSchema = z.object({
  highlight: z.enum(["project_all", "boards_all"]).optional(),
});

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
      className="text-xs text-neutral-500 transition-colors underline hover:text-orange-500"
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
  children?: React.ReactNode;
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
      <div className="px-2 py-1 bg-black w-fit rounded-md cursor-pointer hover:bg-neutral-800 transition-colors">
        <Link
          to="."
          search={(s) => ({
            ...s,
            highlight,
          })}
          className="flex items-center no-underline text-white"
        >
          <HighlighterIcon className="h-4 2-4" />
          {children}
        </Link>
      </div>
      <ClearHighlightsButton />
    </div>
  );
}

export function ClearHighlightsButton() {
  return (
    <div className="py-1 w-fit rounded-md cursor-pointer ">
      <Link
        to="."
        search={(s) => ({
          ...s,
          highlight: undefined,
        })}
        className="flex items-center no-underline text-neutral-700 hover:text-black transition-colors"
      >
        <XCircleIcon className="h-4 2-4" />
        Clear Highlights
      </Link>
    </div>
  );
}
