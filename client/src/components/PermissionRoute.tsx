import React from "react";
import { useLocation, Navigate } from "react-router";
import { useOrgAccess } from "@/providers/OrgAccessProvider";
import { LoaderMain } from "./Loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const PermissionRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { canAccessPage, isLoading } = useOrgAccess();
  const location = useLocation();
  const path = location.pathname;

  if (isLoading) {
    return <LoaderMain />;
  }

  if (!canAccessPage(path)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PermissionRoute;
