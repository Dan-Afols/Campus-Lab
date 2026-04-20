import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface CourseRep {
  id: string;
  email: string;
  fullName?: string;
  name?: string;
  status: string;
  createdAt: string;
  courses?: Array<{ id: string; code: string; name: string }>;
}

export function CourseRepsPage() {
  const [reps, setReps] = useState<CourseRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const limit = 20;

  useEffect(() => {
    fetchReps();
  }, [page]);

  const fetchReps = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>(
        `/admin/users/course-reps?page=${page}&limit=${limit}`
      );
      setReps(response.data.data || []);
      setTotal(response.data.pagination.total || 0);
    } catch (error) {
      console.error("Failed to fetch course reps:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (repId: string) => {
    try {
      setActionLoading(repId);
      await apiClient.post(`/admin/users/course-reps/${repId}/approve`);
      fetchReps();
    } catch (error) {
      console.error("Failed to approve:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (repId: string) => {
    if (!window.confirm("Confirm rejection?")) return;

    try {
      setActionLoading(repId);
      await apiClient.post(`/admin/users/course-reps/${repId}/reject`, {
        reason: "Application rejected by admin",
      });
      fetchReps();
    } catch (error) {
      console.error("Failed to reject:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLock = async (repId: string) => {
    if (!window.confirm("Lock this course rep account?")) return;

    try {
      setActionLoading(repId);
      await apiClient.post(`/admin/users/course-reps/${repId}/lock`);
      fetchReps();
    } catch (error) {
      console.error("Failed to lock:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (repId: string) => {
    try {
      setActionLoading(repId);
      await apiClient.post(`/admin/users/course-reps/${repId}/activate`);
      fetchReps();
    } catch (error) {
      console.error("Failed to activate:", error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Course Representatives</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Manage course representative applications and permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Course Representatives ({total})</CardTitle>
          <CardDescription>Page {page}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : reps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">No course representatives found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Courses Assigned</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reps.map((rep) => (
                    <TableRow key={rep.id}>
                      <TableCell className="font-medium">{rep.fullName || rep.name}</TableCell>
                      <TableCell>{rep.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {(rep.courses || []).length > 0 ? (
                            (rep.courses || []).slice(0, 2).map((course) => (
                              <Badge key={course.id} variant="secondary">
                                {course.code}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500">None</span>
                          )}
                          {(rep.courses || []).length > 2 && (
                            <Badge variant="secondary">+{(rep.courses || []).length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            rep.status === "ACTIVE"
                              ? "success"
                              : rep.status === "PENDING"
                                ? "warning"
                                : "destructive"
                          }
                        >
                          {rep.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {rep.status === "PENDING" ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(rep.id)}
                                disabled={actionLoading === rep.id}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(rep.id)}
                                disabled={actionLoading === rep.id}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          ) : null}

                          {rep.status === "ACTIVE" ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleLock(rep.id)}
                              disabled={actionLoading === rep.id}
                            >
                              Lock
                            </Button>
                          ) : null}

                          {rep.status === "LOCKED" || rep.status === "REJECTED" ? (
                            <Button
                              size="sm"
                              onClick={() => handleActivate(rep.id)}
                              disabled={actionLoading === rep.id}
                            >
                              Activate
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

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
