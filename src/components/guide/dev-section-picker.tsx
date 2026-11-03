import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GUIDE_SECTIONS } from "@/guide/content";

import { setActiveSection, useActiveSection } from "./guide-store";

const NONE = "__none__";

/** Dev-only: highlight any guide section by hand, until phase 4 wires it to app state. */
export function DevSectionPicker() {
  const activeSectionId = useActiveSection();

  return (
    <Select
      value={activeSectionId ?? NONE}
      onValueChange={(value) => setActiveSection(value === NONE ? null : value)}
    >
      <SelectTrigger
        size="sm"
        className="w-32 min-w-0 border-dashed text-xs @md/guide:w-36"
        aria-label="Active section"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>No active section</SelectItem>
        {GUIDE_SECTIONS.map((section) => (
          <SelectItem key={section.id} value={section.id}>
            {section.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
