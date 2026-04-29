import { Link } from "react-router-dom";
import { ArrowUpRight, Plus, PiggyBank, Wallet, Receipt, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GradientCard } from "@/components/ui/GradientCard";
import { useFinanceDashboardQuery, useExpensesQuery } from "@/queries/useFinanceQueries";
import { ScreenScaffold } from "@/pages/ScreenScaffold";

export function FinanceDashboard() {
  const { data } = useFinanceDashboardQuery();
  const { data: expenses } = useExpensesQuery();

  const totalSpent = Number((data as any)?.spent ?? 0);
  const income = Number((data as any)?.income ?? 0);
  const remaining = Number((data as any)?.remaining ?? income - totalSpent);
  const recentExpenses = Array.isArray(expenses) ? expenses.slice(0, 4) : [];

  return (
    <ScreenScaffold title="Finance Dashboard" description="Budget tracking and spending insights.">
      <GradientCard gradient="finance">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-label text-white/80">Monthly snapshot</p>
            <h2 className="text-h2">Your cash flow at a glance</h2>
            <p className="mt-1 text-body-sm text-white/90">Track spending, savings, and food planning with live records.</p>
          </div>
          <Sparkles className="h-7 w-7" />
        </div>
      </GradientCard>

      <Card className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-mid-gray/20 p-3">
          <p className="text-caption text-mid-gray">Spent</p>
          <p className="text-h3">₦{totalSpent.toLocaleString()}</p>
          <p className="mt-1 text-caption text-dark-gray"><Receipt className="mr-1 inline h-3.5 w-3.5" />All expenses</p>
        </div>
        <div className="rounded-lg border border-mid-gray/20 p-3">
          <p className="text-caption text-mid-gray">Income</p>
          <p className="text-h3">₦{income.toLocaleString()}</p>
          <p className="mt-1 text-caption text-dark-gray"><Wallet className="mr-1 inline h-3.5 w-3.5" />Budget input</p>
        </div>
        <div className="rounded-lg border border-mid-gray/20 p-3">
          <p className="text-caption text-mid-gray">Remaining</p>
          <p className="text-h3">₦{remaining.toLocaleString()}</p>
          <p className="mt-1 text-caption text-dark-gray"><PiggyBank className="mr-1 inline h-3.5 w-3.5" />Available now</p>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-h3">Quick actions</h3>
          <Plus className="h-4 w-4 text-mid-gray" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link to="/finance/log"><Button className="w-full">Log Expense</Button></Link>
          <Link to="/finance/budget"><Button className="w-full">Budget Calculator</Button></Link>
          <Link to="/finance/savings"><Button className="w-full">Savings Goals</Button></Link>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-h3">Recent expenses</h3>
          <Link to="/finance/history" className="text-body-sm text-electric-blue">View history</Link>
        </div>
        <div className="mt-3 space-y-2">
          {recentExpenses.length ? recentExpenses.map((expense: any) => (
            <div key={expense.id} className="flex items-center justify-between rounded-xl border border-mid-gray/20 px-3 py-2">
              <div>
                <p className="text-body-sm font-medium">{expense.category ?? "Expense"}</p>
                <p className="text-caption text-mid-gray">{expense.description ?? "No description"}</p>
              </div>
              <div className="text-right">
                <p className="text-body-sm font-semibold">₦{Number(expense.amount ?? 0).toLocaleString()}</p>
                <p className="text-caption text-mid-gray">{expense.spentAt ? new Date(expense.spentAt).toLocaleDateString() : "Today"}</p>
              </div>
            </div>
          )) : <p className="text-body-sm text-dark-gray dark:text-mid-gray">No expenses logged yet. Start with your first transaction.</p>}
        </div>
      </Card>
    </ScreenScaffold>
  );
}
