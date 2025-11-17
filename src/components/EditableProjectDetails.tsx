import { CheckIcon, Edit2Icon } from "lucide-react";
import { useState } from "react";
import { projectsCollection } from "@/collections/projects";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppForm } from "@/hooks/app.form";
import { HighlightWrapper } from "@/utils/highlight-collection-related-info";

function EditProjectNamePopover({ name, id }: { name: string; id: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useAppForm({
    defaultValues: {
      name: name,
    },
    onSubmit: ({ value }) => {
      console.log("New project name:", value.name);
      projectsCollection.update(id, (project) => {
        project.name = value.name;
      });
      setIsOpen(false);
    },
  });

  // onKeyDownCapture={(e) => {
  //   e.stopPropagation();
  //   e.preventDefault();
  //   console.log(e.key);
  //   // form.handleSubmit(e);
  // }}

  return (
    <HighlightWrapper highlightId="editProject">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <Edit2Icon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(e);
            }}
            className="flex items-center gap-2"
          >
            <form.AppField
              name="name"
              validators={{
                onSubmit: ({ value }) => {
                  if (value.trim().length === 0) {
                    return "Project name cannot be empty";
                  }
                },
              }}
              children={(field) => <field.TextField label="New name" />}
            />
            <Button className="self-end ml-auto" type="submit" size="icon">
              <CheckIcon />
            </Button>
          </form>
        </PopoverContent>
      </Popover>
    </HighlightWrapper>
  );
}

export function EditableProjectDetails({
  project,
}: {
  project: { name: string; description?: string; id: string };
}) {
  return (
    <HighlightWrapper highlightId="project_projectPage">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight">
            {project.name || "Project"}
          </h1>
          <EditProjectNamePopover name={project.name} id={project.id} />
        </div>
        <p>{project?.description || ""}</p>
      </div>
    </HighlightWrapper>
  );
}
