import { AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import useAuthUser from "@/hooks/useAuthUser";
import { organizationApi } from "@/lib/api";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { Label } from "@radix-ui/react-label";
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
      const response = await createOrganization({ name: name.trim() });
      navigate("/", {
        replace: true,
      });
    } catch (error) {}
  };

  return (
    <div className="max-w-6xl w-full mx-auto p-3 space-y-8">
      <div className="flex gap-3 flex-col w-full">
        <div className="flex items-center pt-2 justify-between">
          <h1 className="text-xl font-bold">Create Organization</h1>
          <Badge variant="outline" className="text-xs ml-3">
            New Organization
          </Badge>
        </div>
        <Separator className="mb-4 mt-2" />

        <div className="flex gap-6 md:gap-12 w-full md:flex-row  flex-col ">
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
