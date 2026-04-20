import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Admin {
  id: string;
  email: string;
  fullName?: string;
  name?: string;
  status: string;
  createdAt: string;
}

export function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const getErrorMessage = (error: any, fallback: string) => {
    return error?.response?.data?.message || fallback;
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>("/admin/users/admins");
      setAdmins(response.data || []);
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.password) {
      alert("Please fill all fields");
      return;
    }

    if (formData.password.length < 12) {
      alert("Password must be at least 12 characters");
      return;
    }

    try {
      setCreatingAdmin(true);
      await apiClient.post("/admin/users/admins", formData);
      setFormData({ fullName: "", email: "", password: "" });
      setShowCreateForm(false);
      alert("Admin created successfully");
      fetchAdmins();
    } catch (error) {
      console.error("Failed to create admin:", error);
      alert(getErrorMessage(error, "Failed to create admin account"));
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;

    try {
      await apiClient.delete(`/admin/users/admins/${adminId}`, {
        data: { confirmed: true },
      });
      alert("Admin deleted successfully");
      fetchAdmins();
    } catch (error) {
      console.error("Failed to delete admin:", error);
      alert(getErrorMessage(error, "Failed to delete admin"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Manage system administrator accounts</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Admin
        </Button>
      </div>

      {/* Create Admin Form */}
      {showCreateForm && (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
          <CardHeader>
            <CardTitle className="text-lg">Create New Admin Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@campuslab.app"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="password">Temporary Password (min 12 chars)</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="mt-2"
                />
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Admin must set up 2FA on first login
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={creatingAdmin}>
                  {creatingAdmin && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Admin Accounts ({admins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">No admin accounts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.fullName || admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Badge variant={admin.status === "ACTIVE" ? "success" : "destructive"}>
                          {admin.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteAdmin(admin.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
