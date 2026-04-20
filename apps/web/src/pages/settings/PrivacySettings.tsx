import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { useMeQuery, usePrivacyMutation } from "@/queries/useProfileQueries";

export function PrivacySettings() {
  const { data } = useMeQuery();
  const mutation = usePrivacyMutation();

  const enabled = Boolean(data?.allowCoursemateLocator ?? true);

  return (
    <div className="space-y-3">
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-body-md font-medium">Coursemate Locator</p>
          <p className="text-caption text-mid-gray">Allow classmates to discover your hostel proximity.</p>
        </div>
        <Toggle
          checked={enabled}
          onChange={(checked) => mutation.mutate(checked, { onSuccess: () => toast.success("Privacy updated") })}
        />
      </Card>
    </div>
  );
}
