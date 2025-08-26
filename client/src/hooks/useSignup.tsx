import { useState } from "react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { SignupData } from "@/types/auth";
import { toast } from "sonner";

const useSignup = () => {
  const [isPending, setIsPending] = useState(false);
  const signupMutation = async (data: SignupData) => {
    try {
      setIsPending(true);

      const response = await authApi.signup(data);

      toast.success("User registered successfully");

      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Signup failed";
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return {
    signupMutation,
    isPending,
  };
};

export default useSignup;
