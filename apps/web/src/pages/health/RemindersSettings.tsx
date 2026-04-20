import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { ScreenScaffold } from "@/pages/ScreenScaffold";

const STORAGE_KEY = "campuslab_health_reminders";

type RemindersState = {
  hydration: boolean;
  sleep: boolean;
  movementBreaks: boolean;
  medication: boolean;
};

const defaultState: RemindersState = {
  hydration: true,
  sleep: true,
  movementBreaks: true,
  medication: false
};

export function RemindersSettings() {
  const [state, setState] = useState<RemindersState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState;
    } catch {
      return defaultState;
    }
  });

  const enabledCount = useMemo(() => Object.values(state).filter(Boolean).length, [state]);

  const update = (key: keyof RemindersState, value: boolean) => {
    setState((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const reset = () => {
    setState(defaultState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
  };

  return (
    <ScreenScaffold title="Reminders" description="Manage recurring wellbeing reminders.">
      <Card className="space-y-3">
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">Choose reminder times for classes, water, and health habits, then sync them across devices.</p>
        <p className="text-caption text-mid-gray">Enabled reminders: {enabledCount}/4</p>

        <div className="flex items-center justify-between rounded-md border border-mid-gray/20 px-3 py-2">
          <p className="text-body-sm">Hydration every 2 hours</p>
          <Toggle checked={state.hydration} onChange={(value) => update("hydration", value)} />
        </div>

        <div className="flex items-center justify-between rounded-md border border-mid-gray/20 px-3 py-2">
          <p className="text-body-sm">Sleep wind-down prompt</p>
          <Toggle checked={state.sleep} onChange={(value) => update("sleep", value)} />
        </div>

        <div className="flex items-center justify-between rounded-md border border-mid-gray/20 px-3 py-2">
          <p className="text-body-sm">Movement break during study</p>
          <Toggle checked={state.movementBreaks} onChange={(value) => update("movementBreaks", value)} />
        </div>

        <div className="flex items-center justify-between rounded-md border border-mid-gray/20 px-3 py-2">
          <p className="text-body-sm">Medication reminder</p>
          <Toggle checked={state.medication} onChange={(value) => update("medication", value)} />
        </div>

        <Button type="button" variant="ghost" onClick={reset}>Reset to Default</Button>
      </Card>
    </ScreenScaffold>
  );
}
