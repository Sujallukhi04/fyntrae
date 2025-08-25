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
import { toast } from "sonner";

const Profile = () => {
  const { user, updating, updateuser, changepassword, changePassword } =
    useAuth();

  // State for profile form
  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || ""); // not editable
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.profilePicUrl || null
  );
  // State for password update
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // const [showDeleteModal, setShowDeleteModal] = useState(false);
  // const [deletePassword, setDeletePassword] = useState("");
  // const [deleteError, setDeleteError] = useState<string | null>(null);
  // const [deleting, setDeleting] = useState(false);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file)); // for preview
    }
  };

  // Handlers
  const handleProfileSave = async () => {
    if (!name) {
      toast.error("Name is required!");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);

    if (avatar) {
      formData.append("file", avatar);
    }

    try {
      await updateuser(formData);
    } catch (error) {
      setAvatar(null);
      setAvatarPreview(user?.profilePicUrl || null);
    }
  };

  const handlePasswordSave = async () => {
    const errors: typeof passwordErrors = {};

    if (!currentPassword)
      errors.currentPassword = "Current password is required.";

    if (!newPassword) {
      errors.newPassword = "New password is required.";
    } else if (newPassword.length < 8) {
      errors.newPassword = "New password must be at least 8 characters.";
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setPasswordErrors(errors);

    // stop if any validation errors
    if (Object.keys(errors).length > 0) return;

    try {
      await changepassword({ currentPassword, newPassword });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors({});
    } catch (error: any) {
      setPasswordErrors({
        currentPassword:
          error?.response?.data?.message || "Failed to update password",
      });
    }
  };

  // const handleDeleteAccount = async () => {
  //   setDeleting(true);
  //   setDeleteError(null);

  //   try {
  //     // 👉 Call your API here, passing `deletePassword`
  //     // await deleteAccount({ currentPassword: deletePassword });

  //     toast.success("Account deleted successfully");
  //     setShowDeleteModal(false);
  //     setDeletePassword("");
  //   } catch (error: any) {
  //     setDeleteError(
  //       error?.response?.data?.message || "Failed to delete account"
  //     );
  //   } finally {
  //     setDeleting(false);
  //   }
  // };

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
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={avatarPreview || undefined} alt="image" />
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
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-red-400 mt-1">
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </FormField>

              <FormField label="New Password">
                <Input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-red-400 mt-1">
                    {passwordErrors.newPassword}
                  </p>
                )}
              </FormField>

              <FormField label="Confirm Password">
                <Input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-400 mt-1">
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </FormField>
            </div>

            <Separator className="my-4" />
            <SaveButton
              isLoading={changePassword}
              onClick={handlePasswordSave}
            />
          </div>
        </SectionCard>
      </div>

      {/* <Separator /> */}

      {/* <div className="flex gap-6 md:gap-12 w-full md:flex-row flex-col px-5">
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
              onClick={() => setShowDeleteModal(true)}
            >
              DELETE ACCOUNT
            </Button>
          </CardContent>
        </Card>
      </div>
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <AlertDialogHeader>
            <DialogTitle>Confirm Account Deletion</DialogTitle>
          </AlertDialogHeader>

          <p className="text-sm text-muted-foreground mb-2">
            Are you sure you want to delete your account? This action is
            permanent and will erase all your data. Please enter your password
            to confirm.
          </p>

          <Input
            type="password"
            placeholder="Enter current password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />
          {deleteError && (
            <p className="text-sm text-red-500 mt-1">{deleteError}</p>
          )}

          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDeleteAccount}
              disabled={!(deletePassword.length >= 8) || deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? "Deleting..." : "Delete Account"}
            </Button>
          </AlertDialogFooter>
        </DialogContent>
      </Dialog> */}
    </div>
  );
};

export default Profile;
