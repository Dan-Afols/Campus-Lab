import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScreenScaffold } from "@/pages/ScreenScaffold";
import { useAuthStore } from "@/stores/authStore";
import api from "@/services/api";

export function CourseRepSendNotification() {
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === "COURSE_REP" || user?.role === "ADMIN";
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    body: "",
    type: "NEWS",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult("");

    if (!form.title.trim() || !form.body.trim()) {
      setError("Title and message are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/notifications/broadcast", {
        title: form.title.trim(),
        body: form.body.trim(),
        type: form.type,
      });
      const delivered = Number(response?.data?.delivered ?? 0);
      setResult(`Notification sent successfully to ${delivered} users.`);
      setForm({ ...form, title: "", body: "" });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Failed to send notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenScaffold title="Send Notification" description="Broadcast updates to your class level.">
      {!canManage ? (
        <Card>
          <p className="text-body-sm">This section is for course reps and admins only.</p>
        </Card>
      ) : (
        <Card className="space-y-4">
          <form className="space-y-3" onSubmit={submit}>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                className="w-full rounded border px-3 py-2 text-sm"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                disabled={loading}
              >
                <option value="NEWS">News</option>
                <option value="TIMETABLE">Timetable</option>
                <option value="MATERIAL">Material</option>
                <option value="PAST_QUESTION">Past Question</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="Urgent update"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea
                className="w-full rounded border px-3 py-2 text-sm"
                rows={4}
                placeholder="Write your update for students"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                disabled={loading}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {result ? <p className="text-sm text-green-700">{result}</p> : null}
            <Button type="submit" disabled={loading}>{loading ? "Sending..." : "Send Notification"}</Button>
          </form>
        </Card>
      )}
    </ScreenScaffold>
  );
}
