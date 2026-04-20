import { useMemo } from "react";
import { Bell } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useMarkNotificationReadMutation, useNotificationsQuery } from "@/queries/useNotificationsQuery";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type?: string;
  createdAt: string;
  readAt?: string | null;
};

function groupLabel(dateValue: string) {
  const date = new Date(dateValue);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 7) return "This Week";
  return "Older";
}

export function NotificationCenter() {
  const { data, isLoading } = useNotificationsQuery();
  const markReadMutation = useMarkNotificationReadMutation();

  const notifications = (Array.isArray(data) ? data : []) as NotificationItem[];

  const grouped = useMemo(() => {
    return notifications.reduce((acc, item) => {
      const key = groupLabel(item.createdAt);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, NotificationItem[]>);
  }, [notifications]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h2">Notification Center</h2>
        <Button
          variant="ghost"
          onClick={() => {
            notifications.filter((item) => !item.readAt).forEach((item) => markReadMutation.mutate(item.id));
          }}
        >
          Mark all read
        </Button>
      </div>

      {isLoading ? <Card><p className="text-body-sm">Loading notifications...</p></Card> : null}
      {!isLoading && notifications.length === 0 ? (
        <Card className="grid place-items-center py-10 text-center">
          <Bell className="h-10 w-10 text-mid-gray" />
          <p className="mt-2 text-body-sm">You're all caught up!</p>
        </Card>
      ) : null}

      {Object.entries(grouped).map(([label, items]) => (
        <section key={label} className="space-y-2">
          <h3 className="text-label text-mid-gray">{label}</h3>
          {items.map((item) => (
            <Card key={item.id} className={`border-l-4 ${item.readAt ? "border-l-mid-gray/30" : "border-l-electric-blue"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-body-md font-semibold">{item.title || "Notification"}</p>
                  <p className="mt-1 text-body-sm text-dark-gray dark:text-mid-gray">{item.body}</p>
                  <p className="mt-1 text-caption text-mid-gray">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {!item.readAt ? <Badge color="blue">New</Badge> : <Badge color="green">Read</Badge>}
                  {!item.readAt ? (
                    <Button variant="ghost" size="sm" onClick={() => markReadMutation.mutate(item.id)}>
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </section>
      ))}
    </div>
  );
}
