import { Bell, Download, FileText, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { GradientCard } from "@/components/ui/GradientCard";
import { useHealthDashboardQuery } from "@/queries/useHealthQueries";
import { useDashboardQuery } from "@/queries/useDashboardQuery";
import { useAuthStore } from "@/stores/authStore";

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data } = useDashboardQuery();
  const { data: healthData } = useHealthDashboardQuery();
  const rawLevel = (user as any)?.departmentLevel?.level ?? (user as any)?.level;
  const rawDepartment = (user as any)?.department;
  const parsedLevel =
    typeof rawLevel === "string"
      ? Number.parseInt(rawLevel, 10)
      : typeof rawLevel === "number"
        ? rawLevel
        : typeof rawLevel?.level === "number"
          ? rawLevel.level
          : Number.NaN;
  const levelLabel = Number.isFinite(parsedLevel) ? `${parsedLevel >= 100 ? parsedLevel : parsedLevel * 100}L` : "300L";
  const departmentLabel =
    typeof rawDepartment === "string" ? rawDepartment : typeof rawDepartment?.name === "string" ? rawDepartment.name : "Computer Engineering";
  const stepsToday = (healthData?.steps ?? []).reduce((sum: number, entry: any) => sum + Number(entry.steps ?? 0), 0);

  return (
    <div className="space-y-5">
      <section className="rounded-b-[24px] px-5 pb-5 pt-4 text-white" style={{ background: "var(--gradient-brand)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/profile" aria-label="Open profile" className="focus-ring rounded-full">
              <Avatar name={user?.fullName ?? "Student"} src={(user as any)?.profilePhotoUrl} size={44} />
            </Link>
            <div>
              <p className="text-label text-white/80">Welcome back</p>
              <h2 className="text-h3">{user?.fullName ?? "Student"}</h2>
            </div>
          </div>
          <Link to="/notifications" aria-label="Notifications" className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-white/20">
            <Bell className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-2 text-body-sm text-white/85">{levelLabel} · {departmentLabel}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            "4 Classes Today",
            "3 New Materials",
            "2 Alerts",
            `${stepsToday.toLocaleString()} Steps`
          ].map((item) => (
            <span key={item} className="glass-chip rounded-full px-3 py-1.5 text-center text-caption">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-3 px-1">
        <div className="flex items-center justify-between">
          <h3 className="text-h3">Today's Classes</h3>
          <Badge color="blue">Live</Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {["MTH 301", "CPE 309", "GST 302"].map((course, index) => (
            <motion.div key={course} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
              <Card className="border-l-4 border-l-electric-blue">
                <p className="text-label text-electric-blue">{course}</p>
                <p className="mt-1 text-body-sm">Lecture Hall {index + 2}</p>
                <p className="text-caption text-mid-gray">10:{index}0 AM</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-h3">New Materials</h3>
          <a className="text-body-sm text-electric-blue" href="/academics/materials">See All</a>
        </div>
        <div className="space-y-2">
          {["Fluid Mechanics Notes", "Signals Cheat Sheet", "Hostel Rules PDF"].map((title) => (
            <Card key={title} variant="list-item" className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-electric-blue/12 text-electric-blue">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-body-sm font-medium">{title}</p>
                  <p className="text-caption text-mid-gray">Updated today</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge color="violet">AI</Badge>
                <Download className="h-4 w-4 text-mid-gray" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <GradientCard gradient="health">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-label text-white/80">Hostel Booking</p>
            <p className="text-h3">{data?.bookingStatus ?? "Confirmed · Block C"}</p>
          </div>
          <Sparkles className="h-6 w-6" />
        </div>
      </GradientCard>
    </div>
  );
}
