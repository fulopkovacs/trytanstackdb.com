import { Link } from "@tanstack/react-router";
import { FolderClosedIcon, SidebarIcon } from "lucide-react";
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";

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
                <SidebarMenuItem className="">
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
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <FolderClosedIcon />
                    <span>Boards</span>
                  </SidebarMenuButton>
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
