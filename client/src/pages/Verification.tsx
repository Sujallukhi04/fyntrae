import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, AlertCircle, Mail } from "lucide-react";
import { Link, useLocation } from "react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api";

const VerifyPage = () => {
  const location = useLocation();
  const [status, setStatus] = useState<
    "pending" | "success" | "error" | "missing"
  >("pending");

  const getTokenFromQuery = () => {
    const params = new URLSearchParams(location.search);
    return params.get("token");
  };

  useEffect(() => {
    const token = getTokenFromQuery();

    if (!token) {
      setStatus("missing");
      toast.error("Missing verification token.");
      return;
    }

    const verifyToken = async () => {
      try {
        await authApi.verifyEmail(token);
        setStatus("success");
        toast.success("Your email has been successfully verified!");
      } catch (error: any) {
        setStatus("error");
        const errorMessage =
          error.response?.data?.message || "Failed to update organization";
        toast.error(errorMessage);
      }
    };

    verifyToken();
  }, [location.search]);

  const getStatusContent = () => {
    switch (status) {
      case "success":
        return {
          title: "Email Verified Successfully!",
          description: "Your account is now active and ready to use",
          icon: <Check className="h-10 w-10 text-green-400" />,
        };
      case "error":
        return {
          title: "Verification Failed",
          description: "The verification link is invalid or has expired",
          icon: <X className="h-10 w-10 text-red-400" />,
        };
      case "missing":
        return {
          title: "Missing Token",
          description: "No verification token provided in the URL",
          icon: <AlertCircle className="h-10 w-10 text-red-400" />,
        };
      default:
        return {
          title: "Verifying Your Account",
          description: "Please wait while we verify your email address",
          icon: <Loader2 className="h-10 w-10 animate-spin text-blue-400" />,
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className="bg-card flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Card className="">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{statusContent.title}</CardTitle>
            <CardDescription>{statusContent.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status Icon Display */}
              <div
                className={cn(
                  "flex items-center justify-center rounded-lg border p-8",
                  status === "error" || status === "missing"
                    ? "bg-red-900/20 border-red-600/50"
                    : status === "success"
                    ? "bg-green-900/20 border-green-600/50"
                    : "bg-blue-900/20 border-blue-600/50"
                )}
              >
                {statusContent.icon}
              </div>

              {/* Action Buttons */}
              <div className="grid gap-3">
                {status === "success" && (
                  <Link to="/login" className="w-full">
                    <Button className="w-full">
                      <Mail className="mr-2 h-4 w-4" />
                      Continue to Login
                    </Button>
                  </Link>
                )}

                {(status === "error" || status === "missing") && (
                  <div className="grid gap-3">
                    <Link to="/login" className="w-full">
                      <Button className="w-full">
                        <Mail className="mr-2 h-4 w-4" />
                        Back to Login
                      </Button>
                    </Link>
                  </div>
                )}

                {status === "pending" && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>This may take a few moments...</span>
                  </div>
                )}
              </div>

              {status === "success" && (
                <div className="text-center text-sm text-muted-foreground">
                  Welcome to our platform! You can now access all features.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyPage;
