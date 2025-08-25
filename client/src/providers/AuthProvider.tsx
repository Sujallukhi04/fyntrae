import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import type { User } from "@/types/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
  updateuser: (formData: FormData) => Promise<void>;
  changepassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
  updating: boolean;
  changePassword: boolean;
  logoutLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const navigate = useNavigate();

  const forceLogout = () => {
    setUser(null);
    toast.error("Your session has expired, please login again");
  };

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const response = await authApi.getAuthUser();
      setUser(response?.user || null);
    } catch (error: any) {
      if (error.response?.status === 401) {
        try {
          await authApi.refresh();
          const retry = await authApi.getAuthUser();
          setUser(retry?.user || null);
        } catch (refreshErr) {
          forceLogout();
        }
      } else {
        console.error("Auth check failed:", error);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateuser = async (formData: FormData) => {
    try {
      setUpdating(true);
      const response = await authApi.updateUser(formData);
      setUser(response?.user || null);
      toast.success("profile updated successfully");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update organization";
      toast.error(errorMessage);
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  const changepassword = async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    try {
      setChangePassword(true);
      await authApi.changePassword(data);
      toast.success("password changed successfully");
    } catch (error: any) {
      throw error;
    } finally {
      setChangePassword(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = (userData: User) => {
    fetchUser();
  };

  const logout = async () => {
    try {
      setLogoutLoading(true);
      await authApi.logout();
      setUser(null);

      toast.success("logout successfully");
      navigate("/login");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update organization";
      toast.error(errorMessage);
    } finally {
      setLogoutLoading(false);
    }
  };

  const value = {
    user,
    setUser,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refetch: fetchUser,
    updateuser,
    updating,
    changePassword,
    changepassword,
    logoutLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
