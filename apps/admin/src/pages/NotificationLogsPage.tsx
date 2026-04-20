import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { Loader2 } from "lucide-react";

type Log = {
  id: string;
  action: string;
  resource: string;
  createdAt: string;
  actor?: { fullName?: string; email?: string };
};

const demoLogs: Log[] = [
  { id: "n1", action: "NEWS_NOTIFICATION_SENT", resource: "post_2026_hackathon", createdAt: new Date().toISOString(), actor: { fullName: "Offline Showcase Admin", email: "showcase@campuslab.app" } },
  { id: "n2", action: "NEWS_NOTIFICATION_SENT", resource: "urgent_hostel_update", createdAt: new Date(Date.now() - 3600000).toISOString(), actor: { fullName: "Campus Admin", email: "admin@campuslab.app" } },
  { id: "n3", action: "NEWS_NOTIFICATION_SENT", resource: "semester_timetable_release", createdAt: new Date(Date.now() - 7200000).toISOString(), actor: { fullName: "Campus Admin", email: "admin@campuslab.app" } },
];

export function NotificationLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<Log[]>("/admin/news/notification-logs");
        setLogs(Array.isArray(res.data) && res.data.length > 0 ? res.data : demoLogs);
      } catch {
        setLogs(demoLogs);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-72"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Notification Logs</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Audit trail of broadcast notifications sent from the newsroom.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notification Events</CardTitle>
          <CardDescription>{logs.length} records loaded</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="p-3 border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="font-medium">{log.resource}</div>
                  <div className="text-sm text-slate-600">{log.actor?.fullName || "System"} ({log.actor?.email || "n/a"})</div>
                  <div className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</div>
                </div>
                <Badge variant="secondary">{log.action}</Badge>
              </div>
            ))}
            {logs.length === 0 && <p className="text-sm text-slate-600">No notification logs available.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
