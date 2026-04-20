import { useState } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLogExpenseMutation } from "@/queries/useFinanceQueries";
import { ScreenScaffold } from "@/pages/ScreenScaffold";

export function LogExpense() {
  const mutation = useLogExpenseMutation();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [spentAt, setSpentAt] = useState(new Date().toISOString().slice(0, 10));

  const submit = async () => {
    await mutation.mutateAsync({ amount: Number(amount), category, description, spentAt });
    toast.success("Expense logged");
    setAmount("");
    setDescription("");
  };

  return (
    <ScreenScaffold title="Log Expense" description="Record spending with category and date.">
      <Card className="space-y-3">
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">Record spending as it happens so your budget stays accurate in real time.</p>
        <Input label="Amount" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
        <Input label="Category" value={category} onChange={(event) => setCategory(event.target.value)} />
        <Input label="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
        <Input label="Spent At" type="date" value={spentAt} onChange={(event) => setSpentAt(event.target.value)} />
        <Button type="button" className="w-full" loading={mutation.isPending} onClick={submit}>Save Expense</Button>
      </Card>
    </ScreenScaffold>
  );
}
