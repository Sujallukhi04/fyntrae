import { useEffect } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Link, useLocation, useNavigate } from "react-router";
import { useOrgAccess } from "@/providers/OrgAccessProvider";

export function NavMain({
  items,
  name,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  name?: string;
}) {
  const location = useLocation();
  const { canAccessPage } = useOrgAccess();

  const filteredItems = items.filter((item) => {
    if (item.items && item.items.length > 0) {
      return item.items.some((subItem) => canAccessPage(subItem.url));
    }
    return canAccessPage(item.url);
  });

  // If no allowed items, render nothing
  if (filteredItems.length === 0) return null;

  return (
    <SidebarGroup className="py-1">
      <SidebarGroupLabel>{name}</SidebarGroupLabel>
      <SidebarMenu>
        {filteredItems.map((item) => {
          // Check if this item should be collapsible
          const isCollapsible =
            item.title === "Reporting" && item.items && item.items.length > 0;

          if (isCollapsible) {
            // Filter sub-items as well
            const allowedSubItems =
              item.items?.filter((subItem) => canAccessPage(subItem.url)) || [];
            if (allowedSubItems.length === 0) return null;
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {allowedSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link to={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          // Regular non-collapsible item
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={location.pathname === item.url}
              >
                <Link to={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
