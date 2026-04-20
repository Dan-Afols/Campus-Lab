import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScreenScaffold } from "@/pages/ScreenScaffold";
import { useHealthDashboardQuery, useWaterMutation } from "@/queries/useHealthQueries";

export function WaterTracker() {
  const [cups, setCups] = useState(1);
  const mutation = useWaterMutation();
  const { data } = useHealthDashboardQuery();

  const weeklyCups = useMemo(
    () => (data?.hydration ?? []).reduce((sum: number, item: any) => sum + Number(item.cups ?? 0), 0),
    [data]
  );

  const submit = async () => {
    await mutation.mutateAsync({ cups, loggedAt: new Date().toISOString() });
    setCups(1);
  };

  return (
    <ScreenScaffold title="Water Tracker" description="Hydration tracking with reminders.">
      <Card className="space-y-3">
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">Log each cup through the day and compare your intake against your personal hydration goal.</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => setCups((prev) => Math.max(1, prev - 1))}>-</Button>
          <div className="rounded-md border border-mid-gray/30 px-4 py-2 text-body-md">{cups} cup{cups > 1 ? "s" : ""}</div>
          <Button type="button" variant="secondary" onClick={() => setCups((prev) => Math.min(20, prev + 1))}>+</Button>
        </div>
        <Button type="button" className="w-full" loading={mutation.isPending} onClick={submit}>Save Hydration Log</Button>
      </Card>

      <Card>
        <p className="text-caption text-mid-gray">Weekly hydration total</p>
        <p className="text-h3">{weeklyCups} cups</p>
      </Card>
    </ScreenScaffold>
  );
}
