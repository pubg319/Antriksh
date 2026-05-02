import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { Button } from "../components/Button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { toast } from "sonner";
import { User, Mail, Shield, Lock, Loader2, Camera } from "lucide-react";

export function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Form states
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetchUserAndProfile();
  }, []);

  async function fetchUserAndProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setUser(session.user);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;

      setProfile(profileData);
      setName(profileData.name || "");
      setAvatarUrl(profileData.avatar_url || "");
    } catch (error: any) {
      toast.error("Error fetching profile: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setUpdating(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      setProfile({ ...profile, name, avatar_url: avatarUrl });
    } catch (error: any) {
      toast.error("Error updating profile: " + error.message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error("Error changing password: " + error.message);
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-12">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sidebar info */}
            <div className="md:col-span-1">
              <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-b from-primary/5 to-background">
                <CardContent className="pt-8 flex flex-col items-center text-center">
                  <div className="relative group mb-4">
                    <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                      <AvatarImage src={avatarUrl || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                        {name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="text-white w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">{name || "User"}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                  <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium uppercase tracking-wider">
                    <Shield className="w-3 h-3" />
                    {profile?.role || "Student"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main forms */}
            <div className="md:col-span-2 space-y-8">
              {/* Profile Details */}
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <User className="w-5 h-5 text-[#5B47ED]" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="Your Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                          <Input
                            id="email"
                            value={user?.email || ""}
                            readOnly
                            className="bg-muted text-muted-foreground pl-10"
                          />
                          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        <p className="text-[12px] text-muted-foreground italic">Email cannot be changed.</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avatar">Avatar URL</Label>
                        <Input
                          id="avatar"
                          placeholder="https://example.com/avatar.jpg"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={updating} className="w-full md:w-auto">
                      {updating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Update Profile"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Security/Password */}
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Lock className="w-5 h-5 text-[#5B47ED]" />
                    Security
                  </CardTitle>
                  <CardDescription>Change your password to keep your account secure.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={changingPassword} variant="outline" className="w-full md:w-auto">
                      {changingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
