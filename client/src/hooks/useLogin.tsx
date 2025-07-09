import { authApi } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { LoginCredentials } from "@/types/auth";
import { useState } from "react";

const useLogin = () => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const loginMutation = async (credentials: LoginCredentials) => {
    try {
      setIsPending(true);
      setError(null);

      const response = await authApi.login(credentials);

      login(response.user);

      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return {
    loginMutation,
    isPending,
    error,
  };
};

export default useLogin;
