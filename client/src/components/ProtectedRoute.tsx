import React from "react";
import { Navigate, useLocation } from "react-router";
import useAuthUser from "@/hooks/useAuthUser";
import { LoaderMain } from "./Loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuthUser();

  const isAuthenticated = Boolean(user);

  if (isLoading) {
    return <LoaderMain />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
