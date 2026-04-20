import { Card } from "@/components/ui/Card";
import { ScreenScaffold } from "@/pages/ScreenScaffold";

export function AcademicsHome() {
  return (
    <ScreenScaffold title="Academics" description="Timetable, materials, and study resources.">
      <Card>
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">Find your timetable, course materials, and past questions here. Updates arrive from your department and level in real time.</p>
      </Card>
    </ScreenScaffold>
  );
}
