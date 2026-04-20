import { useState } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCreateSavingsGoalMutation } from "@/queries/useFinanceQueries";
import { ScreenScaffold } from "@/pages/ScreenScaffold";

export function SavingsGoals() {
  const mutation = useCreateSavingsGoalMutation();
  const [goalName, setGoalName] = useState("Emergency fund");
  const [targetAmount, setTargetAmount] = useState("25000");
  const [targetDate, setTargetDate] = useState("");

  const submit = async () => {
    await mutation.mutateAsync({ goalName, targetAmount: Number(targetAmount), targetDate });
    toast.success("Savings goal created");
    setGoalName("");
    setTargetAmount("");
    setTargetDate("");
  };

  return (
    <ScreenScaffold title="Savings Goals" description="Set and track financial goals.">
      <Card className="space-y-3">
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">Set a target, save consistently, and watch progress across the semester.</p>
        <Input label="Goal name" value={goalName} onChange={(event) => setGoalName(event.target.value)} />
        <Input label="Target amount (₦)" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} inputMode="decimal" />
        <Input label="Target date" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
        <Button type="button" className="w-full" loading={mutation.isPending} onClick={submit}>Save Goal</Button>
      </Card>
    </ScreenScaffold>
  );
}
