import React from "react";
import { useOrganization } from "@/providers/OrganizationProvider";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Profile = () => {
  const { organization } = useOrganization();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        {organization && (
          <Badge variant="outline" className="text-sm">
            {organization.name}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Name</label>
              <p className="text-lg">{user?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p>{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Week Start
              </label>
              <p>{user?.weekStart}</p>
            </div>
          </CardContent>
        </Card>

        {/* Organization Information */}
        {organization && (
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Organization
                </label>
                <p className="text-lg">{organization.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Currency
                </label>
                <p>{organization.currency}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Date Format
                </label>
                <p>{organization.dateFormat}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Time Format
                </label>
                <p>{organization.timeFormat}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Personal Team
                </label>
                <Badge
                  variant={organization.personalTeam ? "default" : "secondary"}
                >
                  {organization.personalTeam ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Billable Rates Visible
                </label>
                <Badge
                  variant={
                    organization.employeesCanSeeBillableRates
                      ? "default"
                      : "secondary"
                  }
                >
                  {organization.employeesCanSeeBillableRates ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;
