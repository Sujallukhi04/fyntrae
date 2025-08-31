import { LoaderMain } from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useAuthUser from "@/hooks/useAuthUser";
import { organizationApi } from "@/lib/api";
import { AlertCircle, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

export const TeamInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isUserLoading } = useAuthUser();
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-accept if logged in and token is present
  useEffect(() => {
    const accept = async () => {
      if (!token || !user) return;
      setIsAccepting(true);

      try {
        await organizationApi.acceptInvitation(token);
        toast.success("Invitation accepted!");
        navigate("/", { replace: true });
      } catch (err: any) {
        const message =
          err?.response?.data?.message || "Failed to accept invitation.";
        setError(message);
      } finally {
        setIsAccepting(false);
      }
    };

    if (user && token) accept();
  }, [user, token]);

  // While user is being loaded
  if (isUserLoading) {
    return <LoaderMain />;
  }

  // If not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <User className="h-16 w-16 text-blue-500 mx-auto" />
            <h2 className="text-xl font-semibold">Sign In Required</h2>
            <p className="text-muted-foreground">
              Please sign in to accept this invitation.
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold">Invitation Error</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state while accepting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-muted-foreground">Accepting invitation...</p>
      </div>
    </div>
  );
};
