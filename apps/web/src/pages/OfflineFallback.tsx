import { Card } from "@/components/ui/Card";
import { ScreenScaffold } from "@/pages/ScreenScaffold";

export function OfflineFallback() {
  return (
    <ScreenScaffold title="Offline Mode" description="Showing cached content while offline.">
      <Card>
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">You are offline. Cached timetable, materials, and profile data stay available until the connection returns.</p>
      </Card>
    </ScreenScaffold>
  );
}
