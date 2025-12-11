import { LoaderMain } from "@/components/Loader";
import SidebarNav from "@/components/sidebar/SidebarNav";
import { useOrganization } from "@/providers/OrganizationProvider";
import React from "react";
import { Outlet } from "react-router";

const Dashboard: React.FC = () => {
  const { isLoading, error } = useOrganization();

  if (isLoading) {
    return <LoaderMain />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error loading organization</div>
          <div className="text-sm text-gray-600">{error}</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <SidebarNav>
        <Outlet />
      </SidebarNav>
    </div>
  );
};

export default Dashboard;
