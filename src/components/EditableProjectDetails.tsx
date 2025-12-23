import { eq, useLiveQuery } from "@tanstack/react-db";
import { CheckIcon, Edit2Icon, RotateCwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ProjectsNotFoundFromAPIError,
  projectsCollection,
} from "@/collections/projects";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppForm } from "@/hooks/app.form";
import { HighlightWrapper } from "@/utils/highlight-collection-related-info";
import { Skeleton } from "./ui/skeleton";

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

function ProjectsNotFoundFromAPIErrorMessage() {
  return (
    <div className="flex flex-col gap-10">
      <p className="text-destructive-foreground">Error: API returned a 404.</p>
      <div className="flex gap-4 flex-col text-muted-foreground">
        <p>
          We use a service worker to simulate the backend APi. Sometimes it's
          not working properly, typically after a hard refresh of the page.
        </p>
        <p>Please try refreshing the page by clicking the button below!</p>
      </div>
      <Button
        className="grow-0 shrink w-fit mx-auto"
        onClick={() => {
          window.location.reload();
        }}
      >
        <RotateCwIcon /> Refresh page
      </Button>
    </div>
  );
}

function LoadingEditableProjects() {
  return (
    <div className="flex flex-col mb-6 gap-1">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8  scroll-m-40 text-2xl font-bold w-20" />
      </div>
      <Skeleton className="h-(--text-2xl) w-80" />
    </div>
  );
}

export function EditableProjectDetails({ projectId }: { projectId: string }) {
  const {
    data: [project],
    isLoading,
    isReady,
  } = useLiveQuery(
    (q) =>
      q
        .from({ project: projectsCollection })
        .where(({ project }) => eq(project.id, projectId)),
    [projectId],
  );

  const [notFoundErrorMessageVisible, setNotFoundErrorMessageVisible] =
    useState(false);

  useEffect(() => {
    if (!project && isReady) {
      /*
        NOTE:
        Sometimes typically after a hard refresh), the service worker
        is not able to serve the API requests, and they all result in
        404 errors. We need to tell the user that they should try
        a normal refresh in these cases.

        By default, query collection sync errors will not throw,
        so we'll have to manually check if there's an error, when
        the `isReady` flag is true.

        https://tanstack.com/db/latest/docs/guides/error-handling#query-collection-sync-errors
      */
      const lastError = projectsCollection.utils.lastError;
      if (lastError instanceof ProjectsNotFoundFromAPIError) {
        setNotFoundErrorMessageVisible(true);
      }
    }
  }, [project, isReady]);

  return notFoundErrorMessageVisible ? (
    /*
      The API returned a 404 error when trying to sync the
      projects collection.
    */
    <ProjectsNotFoundFromAPIErrorMessage />
  ) : isReady && !project ? (
    // The collection is ready, but no project was found
    // with this particular live query
    <div className="text-muted-foreground">
      <p>No project was found with this id.</p>
      <p>Please select a project from the sidebar!</p>
    </div>
  ) : (
    <HighlightWrapper highlightId="project_projectPage">
      <div className="flex flex-col mb-6 gap-1">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="flex items-center h-9">
              <Skeleton className="h-8 w-40" />
            </div>
          ) : (
            <>
              <h1 className="scroll-m-20 text-2xl font-bold">{project.name}</h1>
              <EditProjectNamePopover name={project.name} id={project.id} />
            </>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="h-6 block w-80" />
        ) : (
          <p>{project.description}</p>
        )}
      </div>
    </HighlightWrapper>
  );
}
