import { useState } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLogExpenseMutation, useExpensesQuery } from "@/queries/useFinanceQueries";
import { ScreenScaffold } from "@/pages/ScreenScaffold";
import { useQueryClient } from "@tanstack/react-query";

const EXPENSE_CATEGORIES = ["Food", "Transport", "Books", "Utilities", "Entertainment", "Health", "Other"];

export function LogExpense() {
  const mutation = useLogExpenseMutation();
  const { data: expenses = [] } = useExpensesQuery();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [spentAt, setSpentAt] = useState(new Date().toISOString().slice(0, 10));

  const totalExpenses = (expenses as any[]).reduce((sum, exp: any) => sum + (Number(exp.amount) || 0), 0);

  const submit = async () => {
    const amountNum = Number(amount);
    if (!amount || amountNum <= 0 || !category) {
      toast.error("Please fill in all fields with valid values");
      return;
    }
    try {
      await mutation.mutateAsync({ 
        amount: amountNum, 
        category: category.toUpperCase(), 
        description: description.trim(), 
        spentAt: new Date(spentAt).toISOString() 
      });
      toast.success("Expense logged successfully");
      setAmount("");
      setDescription("");
      setSpentAt(new Date().toISOString().slice(0, 10));
      queryClient.invalidateQueries({ queryKey: ["finance-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["finance-dashboard"] });
    } catch (error: any) {
      console.error("Expense error:", error);
      toast.error(error?.response?.data?.message || "Failed to log expense");
    }
  };

  return (
    <ScreenScaffold title="Log Expense" description="Record spending with category and date.">
      <div className="space-y-4">
        <Card className="bg-light-gray p-4">
          <p className="text-caption text-mid-gray">Total Spent This Month</p>
          <p className="text-h2 text-electric-blue">₦{totalExpenses.toLocaleString()}</p>
        </Card>

        <Card className="space-y-3">
          <p className="text-body-sm text-dark-gray dark:text-mid-gray">Record spending as it happens so your budget stays accurate in real time.</p>
          <Input label="Amount (₦)" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="e.g., 500" />
          <div>
            <label className="text-label text-dark-gray">Category</label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full mt-1 px-3 py-2 border border-mid-gray/40 rounded-xl text-sm">
              {EXPENSE_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
          </div>
          <Input label="Description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional: What did you spend on?" />
          <Input label="Date" type="date" value={spentAt} onChange={(event) => setSpentAt(event.target.value)} />
          <Button type="button" className="w-full" loading={mutation.isPending} onClick={submit}>Save Expense</Button>
        </Card>

        {expenses.length > 0 && (
          <Card className="space-y-3">
            <p className="text-label font-semibold">Recent Expenses</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(expenses as any[]).slice(0, 10).map((exp: any) => (
                <div key={exp.id} className="flex items-center justify-between p-2 bg-light-gray rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{exp.category} {exp.description && `• ${exp.description}`}</p>
                    <p className="text-xs text-mid-gray">{new Date(exp.spentAt).toLocaleDateString()}</p>
                  </div>
                  <p className="font-semibold text-electric-blue">₦{Number(exp.amount).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </ScreenScaffold>
  );
}
