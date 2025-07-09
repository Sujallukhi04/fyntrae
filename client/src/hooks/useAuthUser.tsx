import { useAuth } from "@/providers/AuthProvider";

const useAuthUser = () => {
  const { user, isLoading, isAuthenticated } = useAuth();

  return {
    user,
    isLoading,
    isAuthenticated,
  };
};

export default useAuthUser;