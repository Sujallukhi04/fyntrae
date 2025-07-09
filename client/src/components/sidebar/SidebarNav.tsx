import { Separator } from "@/components/ui/separator";
import {
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { GalleryVerticalEnd } from "lucide-react";
import { TeamSwitcher } from "./team-switcher";
import useAuthUser from "@/hooks/useAuthUser";

interface SidebarNavProps {
  children?: React.ReactNode;
}

const formatRole = (role: string) => {
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

const SidebarNav: React.FC<SidebarNavProps> = ({ children }) => {
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
  const data = {
    teams: userOrganization.length > 0 ? userOrganization : fallbackTeams,
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex max-lg:h-16 justify-between  max-lg:border-b shrink-0 items-center gap-2 transition-[width,height] ease-linear">
          {/* Left side - Trigger icon for mobile */}
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="h-8 w-8 lg:hidden" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {/* You can add breadcrumbs or other left-side content here */}
          </div>

          <div className="lg:hidden">
            <SidebarHeader>
              <TeamSwitcher teams={data.teams} />
            </SidebarHeader>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default SidebarNav;
