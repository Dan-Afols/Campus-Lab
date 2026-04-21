import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScreenScaffold } from "@/pages/ScreenScaffold";
import { useAuthStore } from "@/stores/authStore";
import api from "@/services/api";

const dayOptions = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 7 },
];

export function CourseRepTimetableUpload() {
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === "COURSE_REP" || user?.role === "ADMIN";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    courseCode: "",
    dayOfWeek: 1,
    startsAt: "09:00",
    endsAt: "10:00",
    venue: "",
    lecturer: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.courseCode.trim() || !form.venue.trim()) {
      setError("Course code and venue are required.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/timetable/course-rep", {
        courseCode: form.courseCode.trim().toUpperCase(),
        dayOfWeek: Number(form.dayOfWeek),
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        venue: form.venue.trim(),
        lecturer: form.lecturer.trim() || undefined,
      });
      setMessage("Timetable uploaded successfully and students were notified.");
      setForm({ ...form, courseCode: "", venue: "", lecturer: "" });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Failed to upload timetable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenScaffold title="Upload Timetable" description="Create class schedule for your level.">
      {!canManage ? (
        <Card>
          <p className="text-body-sm">This section is for course reps and admins only.</p>
        </Card>
      ) : (
        <Card className="space-y-4">
          <form className="space-y-3" onSubmit={submit}>
            <div>
              <label className="text-sm font-medium">Course Code</label>
              <input
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="e.g. CPE309"
                value={form.courseCode}
                onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Day</label>
              <select
                className="w-full rounded border px-3 py-2 text-sm"
                value={form.dayOfWeek}
                onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
                disabled={loading}
              >
                {dayOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Start Time</label>
                <input
                  type="time"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Time</label>
                <input
                  type="time"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Venue</label>
              <input
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="Lecture Hall B"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Lecturer (Optional)</label>
              <input
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="Dr. Name"
                value={form.lecturer}
                onChange={(e) => setForm({ ...form, lecturer: e.target.value })}
                disabled={loading}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {message ? <p className="text-sm text-green-700">{message}</p> : null}
            <Button type="submit" disabled={loading}>{loading ? "Uploading..." : "Upload Timetable"}</Button>
          </form>
          <Link className="text-body-sm text-electric-blue" to="/academics/timetable">View Timetable</Link>
        </Card>
      )}
    </ScreenScaffold>
  );
}
