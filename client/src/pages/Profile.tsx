import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Camera, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  FormField,
  SaveButton,
  SectionCard,
  SectionHeader,
} from "./Dashboard/Reusable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { authApi } from "@/lib/api";

const Profile = () => {
  const { user, updating, updateuser } = useAuth();

  // State for profile form
  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || ""); // not editable
  const [avatar, setAvatar] = useState<string | null>(
    user?.profilePicUrl || null
  );

  // State for password update
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(",")[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uintArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uintArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([arrayBuffer], { type: "image/jpeg" }); // Adjust MIME type if necessary
  };

  // Handlers
  const handleProfileSave = async () => {
    if (!name) {
      toast.error("Name is required!");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);

    if (avatar && avatar !== user?.profilePicUrl) {
      const file = dataURItoBlob(avatar);
      formData.append("file", file);
    }

    try {
      await updateuser(formData);
    } catch (error) {}
  };

  const handlePasswordSave = () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Updating password:", { currentPassword, newPassword });
    // 👉 Call your API here, e.g. updatePassword({ currentPassword, newPassword })
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        "Are you sure you want to delete your account? This cannot be undone."
      )
    ) {
      console.log("Deleting account...");
      // 👉 Call your API here, e.g. deleteAccount()
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mx-auto max-w-6xl py-2 w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 py-2">
        <div className="flex flex-col items-start px-5 md:flex-row md:items-center md:justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <h1 className="font-semibold">Profile Settings</h1>
          </div>
        </div>
        <Separator />
      </div>

      {/* Profile Information */}
      <div className="flex gap-6 md:gap-12 w-full md:flex-row flex-col px-5">
        <SectionHeader
          title="Profile Information"
          description="Update your account's profile information and email address."
        />
        <SectionCard>
          <div className="space-y-6">
            <div className="flex items-center justify-between px-6">
              <div className="flex items-center space-x-3 mt-2">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={avatar || "https://avatar.iran.liara.run/public/19"}
                  />
                  <AvatarFallback className="bg-blue-500 text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  id="avatar-upload"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("avatar-upload")?.click()
                  }
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Select A Photo
                </Button>
              </div>
            </div>

            <FormField label="Name">
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>

            <FormField label="Email">
              <Input id="email" value={email} disabled />
            </FormField>

            <Separator className="my-5" />
            <SaveButton isLoading={updating} onClick={handleProfileSave} />
          </div>
        </SectionCard>
      </div>

      <Separator />

      {/* Password Update */}
      <div className="flex gap-6 md:gap-12 w-full md:flex-row flex-col px-5">
        <SectionHeader
          title="Update Password"
          description="Ensure your account is using a long, random password to stay secure."
        />
        <SectionCard>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <FormField label="Current Password">
                <Input
                  type="password"
                  id="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
              </FormField>

              <FormField label="New Password">
                <Input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                />
              </FormField>

              <FormField label="Confirm Password">
                <Input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                />
              </FormField>
            </div>

            <Separator className="my-4" />
            <SaveButton isLoading={false} onClick={handlePasswordSave} />
          </div>
        </SectionCard>
      </div>

      <Separator />

      {/* Delete Account */}
      <div className="flex gap-6 md:gap-12 w-full md:flex-row flex-col px-5">
        <SectionHeader
          title="Delete Account"
          description="Permanently delete your account."
        />
        <Card className="md:w-[65%]">
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                Once your account is deleted, all of its resources and data will
                be permanently deleted. Before deleting your account, please
                download any data or information that you wish to retain.
              </AlertDescription>
            </Alert>
            <Button
              className="w-fit cursor-pointer hover:bg-red-500/50 bg-red-500/80 text-white"
              onClick={handleDeleteAccount}
            >
              DELETE ACCOUNT
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
