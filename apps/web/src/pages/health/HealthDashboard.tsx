import { Link } from "react-router-dom";
import { Footprints, GlassWater, MoonStar, Bell, Activity } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScreenScaffold } from "@/pages/ScreenScaffold";
import { useHealthDashboardQuery } from "@/queries/useHealthQueries";

function sumBy<T>(items: T[] | undefined, getValue: (item: T) => number) {
  return (items ?? []).reduce((total, item) => total + getValue(item), 0);
}

export function HealthDashboard() {
  const { data, isLoading } = useHealthDashboardQuery();

  const hydrationCups = sumBy(data?.hydration, (entry: any) => Number(entry.cups ?? 0));
  const totalSteps = sumBy(data?.steps, (entry: any) => Number(entry.steps ?? 0));
  const latestStep = data?.steps?.[0];
  const latestHydration = data?.hydration?.[0];
  const latestSleep = data?.sleep?.[0];
  const avgSleepHours = (() => {
    const sleep = data?.sleep ?? [];
    if (!sleep.length) {
      return 0;
    }

    const totalHours = sleep.reduce((total: number, item: any) => {
      const sleptAt = new Date(item.sleptAt).getTime();
      const wokeAt = new Date(item.wokeAt).getTime();
      if (Number.isNaN(sleptAt) || Number.isNaN(wokeAt) || wokeAt <= sleptAt) {
        return total;
      }
      return total + (wokeAt - sleptAt) / (1000 * 60 * 60);
    }, 0);

    return Number((totalHours / sleep.length).toFixed(1));
  })();

  return (
    <ScreenScaffold title="Health Dashboard" description="Steps, hydration, sleep, and reminders.">
      <Card className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-mid-gray/20 p-3">
          <p className="text-caption text-mid-gray">7-day Steps</p>
          <p className="text-h3">{isLoading ? "..." : totalSteps.toLocaleString()}</p>
          <p className="mt-1 text-caption text-dark-gray"><Footprints className="mr-1 inline h-3.5 w-3.5" />Movement tracked</p>
        </div>
        <div className="rounded-lg border border-mid-gray/20 p-3">
          <p className="text-caption text-mid-gray">Hydration (cups)</p>
          <p className="text-h3">{isLoading ? "..." : hydrationCups}</p>
          <p className="mt-1 text-caption text-dark-gray"><GlassWater className="mr-1 inline h-3.5 w-3.5" />Water logs</p>
        </div>
        <div className="rounded-lg border border-mid-gray/20 p-3">
          <p className="text-caption text-mid-gray">Avg Sleep</p>
          <p className="text-h3">{isLoading ? "..." : `${avgSleepHours}h`}</p>
          <p className="mt-1 text-caption text-dark-gray"><MoonStar className="mr-1 inline h-3.5 w-3.5" />Night rest quality</p>
        </div>
        <div className="rounded-lg border border-mid-gray/20 p-3">
          <p className="text-caption text-mid-gray">Reminders</p>
          <p className="text-h3">{latestSleep ? "Tracked" : "Set up"}</p>
          <p className="mt-1 text-caption text-dark-gray"><Bell className="mr-1 inline h-3.5 w-3.5" />{latestSleep ? "Sleep entries saved" : "Enable reminders"}</p>
        </div>
      </Card>

      <Card className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-mid-gray/20 p-3">
          <p className="text-caption text-mid-gray">Latest steps</p>
          <p className="text-h3">{latestStep ? Number(latestStep.steps ?? 0).toLocaleString() : "—"}</p>
          <p className="text-caption text-dark-gray">{latestStep?.loggedAt ? new Date(latestStep.loggedAt).toLocaleString() : "No step sync yet"}</p>
        </div>
        <div className="rounded-lg border border-mid-gray/20 p-3">
          <p className="text-caption text-mid-gray">Latest water log</p>
          <p className="text-h3">{latestHydration ? Number(latestHydration.cups ?? 0) : 0} cups</p>
          <p className="text-caption text-dark-gray">{latestHydration?.loggedAt ? new Date(latestHydration.loggedAt).toLocaleString() : "No water log yet"}</p>
        </div>
        <div className="rounded-lg border border-mid-gray/20 p-3">
          <p className="text-caption text-mid-gray">Latest sleep</p>
          <p className="text-h3">{latestSleep ? `${Number((new Date(latestSleep.wokeAt).getTime() - new Date(latestSleep.sleptAt).getTime()) / (1000 * 60 * 60)).toFixed(1)}h` : "—"}</p>
          <p className="text-caption text-dark-gray">{latestSleep?.sleptAt ? new Date(latestSleep.sleptAt).toLocaleString() : "No sleep log yet"}</p>
        </div>
      </Card>

      <Card className="space-y-2">
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/health/steps"><Button variant="secondary" className="w-full">Track Steps</Button></Link>
          <Link to="/health/water"><Button variant="secondary" className="w-full">Log Water</Button></Link>
          <Link to="/health/sleep"><Button variant="secondary" className="w-full">Log Sleep</Button></Link>
          <Link to="/health/reminders"><Button variant="secondary" className="w-full">Reminders</Button></Link>
        </div>
      </Card>
    </ScreenScaffold>
  );
}
