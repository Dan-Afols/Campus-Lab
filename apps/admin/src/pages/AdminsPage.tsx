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
import { Select } from "@/components/ui/select";

interface Admin {
  id: string;
  email: string;
  fullName?: string;
  name?: string;
  status: string;
  createdAt: string;
  adminRole?: string;
  schoolId?: string;
  collegeId?: string;
  departmentId?: string;
}

interface School {
  id: string;
  name: string;
  colleges?: College[];
}

interface College {
  id: string;
  name: string;
  departments?: Department[];
}

interface Department {
  id: string;
  name: string;
}

export function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [adminType, setAdminType] = useState<"global" | "university" | "college" | "department">("global");
  const [schools, setSchools] = useState<School[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    schoolId: "",
    collegeId: "",
    departmentId: "",
  });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const getErrorMessage = (error: any, fallback: string) => {
    return error?.response?.data?.message || fallback;
  };

  useEffect(() => {
    fetchAdmins();
    fetchSchools();
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

  const fetchSchools = async () => {
    try {
      const response = await apiClient.get<any>("/admin/academic/schools");
      setSchools(response.data || []);
    } catch (error) {
      console.error("Failed to fetch schools:", error);
    }
  };

  const handleSchoolChange = async (schoolId: string) => {
    setFormData({ ...formData, schoolId, collegeId: "", departmentId: "" });
    if (schoolId) {
      const school = schools.find((s) => s.id === schoolId);
      if (school?.colleges) {
        setColleges(school.colleges);
      }
    }
  };

  const handleCollegeChange = async (collegeId: string) => {
    setFormData({ ...formData, collegeId, departmentId: "" });
    if (collegeId) {
      const college = colleges.find((c) => c.id === collegeId);
      if (college?.departments) {
        setDepartments(college.departments);
      }
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.password) {
      alert("Please fill all required fields");
      return;
    }

    if (formData.password.length < 12) {
      alert("Password must be at least 12 characters");
      return;
    }

    if (adminType !== "global" && !formData.schoolId) {
      alert("Please select a school");
      return;
    }

    if (adminType === "college" && !formData.collegeId) {
      alert("Please select a college");
      return;
    }

    if (adminType === "department" && !formData.departmentId) {
      alert("Please select a department");
      return;
    }

    try {
      setCreatingAdmin(true);
      const payload: any = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      };

      if (formData.phoneNumber) payload.phoneNumber = formData.phoneNumber;
      if (formData.emergencyContactName) payload.emergencyContactName = formData.emergencyContactName;
      if (formData.emergencyContactPhone) payload.emergencyContactPhone = formData.emergencyContactPhone;

      if (adminType === "university") {
        payload.schoolId = formData.schoolId;
      } else if (adminType === "college") {
        payload.collegeId = formData.collegeId;
      } else if (adminType === "department") {
        payload.departmentId = formData.departmentId;
      }

      await apiClient.post("/admin/users/admins", payload);
      setFormData({
        fullName: "",
        email: "",
        password: "",
        phoneNumber: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        schoolId: "",
        collegeId: "",
        departmentId: "",
      });
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
            <CardDescription>Create a new admin with optional scope restrictions</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              {/* Admin Type Selection */}
              <div>
                <Label htmlFor="adminType">Admin Type</Label>
                <Select
                  value={adminType}
                  onChange={(e) => setAdminType(e.target.value as "global" | "university" | "college" | "department")}
                  className="mt-2"
                >
                  <option value="global">Global Admin (All Access)</option>
                  <option value="university">University Admin (School-specific)</option>
                  <option value="college">College Admin (College-specific)</option>
                  <option value="department">Department Admin (Department-specific)</option>
                </Select>
              </div>

              {/* Scope Selection */}
              {adminType !== "global" && (
                <>
                  <div>
                    <Label htmlFor="school">Select School/University</Label>
                    <Select
                      value={formData.schoolId}
                      onChange={(e) => void handleSchoolChange(e.target.value)}
                      className="mt-2"
                    >
                      <option value="">Select a school</option>
                      {schools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {adminType !== "university" && formData.schoolId && (
                    <div>
                      <Label htmlFor="college">Select College</Label>
                      <Select
                        value={formData.collegeId}
                        onChange={(e) => void handleCollegeChange(e.target.value)}
                        className="mt-2"
                      >
                        <option value="">Select a college</option>
                        {colleges.map((college) => (
                          <option key={college.id} value={college.id}>
                            {college.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}

                  {adminType === "department" && formData.collegeId && (
                    <div>
                      <Label htmlFor="department">Select Department</Label>
                      <Select
                        value={formData.departmentId}
                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                        className="mt-2"
                      >
                        <option value="">Select a department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}
                </>
              )}

              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
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
                <Label htmlFor="password">Temporary Password (min 12 chars) *</Label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="08012345678"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="emergency">Emergency Contact Name</Label>
                  <Input
                    id="emergency"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    placeholder="Contact Name"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  placeholder="08012345678"
                  className="mt-2"
                />
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
                    <TableHead>Role</TableHead>
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
                        <Badge variant="secondary">
                          {admin.adminRole || "SUPER_ADMIN"}
                        </Badge>
                      </TableCell>
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
