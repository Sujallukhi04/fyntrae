import { useState } from "react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { SignupData } from "@/types/auth";

const useSignup = () => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const signupMutation = async (data: SignupData) => {
    try {
      setIsPending(true);
      setError(null);

      const response = await authApi.signup(data);

      login(response.user);

      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Signup failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return {
    signupMutation,
    isPending,
    error,
  };
};

export default useSignup;
