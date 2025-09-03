import { AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import useAuthUser from "@/hooks/useAuthUser";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { Label } from "@radix-ui/react-label";
import { Settings } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const CreateOrg = () => {
  const { user } = useAuthUser();
  const [name, setName] = useState("");
  const { createOrganization, isCreating } = useOrganization();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Organization name is required");
      return;
    }
    try {
      await createOrganization({ name: name.trim() });
      navigate("/", {
        replace: true,
      });
    } catch (error) {}
  };

  return (
    <div className="mx-auto max-w-6xl py-2 w-full space-y-4">
      <div className="flex flex-col gap-3 py-2">
        <div className="flex flex-col items-start px-5 md:flex-row md:items-center md:justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h1 className="font-semibold">Create Organization</h1>
          </div>
        </div>
        <Separator />

        <div className="flex gap-6 md:gap-12 w-full md:flex-row mt-3 flex-col px-5">
          <div className="md:w-[35%]">
            <h1 className="text-lg font-bold">Organization Details</h1>
            <h1 className="text-sm">
              Create a new organization to collaborate with others on projects.
            </h1>
          </div>
          <Card className="md:w-[65%] pt-6 pb-5">
            <CardContent className="space-y-6 px-0">
              <div className="flex items-center justify-between px-6">
                <div>
                  <Label className="text-sm font-medium ">
                    Organization Owner
                  </Label>
                  <div className="flex items-center space-x-3 mt-2">
                    <Avatar className="h-10 w-10 bg-blue-500 flex justify-center items-center rounded-full">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className=" text-white">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 flex flex-col px-6">
                <Label htmlFor="org-name" className="font-medium text-sm">
                  Organization Name
                </Label>
                <Input
                  id="org-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>

              <Separator className="my-5" />

              <div className="px-6 flex justify-end">
                <Button onClick={handleSubmit} className="w-fit">
                  {isCreating ? "Creating..." : "Create Organization"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateOrg;
