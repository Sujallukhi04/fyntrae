import type * as React from "react";
import {
  BookOpen,
  Bot,
  CircleUserRound,
  Clock8,
  FileText,
  FolderOpen,
  Frame,
  GalleryVerticalEnd,
  LayoutDashboard,
  Map,
  PieChart,
  Settings,
  Settings2,
  SquareTerminal,
  Tag,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { TeamSwitcher } from "./team-switcher";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import useAuthUser from "@/hooks/useAuthUser";
import { TimerWidget } from "../TimerWeight";

const formatRole = (role: string) => {
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthUser();
  const userOrganization =
    user?.organizations?.map((org) => ({
      name: org.name,
      logo: GalleryVerticalEnd,
      plan: formatRole(org.role),
      id: org.id,
    })) || [];

  const fallbackTeams = [
    {
      name: "Default Team",
      logo: GalleryVerticalEnd,
      plan: "Free",
      id: "default",
    },
  ];

  const currentOrgId = user?.currentTeamId || "default";

  const data = {
    user: {
      name: user?.name || "User",
      email: user?.email || "guest@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    teams: userOrganization.length > 0 ? userOrganization : fallbackTeams,
    navMain: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
      },
      {
        title: "Time",
        url: "/time",
        icon: Clock8,
      },
      {
        title: "Reporting",
        url: "/reporting",
        icon: PieChart,
        items: [
          {
            title: "Overview",
            url: "/reporting/overview",
          },
          {
            title: "Detailed Reports",
            url: "/reporting/detailed",
          },
        ],
      },
    ],
    manage: [
      {
        title: "Projects",
        url: "/projects",
        icon: FolderOpen,
      },
      {
        title: "Clients",
        url: "/clients",
        icon: CircleUserRound,
      },
      {
        title: "Members",
        url: "/members",
        icon: Users,
      },
      {
        title: "Tags",
        url: "/tags",
        icon: Tag,
      },
      {
        title: "Invoices",
        url: "/invoices",
        icon: FileText,
      },
    ],

    admin: [
      {
        title: "Settings",
        url: `/teams/${currentOrgId}`,
        icon: Settings,
      },
    ],
  };

  return (
    <Sidebar collapsible="offcanvas" className="lg:collapsible-none" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <TimerWidget />
      <SidebarContent className="gap-0">
        <NavMain items={data.navMain} name="Platform" />
        <NavMain items={data.manage} name="Manage" />
        <NavMain items={data.admin} name="Admin" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
