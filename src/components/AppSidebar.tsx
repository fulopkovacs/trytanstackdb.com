import { Link } from "@tanstack/react-router";
import {
  ChevronDownIcon,
  FolderClosedIcon,
  PlusIcon,
  SidebarIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Button } from "./ui/button";

// } from "@/registry/new-york-v4/ui/sidebar"

type Board = {
  id: string;
  name: string;
};

export function AppSidebar({
  boards,
  user,
  // onSelect,
}: {
  boards: Board[];
  user: {
    name: string;
    id: string;
    image?: string | null | undefined;
  };
}) {
  const { toggleSidebar, open } = useSidebar();

  return (
    <SidebarProvider className="w-auto" open={open} defaultOpen>
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
                    <CollapsibleTrigger asChild className="flex items-center">
                      <SidebarMenuButton className="grow">
                        <FolderClosedIcon />
                        <span>Boards ({boards.length})</span>
                        {/* <SidebarMenuBadge>{boards.length}</SidebarMenuBadge> */}
                        <ChevronDownIcon className="ml-auto transition-transform duration-200 ease-in-out group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {boards.map((board) => (
                          <SidebarMenuSubItem key={board.id}>
                            <SidebarMenuSubButton asChild>
                              <Link
                                to="/boards/$boardId"
                                params={{ boardId: board.id }}
                                style={
                                  {
                                    // fontWeight:
                                    //   selectedProject === project ? "bold" : "normal",
                                    // color:
                                    //   selectedProject === project ? "#2563eb" : "inherit",
                                  }
                                }
                              >
                                {board.name}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
                <SidebarMenuItem>
                  <SidebarMenuButton variant={"outline"}>
                    <PlusIcon />
                    <span>Create new board</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Avatar>
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>

              <span>{user.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
