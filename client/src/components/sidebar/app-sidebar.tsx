import type * as React from "react";
import {
  CircleUserRound,
  Clock8,
  FileText,
  FolderOpen,
  LayoutDashboard,
  PieChart,
  Settings,
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
import { TimerWidget } from "../time/TimerWeight";
import { useAuth } from "@/providers/AuthProvider";

const formatRole = (role: string) => {
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout, logoutLoading } = useAuth();
  const userOrganization =
    user?.organizations?.map((org) => ({
      name: org.name,
      plan: formatRole(org.role),
      id: org.id,
    })) || [];

  const fallbackTeams = [
    {
      id: "default",
      name: "Default Team",
      plan: "Free",
    },
  ];

  const currentOrgId = user?.currentTeamId || "default";

  const data = {
    user: {
      name: user?.name || "User",
      email: user?.email || "guest@example.com",
      avatar: user?.profilePicUrl || "/placeholder.svg?height=32&width=32",
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
            title: "Detailed",
            url: "/reporting/detailed",
          },
          {
            title: "Shared",
            url: "/reporting/shared",
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
        <NavUser
          user={data.user}
          onLogout={logout}
          logoutLoading={logoutLoading}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
