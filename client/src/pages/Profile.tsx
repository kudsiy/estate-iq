import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Calendar, Settings, LogOut, Edit2, Shield, Check, X, Upload, Clock, Lock } from "lucide-react";
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { storagePut } from "@/lib/storage";

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: (data) => {
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const uploadProfilePictureMutation = trpc.auth.uploadProfilePicture.useMutation({
    onSuccess: (data) => {
      toast.success("Profile picture updated!");
      setProfilePictureUrl(data.pictureUrl);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload profile picture");
    },
  });

  const getActivityLogsMutation = trpc.auth.getActivityLogs.useQuery({
    limit: 20,
  });

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed successfully!");
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to change password");
    },
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>You need to be authenticated to view your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = "/api/oauth/login"}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    await updateProfileMutation.mutateAsync({
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
    });
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
    });
    setIsEditing(false);
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const { url, key } = await storagePut(
        `profile-pictures/${user.id}-${Date.now()}.${file.name.split('.').pop()}`,
        new Uint8Array(buffer),
        file.type
      );

      await uploadProfilePictureMutation.mutateAsync({
        imageUrl: url,
        imageKey: key,
      });
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword) {
      toast.error("Current password is required");
      return;
    }

    if (!passwordData.newPassword) {
      toast.error("New password is required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!/[A-Z]/.test(passwordData.newPassword)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }

    if (!/[a-z]/.test(passwordData.newPassword)) {
      toast.error("Password must contain at least one lowercase letter");
      return;
    }

    if (!/[0-9]/.test(passwordData.newPassword)) {
      toast.error("Password must contain at least one number");
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.newPassword)) {
      toast.error("Password must contain at least one special character");
      return;
    }

    await changePasswordMutation.mutateAsync({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-lg text-muted-foreground">Manage your account information and preferences</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2"
            disabled={updateProfileMutation.isPending}
          >
            <Edit2 className="w-4 h-4" />
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        {/* User Profile Card */}
        <Card className="border-2 border-accent bg-accent/5">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center overflow-hidden">
                  {profilePictureUrl ? (
                    <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-accent text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Upload profile picture"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                  disabled={uploadProfilePictureMutation.isPending}
                />
              </div>
              <div>
                <CardTitle className="text-2xl">{formData.name || "Agent"}</CardTitle>
                <CardDescription>{formData.email || "No email provided"}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Account Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your name"
                      disabled={updateProfileMutation.isPending}
                    />
                  ) : (
                    <div className="px-4 py-2 rounded-lg border border-input bg-background text-foreground">
                      {user.name || "Not provided"}
                    </div>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                      disabled={updateProfileMutation.isPending}
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background text-foreground">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {user.email || "Not provided"}
                    </div>
                  )}
                </div>

                {/* User ID */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <div className="px-4 py-2 rounded-lg border border-input bg-background text-foreground font-mono text-sm">
                    {user.id}
                  </div>
                </div>

                {/* Login Method */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Login Method</label>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background text-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    {user.loginMethod || "OAuth"}
                  </div>
                </div>

                {/* Account Created */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Account Created</label>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background text-foreground">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </div>
                </div>

                {/* Last Sign In */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Last Sign In</label>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background text-foreground">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {new Date(user.lastSignedIn).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>
              </div>

              {/* Edit Actions */}
              {isEditing && (
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="gap-2 flex-1"
                  >
                    <Check className="w-4 h-4" />
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateProfileMutation.isPending}
                    className="gap-2 flex-1"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* User Role */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-lg font-semibold text-foreground">Account Status</h3>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-background border border-input">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <div>
                  <p className="font-semibold text-foreground">Active Account</p>
                  <p className="text-sm text-muted-foreground">
                    Role: <span className="font-semibold capitalize">{user.role || "user"}</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Log Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              <CardTitle>Activity Log</CardTitle>
            </div>
            <CardDescription>Recent account activities and login history</CardDescription>
          </CardHeader>
          <CardContent>
            {getActivityLogsMutation.isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading activity logs...</div>
            ) : getActivityLogsMutation.data && getActivityLogsMutation.data.length > 0 ? (
              <div className="space-y-3">
                {getActivityLogsMutation.data.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-background border border-input">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground capitalize">{log.action.replace(/_/g, ' ')}</p>
                      {log.description && (
                        <p className="text-sm text-muted-foreground">{log.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No activity logs yet</div>
            )}
          </CardContent>
        </Card>

        {/* Settings Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-accent" />
                <CardTitle>Security</CardTitle>
              </div>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Your account is protected by OAuth authentication. Secure your account with a password.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-accent" />
                <CardTitle>Preferences</CardTitle>
              </div>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                  <span className="text-sm font-medium text-foreground">Email notifications</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                  <span className="text-sm font-medium text-foreground">Lead alerts</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <Card className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-700">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Sign Out</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Sign out from your current session.
              </p>
              <Button 
                variant="outline" 
                className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Current Password</label>
                  <Input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">New Password</label>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password (min 8 characters)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Confirm Password</label>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex gap-3">
                <Button
                  onClick={handlePasswordChange}
                  disabled={changePasswordMutation.isPending}
                  className="flex-1"
                >
                  {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
