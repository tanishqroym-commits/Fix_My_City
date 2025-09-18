import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthProvider";
import { Home, UserPlus, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

type UserProfile = {
  id: string;
  email: string;
  role: string;
  last_login: string | null;
  created_at: string;
};

const AdminManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"user" | "admin" | "agent">("user");
  const [creatingUser, setCreatingUser] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        toast({
          title: "Error loading users",
          description: profilesError.message,
          variant: "destructive"
        });
        return;
      }

      // Get user emails from auth.users
      const userIds = profiles?.map(p => p.id) || [];
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) {
        console.error('Error loading auth users:', authError);
        // Fallback: show profiles without emails
        setUsers(profiles?.map(p => ({
          ...p,
          email: 'Email not available'
        })) || []);
        return;
      }

      // Combine profiles with email data
      const usersWithEmails = profiles?.map(profile => {
        const authUser = authUsers.users.find(au => au.id === profile.id);
        return {
          ...profile,
          email: authUser?.email || 'Email not available'
        };
      }) || [];

      setUsers(usersWithEmails);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error loading users",
        description: "Failed to load user data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        toast({
          title: "Error updating role",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      toast({
        title: "Role updated",
        description: `User role changed to ${newRole}`
      });
    } catch (error) {
      toast({
        title: "Error updating role",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const createNewUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast({
        title: "Missing information",
        description: "Please provide both email and password",
        variant: "destructive"
      });
      return;
    }

    setCreatingUser(true);
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true
      });

      if (authError) {
        toast({
          title: "Error creating user",
          description: authError.message,
          variant: "destructive"
        });
        return;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          role: newUserRole,
          last_login: new Date().toISOString()
        });

      if (profileError) {
        toast({
          title: "Error creating profile",
          description: profileError.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "User created successfully",
        description: `${newUserEmail} has been created with ${newUserRole} role`
      });

      // Reset form
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("user");

      // Reload users
      loadUsers();
    } catch (error) {
      toast({
        title: "Error creating user",
        description: "Failed to create new user",
        variant: "destructive"
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'agent': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-100 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950">
        <Header />
        <main className="py-10">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center text-2xl font-bold text-blue-800 dark:text-blue-200 py-20">Loading users...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-100 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950">
      <Header />
      <main className="py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-3xl font-extrabold flex items-center gap-3 text-slate-800 dark:text-white drop-shadow-sm">
              <Shield className="h-7 w-7 text-blue-600 dark:text-blue-300" />
              Admin Management
            </h1>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="shadow">
              <Home className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </div>

          {/* Create New User Section */}
          <Card className="p-8 mb-8 rounded-2xl shadow-xl bg-white/80 dark:bg-slate-900/80 border border-blue-100 dark:border-slate-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <UserPlus className="h-6 w-6" />
              Create New User
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Input
                placeholder="Email address"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                type="email"
                className="rounded-lg border-blue-200 dark:border-slate-700 bg-blue-50/40 dark:bg-slate-800/40 focus:ring-2 focus:ring-blue-400 transition"
              />
              <Input
                placeholder="Password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                type="password"
                className="rounded-lg border-blue-200 dark:border-slate-700 bg-blue-50/40 dark:bg-slate-800/40 focus:ring-2 focus:ring-blue-400 transition"
              />
              <Select value={newUserRole} onValueChange={(value: "user" | "admin" | "agent") => setNewUserRole(value)}>
                <SelectTrigger className="rounded-lg border-blue-200 dark:border-slate-700 bg-blue-50/40 dark:bg-slate-800/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={createNewUser} 
                disabled={creatingUser}
                className="w-full transition"
              >
                {creatingUser ? "Creating..." : "Create User"}
              </Button>
            </div>
          </Card>

          {/* Users List Section */}
          <Card className="p-8 rounded-2xl shadow-xl bg-white/80 dark:bg-slate-900/80 border border-blue-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Users className="h-6 w-6" />
                Manage Users ({users.length})
              </h2>
              <Input
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-64 rounded-lg border-blue-200 dark:border-slate-700 bg-blue-50/40 dark:bg-slate-800/40 focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>

            <div className="space-y-4">
              {filteredUsers.map((userProfile) => (
                <div key={userProfile.id} className="flex items-center justify-between p-6 border border-blue-100 dark:border-slate-800 rounded-xl bg-blue-50/60 dark:bg-blue-900/40 shadow hover:scale-[1.01] hover:shadow-2xl transition-transform">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-semibold text-lg text-slate-800 dark:text-white">{userProfile.email}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          ID: {userProfile.id}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Created: {new Date(userProfile.created_at).toLocaleDateString()}
                          {userProfile.last_login && (
                            <span> • Last login: {new Date(userProfile.last_login).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={getRoleBadgeVariant(userProfile.role)} className={
                      userProfile.role === 'admin' ? 'bg-green-500 text-white' :
                      userProfile.role === 'agent' ? 'bg-blue-400 text-white' :
                      'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }>
                      {userProfile.role}
                    </Badge>
                    <Select
                      value={userProfile.role}
                      onValueChange={(newRole) => updateUserRole(userProfile.id, newRole)}
                    >
                      <SelectTrigger className="w-32 rounded-lg border-blue-200 dark:border-slate-700 bg-blue-50/40 dark:bg-slate-800/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-lg">
                  {searchEmail ? "No users found matching your search" : "No users found"}
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminManagement;
