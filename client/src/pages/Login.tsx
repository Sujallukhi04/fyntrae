import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { CircleAlert } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import useLogin from "@/hooks/useLogin";

interface userData {
  email: string;
  password: string;
}

const Login = () => {
  const { loginMutation, isPending, error } = useLogin();
  const [formData, setFormData] = useState<userData>({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginMutation(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center  ">
      <Card className="w-full max-w-md mx-auto  shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Login an account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            )}
            <Button type="submit" className="w-full">
              {isPending ? "Signing Up..." : "Sign Up"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">
              Already have an account?{" "}
            </span>
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
