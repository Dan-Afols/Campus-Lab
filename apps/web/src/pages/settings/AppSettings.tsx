import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/hooks/useTheme";
import { useHealthGoalsMutation, useMeQuery } from "@/queries/useProfileQueries";
import { useAuthStore } from "@/stores/authStore";

export function AppSettings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { data } = useMeQuery();
  const goalMutation = useHealthGoalsMutation();
  const clearAuth = useAuthStore((state) => state.clear);

  const user = data ?? { stepGoal: 8000, waterGoalCups: 8, bodyWeightKg: 70 };

  return (
    <div className="space-y-3">
      <Card>
        <h3 className="text-h3">Appearance</h3>
        <div className="mt-2 flex gap-2">
          <Button variant={theme === "light" ? "primary" : "secondary"} onClick={() => setTheme("light")}>Light</Button>
          <Button variant={theme === "dark" ? "primary" : "secondary"} onClick={() => setTheme("dark")}>Dark</Button>
          <Button variant={theme === "system" ? "primary" : "secondary"} onClick={() => setTheme("system")}>System</Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-h3">Health Goals</h3>
        <div className="mt-2 grid gap-2">
          <Input label="Step Goal" defaultValue={String(user.stepGoal ?? 8000)} onBlur={(e) => goalMutation.mutate({ stepGoal: Number(e.target.value), waterGoalCups: Number(user.waterGoalCups ?? 8), bodyWeightKg: Number(user.bodyWeightKg ?? 70) })} />
          <Input label="Water Goal Cups" defaultValue={String(user.waterGoalCups ?? 8)} onBlur={(e) => goalMutation.mutate({ stepGoal: Number(user.stepGoal ?? 8000), waterGoalCups: Number(e.target.value), bodyWeightKg: Number(user.bodyWeightKg ?? 70) })} />
        </div>
      </Card>

      <Card>
        <h3 className="text-h3">Settings</h3>
        <div className="mt-2 grid gap-2 text-body-sm">
          <Link className="text-electric-blue" to="/settings/security">Security Settings</Link>
          <Link className="text-electric-blue" to="/settings/notifications">Notification Preferences</Link>
          <Link className="text-electric-blue" to="/settings/privacy">Privacy Settings</Link>
          <Link className="text-electric-blue" to="/settings/active-sessions">Active Sessions</Link>
        </div>
      </Card>

      <Card>
        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            clearAuth();
            toast.success("Logged out");
            navigate("/login", { replace: true });
          }}
        >
          Logout
        </Button>
      </Card>
    </div>
  );
}
