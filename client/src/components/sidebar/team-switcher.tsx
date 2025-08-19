import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import useAuthUser from "@/hooks/useAuthUser";
import { useOrganization } from "@/providers/OrganizationProvider";
import { useNavigate } from "react-router";

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    id: string;
    plan: string;
  }[];
}) {
  const { isMobile } = useSidebar();
  const { user } = useAuthUser();
  const { isSwitching, switchOrganization } = useOrganization();
  const navigate = useNavigate();
  const activeTeam = React.useMemo(() => {
    if (user?.currentTeamId) {
      return teams.find((team) => team.id === user.currentTeamId) || teams[0];
    }
    return teams[0];
  }, [user?.currentTeamId, teams]);

  const handleTeamSwitch = async (team: (typeof teams)[0]) => {
    if (team.id === user?.currentTeamId) return;
    try {
      navigate("/", {
        replace: true,
      });
      await switchOrganization(team.id);
    } catch (err) {}
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
                {activeTeam.name.charAt(0).toUpperCase()}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeTeam.name}
                </span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </div>
              {isSwitching ? (
                <Loader2 className="ml-auto animate-spin size-4" />
              ) : (
                <ChevronsUpDown className="ml-auto" />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Teams
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => handleTeamSwitch(team)}
                className="gap-3 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border text-white text-xs font-semibold">
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{team.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {team.plan}
                  </span>
                </div>
                {/* Show check icon for current team */}
                <div className="flex gap-2">
                  {team.id === user?.currentTeamId && (
                    <div className="flex items-center justify-center size-4 rounded-full bg-primary/15 animate-in fade-in-0 duration-200">
                      <Check className="size-3 text-primary" />
                    </div>
                  )}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate("/teams/create")}
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
