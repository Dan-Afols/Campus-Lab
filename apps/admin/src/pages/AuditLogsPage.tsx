import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api";
import { Loader2, Download, RefreshCw } from "lucide-react";

export function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");

  const limit = 50;

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(actionFilter && { action: actionFilter }),
      });

      const response = await apiClient.get<any>(`/admin/config/audit-logs?${params}`);
      setLogs(response.data.data || []);
      setTotal(response.data.pagination.total || 0);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get("/admin/config/audit-logs/export");
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    } catch (error) {
      console.error("Failed to export logs:", error);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("CREATED")) return "success";
    if (action.includes("DELETED")) return "destructive";
    if (action.includes("UPDATED")) return "secondary";
    if (action.includes("APPROVED")) return "success";
    if (action.includes("REJECTED")) return "destructive";
    return "default";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Audit Logs</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">System activity and admin actions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchLogs()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="action">Action Type</Label>
              <Input
                id="action"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g., USER_CREATED, MATERIAL_APPROVED..."
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Log ({total})</CardTitle>
          <CardDescription>Page {page} of {Math.ceil(total / limit)}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">No logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{log.actor?.name || "System"}</p>
                          <p className="text-slate-600 dark:text-slate-400">
                            {log.actor?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionColor(log.action) as any}>
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.resource}</TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {log.ipAddress}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {log.details || "—"}
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
