import { Link } from "react-router-dom";
import { CalendarClock, FileUp, Megaphone, ScrollText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ScreenScaffold } from "@/pages/ScreenScaffold";
import { useAuthStore } from "@/stores/authStore";

export function AcademicsHome() {
  const user = useAuthStore((s) => s.user);
  const canManageAcademics = user?.role === "COURSE_REP" || user?.role === "ADMIN";

  return (
    <ScreenScaffold title="Academics" description="Timetable, materials, and study resources.">
      <Card>
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">Find your timetable, course materials, and past questions here. Updates arrive from your department and level in real time.</p>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link to="/academics/timetable">
          <Card className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-electric-blue/10 text-electric-blue"><CalendarClock className="h-5 w-5" /></span>
            <div>
              <p className="text-body-sm font-semibold">View Timetable</p>
              <p className="text-caption text-mid-gray">See your current class schedule</p>
            </div>
          </Card>
        </Link>

        <Link to="/academics/materials">
          <Card className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-electric-blue/10 text-electric-blue"><FileUp className="h-5 w-5" /></span>
            <div>
              <p className="text-body-sm font-semibold">Course Materials</p>
              <p className="text-caption text-mid-gray">Browse and upload materials</p>
            </div>
          </Card>
        </Link>

        <Link to="/academics/past-questions">
          <Card className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-electric-blue/10 text-electric-blue"><ScrollText className="h-5 w-5" /></span>
            <div>
              <p className="text-body-sm font-semibold">Past Questions</p>
              <p className="text-caption text-mid-gray">Practice with past exam papers</p>
            </div>
          </Card>
        </Link>
      </div>

      {canManageAcademics ? (
        <Card className="space-y-3 border-electric-blue/30">
          <h3 className="text-body-sm font-semibold">Course Rep Tools</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link to="/academics/course-rep/timetable-upload">
              <Card className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-green-100 text-green-700"><CalendarClock className="h-5 w-5" /></span>
                <div>
                  <p className="text-body-sm font-semibold">Upload Timetable</p>
                  <p className="text-caption text-mid-gray">Add or update class schedule</p>
                </div>
              </Card>
            </Link>
            <Link to="/academics/course-rep/send-notification">
              <Card className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 text-amber-700"><Megaphone className="h-5 w-5" /></span>
                <div>
                  <p className="text-body-sm font-semibold">Send Notification</p>
                  <p className="text-caption text-mid-gray">Broadcast updates to your level</p>
                </div>
              </Card>
            </Link>
          </div>
        </Card>
      ) : null}
    </ScreenScaffold>
  );
}
