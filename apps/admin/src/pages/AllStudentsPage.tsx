import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api";
import { Search, Loader2, Lock, RotateCcw, Trash2 } from "lucide-react";

interface Student {
  id: string;
  email: string;
  fullName?: string;
  name?: string;
  matricNumber?: string;
  status: string;
  createdAt: string;
  department: {
    name: string;
    college: {
      name: string;
      school: { name: string };
    };
  };
}

export function AllStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const getErrorMessage = (error: any, fallback: string) => {
    return error?.response?.data?.message || fallback;
  };

  useEffect(() => {
    fetchStudents();
  }, [search, status, page]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(status && { status }),
      });

      const response = await apiClient.get<any>(`/admin/users/students?${params}`);
      setStudents(response.data.data || []);
      setTotal(response.data.pagination.total || 0);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (studentId: string) => {
    if (!window.confirm("Are you sure you want to suspend this student?")) return;

    try {
      await apiClient.post(`/admin/users/students/${studentId}/suspend`, {
        reason: "Suspended by admin",
      });
      alert("Student suspended successfully");
      fetchStudents();
    } catch (error) {
      console.error("Failed to suspend student:", error);
      alert(getErrorMessage(error, "Failed to suspend student"));
    }
  };

  const handleUnsuspend = async (studentId: string) => {
    if (!window.confirm("Unsuspend this student account?")) return;

    try {
      await apiClient.post(`/admin/users/students/${studentId}/unsuspend`);
      alert("Student unsuspended successfully");
      fetchStudents();
    } catch (error) {
      console.error("Failed to unsuspend student:", error);
      alert(getErrorMessage(error, "Failed to unsuspend student"));
    }
  };

  const handleResetPassword = async (studentId: string) => {
    try {
      await apiClient.post(`/admin/users/students/${studentId}/reset-password`);
      alert("Password reset link sent to student email");
    } catch (error) {
      console.error("Failed to reset password:", error);
      alert(getErrorMessage(error, "Failed to reset password"));
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;

    try {
      await apiClient.delete(`/admin/users/students/${studentId}`, {
        data: { confirmed: true, reason: "Deleted by admin" },
      });
      alert("Student deleted successfully");
      fetchStudents();
    } catch (error) {
      console.error("Failed to delete student:", error);
      alert(getErrorMessage(error, "Failed to delete student"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">All Students</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Manage student accounts and access</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Name, email, or matric number..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="mt-2"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="LOCKED">Locked</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Students ({total})</CardTitle>
          <CardDescription>Page {page}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Matric No.</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.fullName || student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.matricNumber || "N/A"}</TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {student.department?.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.status === "ACTIVE"
                              ? "success"
                              : student.status === "LOCKED"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResetPassword(student.id)}
                            title="Reset password"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          {student.status === "LOCKED" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnsuspend(student.id)}
                              title="Unsuspend account"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSuspend(student.id)}
                              title="Suspend account"
                            >
                              <Lock className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(student.id)}
                            title="Delete account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex gap-2 mt-4 justify-center">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button variant="outline" disabled>
                Page {page} of {Math.ceil(total / limit)}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(total / limit)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
