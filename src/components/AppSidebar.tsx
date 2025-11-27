import { useLiveQuery } from "@tanstack/react-db";
import { Link, useParams } from "@tanstack/react-router";
import { ChevronDownIcon, FolderClosedIcon, SidebarIcon } from "lucide-react";
import { projectsCollection } from "@/collections/projects";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { HighlightWrapper } from "@/utils/highlight-collection-related-info";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

export function AppSidebar() {
  const { toggleSidebar } = useSidebar();

  const { data: projects } = useLiveQuery((q) =>
    q.from({
      project: projectsCollection,
    }),
  );

  const params = useParams({ strict: false });

  return (
    <Sidebar className="w-64" collapsible="icon">
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    toggleSidebar();
                  }}
                >
                  <SidebarIcon />
                  {/* <SidebarTrigger /> */}
                  <span>Collapse</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <HighlightWrapper highlightId="project_sidebar">
                    <CollapsibleTrigger asChild className="flex items-center">
                      <SidebarMenuButton className={cn("grow")}>
                        <FolderClosedIcon />
                        <span> Projects ({projects.length})</span>
                        {/* <SidebarMenuBadge>{boards.length}</SidebarMenuBadge> */}
                        <ChevronDownIcon className="ml-auto transition-transform duration-200 ease-in-out group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {projects.map((project) => (
                          <SidebarMenuSubItem key={project.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={params.projectId === project.id}
                            >
                              <Link
                                preload={
                                  /*
                      NOTE: People will probably check the network
                    requests to see how TanStack DB works, so it's
                    the best if don't confuse them by preloading
                      data on link hovers etc.
                      */
                                  false
                                }
                                to="/projects/$projectId"
                                params={{ projectId: project.id }}
                                style={
                                  {
                                    // fontWeight:
                                    //   selectedProject === project ? "bold" : "normal",
                                    // color:
                                    //   selectedProject === project ? "#2563eb" : "inherit",
                                  }
                                }
                              >
                                {project.name}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </HighlightWrapper>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
