import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import type { User } from "@/types/auth";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (user: User) => void;
  logout: () => void;
  refetch: () => Promise<void>;
  updateuser: (formData: FormData) => Promise<void>;
  updating: boolean;
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

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const response = await authApi.getAuthUser();
      setUser(response?.user || null);
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateuser = async (formData: FormData) => {
    try {
      setUpdating(true);
      const response = await authApi.updateUser(formData);
      setUser(response?.user || null);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update organization";
      toast.error(errorMessage);
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = (userData: User) => {
    fetchUser();
  };

  const logout = () => {
    setUser(null);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
