import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Home, ArrowLeft, Search, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router";

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="text-9xl font-bold text-primary/20 select-none">
                  404
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <AlertTriangle className="h-16 w-16 text-destructive" />
                </div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Page Not Found</CardTitle>
            <p className="text-lg text-muted-foreground">
              Sorry, we couldn't find the page you're looking for.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert>
              <Search className="h-4 w-4" />
              <AlertDescription>
                The page you are looking for might have been removed, had its
                name changed, or is temporarily unavailable.
              </AlertDescription>
            </Alert>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">What you can do:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="w-6 h-6 p-0 flex items-center justify-center"
                  >
                    1
                  </Badge>
                  Check the URL for any typos
                </li>
                <li className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="w-6 h-6 p-0 flex items-center justify-center"
                  >
                    2
                  </Badge>
                  Go back to the previous page
                </li>
                <li className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="w-6 h-6 p-0 flex items-center justify-center"
                  >
                    3
                  </Badge>
                  Visit our homepage
                </li>
              </ul>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>

              <Button
                onClick={handleGoHome}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go to Homepage
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Need help?{" "}
                <Link
                  to="/contact"
                  className="text-primary hover:underline font-medium"
                >
                  Contact Support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
