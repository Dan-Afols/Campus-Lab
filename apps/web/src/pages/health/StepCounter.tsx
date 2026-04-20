import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScreenScaffold } from "@/pages/ScreenScaffold";
import { useStepCounter } from "@/hooks/useStepCounter";
import { useHealthDashboardQuery, useStepMutation } from "@/queries/useHealthQueries";

export function StepCounter() {
  const { steps, calories, distanceKm, remaining, dailyGoal } = useStepCounter();
  const { data } = useHealthDashboardQuery();
  const stepMutation = useStepMutation();
  const hasMotionSensor = useMemo(() => typeof window !== "undefined" && "DeviceMotionEvent" in window, []);
  const weeklySteps = useMemo(
    () => (data?.steps ?? []).reduce((sum: number, item: any) => sum + Number(item.steps ?? 0), 0),
    [data]
  );
  const latestLog = data?.steps?.[0];

  const syncSteps = async () => {
    if (steps <= 0) {
      return;
    }
    await stepMutation.mutateAsync({ steps, loggedAt: new Date().toISOString() });
  };

  return (
    <ScreenScaffold title="Step Counter" description="Live motion-based step tracking.">
      <Card className="space-y-3 border-0 text-white" style={{ background: "var(--gradient-health)" }}>
        <p className="text-label text-white/80">Live movement</p>
        <p className="text-body-sm text-white/90">
          {hasMotionSensor
            ? "Sensor is available. Keep the app open while walking for live step capture."
            : "Motion sensor is not available on this device/browser. Use a mobile browser for live step capture."}
        </p>
        <div className="grid grid-cols-2 gap-2 text-white">
          <div className="rounded-xl bg-white/12 p-3">
            <p className="text-caption text-white/80">Steps</p>
            <p className="text-h2">{steps}</p>
          </div>
          <div className="rounded-xl bg-white/12 p-3">
            <p className="text-caption text-white/80">Distance</p>
            <p className="text-h2">{distanceKm.toFixed(2)} km</p>
          </div>
          <div className="rounded-xl bg-white/12 p-3">
            <p className="text-caption text-white/80">Calories</p>
            <p className="text-h2">{calories.toFixed(1)} kcal</p>
          </div>
          <div className="rounded-xl bg-white/12 p-3">
            <p className="text-caption text-white/80">Goal left</p>
            <p className="text-h2">{remaining}</p>
          </div>
        </div>
        <Button type="button" className="w-full bg-white text-near-black hover:bg-white/90" loading={stepMutation.isPending} onClick={syncSteps}>Sync Steps To Health Log</Button>
      </Card>

      <Card className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-caption text-mid-gray">Steps synced this week</p>
          <p className="text-h3">{weeklySteps.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-caption text-mid-gray">Latest synced log</p>
          <p className="text-h3">{latestLog ? Number(latestLog.steps ?? 0).toLocaleString() : "—"}</p>
          <p className="text-caption text-mid-gray">{latestLog?.loggedAt ? new Date(latestLog.loggedAt).toLocaleString() : "No sync yet"}</p>
        </div>
        <Link to="/health" className="sm:col-span-2">
          <Button variant="secondary" className="w-full">View Health Dashboard</Button>
        </Link>
      </Card>
    </ScreenScaffold>
  );
}
