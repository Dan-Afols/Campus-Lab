import { Card } from "@/components/ui/Card";
import { ScreenScaffold } from "@/pages/ScreenScaffold";

export function LandingPage() {
  return (
    <ScreenScaffold title="Campus Lab" description="Student-first campus operating system.">
      <Card>
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">Track classes, announcements, hostel status, and academic resources from one Campus Lab home screen.</p>
      </Card>
    </ScreenScaffold>
  );
}
