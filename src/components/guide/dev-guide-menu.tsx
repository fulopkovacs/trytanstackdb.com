import { Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GUIDE_SECTIONS } from "@/guide/content";

import {
  markSectionDone,
  markSectionNotDone,
  setActiveSection,
  useActiveSection,
  useDoneSections,
} from "./guide-store";

const NONE = "__none__";

/**
 * Dev-only: drive the guide's state by hand until phase 4 wires it to the app.
 * Highlight any section, or mark sections done.
 */
export function DevGuideMenu() {
  const activeSectionId = useActiveSection();
  const doneSectionIds = useDoneSections();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-dashed"
          aria-label="Guide dev tools"
          title="Guide dev tools"
        >
          <Wrench />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Active section</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={activeSectionId ?? NONE}
              onValueChange={(value) => setActiveSection(value === NONE ? null : value)}
            >
              <DropdownMenuRadioItem value={NONE}>None</DropdownMenuRadioItem>
              {GUIDE_SECTIONS.map((section) => (
                <DropdownMenuRadioItem key={section.id} value={section.id}>
                  {section.shortTitle}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Done sections</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {GUIDE_SECTIONS.filter((section) => section.tryIt).map((section) => (
              <DropdownMenuCheckboxItem
                key={section.id}
                checked={doneSectionIds.has(section.id)}
                onCheckedChange={(checked) =>
                  checked ? markSectionDone(section.id) : markSectionNotDone(section.id)
                }
                // Keep the menu open to tick several.
                onSelect={(event) => event.preventDefault()}
              >
                {section.shortTitle}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
