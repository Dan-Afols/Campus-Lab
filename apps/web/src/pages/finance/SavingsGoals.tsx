import { useState } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCreateSavingsGoalMutation } from "@/queries/useFinanceQueries";
import { ScreenScaffold } from "@/pages/ScreenScaffold";
import { useQueryClient } from "@tanstack/react-query";
import { TrendingUp, Target } from "lucide-react";

// Mock data until backend list endpoint is available
const MOCK_SAVINGS_GOALS = [
  { id: "1", name: "Emergency Fund", target: 50000, current: 15000, targetDate: "2025-12-31" },
  { id: "2", name: "Laptop Upgrade", target: 150000, current: 45000, targetDate: "2025-09-30" },
];

export function SavingsGoals() {
  const mutation = useCreateSavingsGoalMutation();
  const queryClient = useQueryClient();
  const [goalName, setGoalName] = useState("Emergency fund");
  const [targetAmount, setTargetAmount] = useState("25000");
  const [targetDate, setTargetDate] = useState("");
  const [goals, setGoals] = useState(MOCK_SAVINGS_GOALS);

  const submit = async () => {
    if (!goalName || !targetAmount || !targetDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await mutation.mutateAsync({ goalName, targetAmount: Number(targetAmount), targetDate });
      toast.success("Savings goal created");
      setGoalName("");
      setTargetAmount("");
      setTargetDate("");
      queryClient.invalidateQueries({ queryKey: ["finance-dashboard"] });
    } catch (error) {
      toast.error("Failed to create goal");
    }
  };

  return (
    <ScreenScaffold title="Savings Goals" description="Set and track financial goals.">
      <div className="space-y-4">
        {/* Current Goals */}
        {goals.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-label font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" /> Active Goals
            </h3>
            {goals.map((goal) => {
              const progress = (goal.current / goal.target) * 100;
              const daysLeft = Math.ceil(
                (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <Card key={goal.id} className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-body-sm">{goal.name}</p>
                      <p className="text-xs text-mid-gray">{daysLeft} days remaining</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₦{goal.current.toLocaleString()}</p>
                      <p className="text-xs text-mid-gray">of ₦{goal.target.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="h-2 bg-light-gray rounded-full overflow-hidden">
                    <div
                      className="h-full bg-electric-blue transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mid-gray">{progress.toFixed(0)}% saved</span>
                    <span className="text-electric-blue font-medium">₦{(goal.target - goal.current).toLocaleString()} to go</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create New Goal Form */}
        <Card className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-electric-blue" />
            <h3 className="text-label font-semibold">Create New Goal</h3>
          </div>
          <p className="text-body-sm text-dark-gray dark:text-mid-gray">Set a target, save consistently, and watch progress across the semester.</p>
          <Input 
            label="Goal name" 
            value={goalName} 
            onChange={(event) => setGoalName(event.target.value)}
            placeholder="e.g., Emergency fund, Laptop"
          />
          <Input 
            label="Target amount (₦)" 
            value={targetAmount} 
            onChange={(event) => setTargetAmount(event.target.value)} 
            inputMode="decimal"
            placeholder="e.g., 25000"
          />
          <Input 
            label="Target date" 
            type="date" 
            value={targetDate} 
            onChange={(event) => setTargetDate(event.target.value)}
          />
          <Button 
            type="button" 
            className="w-full" 
            loading={mutation.isPending} 
            onClick={submit}
          >
            Create Goal
          </Button>
        </Card>

        {/* Tips Card */}
        <Card className="p-3 bg-electric-blue/5">
          <p className="text-label font-semibold mb-2">💡 Savings Tips</p>
          <ul className="text-xs text-mid-gray space-y-1">
            <li>• Automate transfers to reach your goals faster</li>
            <li>• Start small and increase savings gradually</li>
            <li>• Track daily expenses to find savings opportunities</li>
            <li>• Review goals monthly and celebrate milestones</li>
          </ul>
        </Card>
      </div>
    </ScreenScaffold>
  );
}
