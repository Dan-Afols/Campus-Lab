import { Laptop, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useRevokeSessionMutation, useSessionsQuery } from "@/queries/useProfileQueries";

export function ActiveSessions() {
  const { data, isLoading } = useSessionsQuery();
  const revoke = useRevokeSessionMutation();
  const sessions = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-3">
      {isLoading ? <Card><p className="text-body-sm">Loading active sessions...</p></Card> : null}
      {sessions.map((session: any, index: number) => (
        <Card key={session.id} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {index === 0 ? <Laptop className="h-5 w-5 text-electric-blue" /> : <Smartphone className="h-5 w-5 text-electric-blue" />}
            <div>
              <p className="text-body-md font-medium">{session.userAgent || "Unknown device"}</p>
              <p className="text-caption text-mid-gray">Last active: {new Date(session.updatedAt || session.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={() => revoke.mutate(session.id)}>Revoke</Button>
        </Card>
      ))}

      {sessions.length > 1 ? (
        <Button
          variant="danger"
          className="w-full"
          onClick={() => sessions.slice(1).forEach((session: any) => revoke.mutate(session.id))}
        >
          Revoke All Other Sessions
        </Button>
      ) : null}
    </div>
  );
}
