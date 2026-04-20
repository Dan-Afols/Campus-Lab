import { useState } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { useNotificationPrefsMutation } from "@/queries/useProfileQueries";

const defaults = {
  materials: true,
  news: true,
  classReminders: true,
  hostel: true,
  finance: false
};

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState(defaults);
  const mutation = useNotificationPrefsMutation();

  const update = (key: keyof typeof defaults, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    mutation.mutate(next, { onSuccess: () => toast.success("Preferences saved") });
  };

  return (
    <div className="space-y-3">
      {Object.entries(prefs).map(([key, value]) => (
        <Card key={key} className="flex items-center justify-between">
          <div>
            <p className="text-body-md font-medium">{key}</p>
            <p className="text-caption text-mid-gray">Receive {key} updates</p>
          </div>
          <Toggle checked={value} onChange={(checked) => update(key as keyof typeof defaults, checked)} />
        </Card>
      ))}
    </div>
  );
}
