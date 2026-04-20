import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScreenScaffold } from "@/pages/ScreenScaffold";
import { useHealthDashboardQuery, useSleepMutation } from "@/queries/useHealthQueries";

export function SleepLog() {
  const sleepMutation = useSleepMutation();
  const { data } = useHealthDashboardQuery();
  const [sleptAt, setSleptAt] = useState("");
  const [wokeAt, setWokeAt] = useState("");
  const [qualityRating, setQualityRating] = useState(3);

  const avgHours = useMemo(() => {
    const logs = data?.sleep ?? [];
    if (!logs.length) {
      return 0;
    }
    const total = logs.reduce((sum: number, item: any) => {
      const from = new Date(item.sleptAt).getTime();
      const to = new Date(item.wokeAt).getTime();
      if (Number.isNaN(from) || Number.isNaN(to) || to <= from) {
        return sum;
      }
      return sum + (to - from) / (1000 * 60 * 60);
    }, 0);
    return Number((total / logs.length).toFixed(1));
  }, [data]);

  const submit = async () => {
    if (!sleptAt || !wokeAt) {
      return;
    }
    await sleepMutation.mutateAsync({ sleptAt, wokeAt, qualityRating });
    setSleptAt("");
    setWokeAt("");
    setQualityRating(3);
  };

  return (
    <ScreenScaffold title="Sleep Log" description="Track sleep duration and quality trends.">
      <Card className="space-y-3">
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">Capture bedtime, wake time, and sleep quality so your routine stays consistent during semester load.</p>
        <div>
          <label className="mb-1 block text-label text-dark-gray">Slept At</label>
          <input type="datetime-local" value={sleptAt} onChange={(e) => setSleptAt(e.target.value)} className="focus-ring h-11 w-full rounded-md border border-mid-gray/40 bg-white px-3 text-body-md text-near-black" />
        </div>
        <div>
          <label className="mb-1 block text-label text-dark-gray">Woke At</label>
          <input type="datetime-local" value={wokeAt} onChange={(e) => setWokeAt(e.target.value)} className="focus-ring h-11 w-full rounded-md border border-mid-gray/40 bg-white px-3 text-body-md text-near-black" />
        </div>
        <div>
          <label className="mb-1 block text-label text-dark-gray">Sleep Quality (1-5)</label>
          <input type="range" min={1} max={5} value={qualityRating} onChange={(e) => setQualityRating(Number(e.target.value))} className="w-full" />
          <p className="text-caption text-mid-gray">Current: {qualityRating}/5</p>
        </div>
        <Button type="button" className="w-full" loading={sleepMutation.isPending} onClick={submit}>Save Sleep Log</Button>
      </Card>

      <Card>
        <p className="text-caption text-mid-gray">Recent average sleep</p>
        <p className="text-h3">{avgHours} hours</p>
      </Card>
    </ScreenScaffold>
  );
}
