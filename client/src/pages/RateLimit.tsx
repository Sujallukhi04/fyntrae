import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

const RateLimit = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
            Rate Limit Exceeded
          </h1>
          <p className="text-muted-foreground text-lg">
            You've made too many requests. Please wait a moment before trying
            again.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This helps us prevent abuse and ensure a stable service for all
            users.
          </p>

          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RateLimit;
