import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useExpensesQuery } from "@/queries/useFinanceQueries";
import { ScreenScaffold } from "@/pages/ScreenScaffold";

export function ExpenseHistory() {
  const { data } = useExpensesQuery();
  const expenses = Array.isArray(data) ? data : [];

  return (
    <ScreenScaffold title="Expense History" description="Review your transaction timeline.">
      <Card className="space-y-3">
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">Review past expenses, receipts, and category patterns to keep your budget under control.</p>
        {expenses.length ? expenses.map((expense: any) => (
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
        )) : <p className="text-body-sm text-dark-gray dark:text-mid-gray">No expense history yet.</p>}
        <Link to="/finance/log"><Button variant="secondary" className="w-full">Log New Expense</Button></Link>
      </Card>
    </ScreenScaffold>
  );
}
