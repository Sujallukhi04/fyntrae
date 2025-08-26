import { authApi } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { LoginCredentials } from "@/types/auth";
import { useState } from "react";
import { toast } from "sonner";

const useLogin = () => {
  const [isPending, setIsPending] = useState(false);
  const { login } = useAuth();

  const loginMutation = async (credentials: LoginCredentials) => {
    try {
      setIsPending(true);

      const response = await authApi.login(credentials);

      login();

      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Login failed";
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return {
    loginMutation,
    isPending,
  };
};

export default useLogin;
