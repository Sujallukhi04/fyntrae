import React, { createContext, useContext, useMemo } from "react";
import {
  OrgRolePages,
  OrgRoleApiPermissions,
  type OrgRole,
} from "@/constants/permission";
import { useAuth } from "./AuthProvider";
import { useOrganization } from "./OrganizationProvider";

interface OrgAccessContextType {
  role: OrgRole | null;
  canAccessPage: (path: string) => boolean;
  canCallApi: (apiName: string) => boolean;
  isLoading: boolean;
}

const OrgAccessContext = createContext<OrgAccessContextType | undefined>(
  undefined
);

export const OrgAccessProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoading: isUserLoading } = useAuth();
  const { organization, isLoading: isOrgLoading } = useOrganization();

  const isLoading = isUserLoading || isOrgLoading || !user || !organization;

  const allowedRoles: OrgRole[] = ["OWNER", "ADMIN", "MANAGER", "EMPLOYEE"];
  const role: OrgRole | null = useMemo(() => {
    if (!user || !organization) return null;
    const org = user.organizations?.find((o) => o.id === organization.id);
    return allowedRoles.includes(org?.role as OrgRole)
      ? (org?.role as OrgRole)
      : null;
  }, [user, organization, isLoading]);

  const pathToRegex = (path: string) =>
    new RegExp(
      "^" + path.replace(/:[^/]+/g, "[^/]+").replace(/\//g, "\\/") + "$"
    );

  const canAccessPage = (path: string) => {
    if (!role) return false;

    return OrgRolePages[role].some((allowedPath) => {
      if (allowedPath.includes(":")) {
        return pathToRegex(allowedPath).test(path);
      }
      return allowedPath === path;
    });
  };

  const canCallApi = (apiName: string) => {
    if (!role) return false;
    return OrgRoleApiPermissions[role].includes(apiName);
  };

  return (
    <OrgAccessContext.Provider
      value={{ role, canAccessPage, canCallApi, isLoading }}
    >
      {children}
    </OrgAccessContext.Provider>
  );
};

export const useOrgAccess = () => {
  const ctx = useContext(OrgAccessContext);
  if (!ctx)
    throw new Error("useOrgAccess must be used within OrgAccessProvider");
  return ctx;
};
