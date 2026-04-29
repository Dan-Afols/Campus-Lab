import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ScreenScaffold } from "@/pages/ScreenScaffold";
import { useFinanceDashboardQuery } from "@/queries/useFinanceQueries";

export function BudgetCalculator() {
  const { data: dashboard } = useFinanceDashboardQuery();
  const [income, setIncome] = useState("12500");
  const [rent, setRent] = useState("3000");
  const [feeding, setFeeding] = useState("4500");
  const [transport, setTransport] = useState("1250");
  const [other, setOther] = useState("750");

  const incomeNum = Number(income || 0);
  const rentNum = Number(rent || 0);
  const feedingNum = Number(feeding || 0);
  const transportNum = Number(transport || 0);
  const otherNum = Number(other || 0);
  const totalExpenses = rentNum + feedingNum + transportNum + otherNum;
  const remaining = incomeNum - totalExpenses;
  const percentageUsed = incomeNum > 0 ? (totalExpenses / incomeNum) * 100 : 0;

  const spent = dashboard?.totalSpent || 0;
  const budgetHealth = remaining > spent ? "Good" : remaining > 0 ? "Caution" : "Exceeded";

  return (
    <ScreenScaffold title="Budget Calculator" description="Estimate weekly spending limits.">
      <div className="space-y-3">
        <Card className="space-y-3">
          <p className="text-body-sm text-dark-gray dark:text-mid-gray">Compare income, school costs, and weekly expenses before you spend.</p>
          <Input 
            label="Weekly income (₦)" 
            value={income} 
            onChange={(event) => setIncome(event.target.value)} 
            inputMode="decimal"
            placeholder="e.g., 12500"
          />
          <Input 
            label="Rent / accommodation (₦) (weekly)" 
            value={rent} 
            onChange={(event) => setRent(event.target.value)} 
            inputMode="decimal"
            placeholder="e.g., 3000"
          />
          <Input 
            label="Feeding (₦) (weekly)" 
            value={feeding} 
            onChange={(event) => setFeeding(event.target.value)} 
            inputMode="decimal"
            placeholder="e.g., 4500"
          />
          <Input 
            label="Transport (₦) (weekly)" 
            value={transport} 
            onChange={(event) => setTransport(event.target.value)} 
            inputMode="decimal"
            placeholder="e.g., 1250"
          />
          <Input 
            label="Other expenses (₦) (weekly)" 
            value={other} 
            onChange={(event) => setOther(event.target.value)} 
            inputMode="decimal"
            placeholder="e.g., 750"
          />
        </Card>

        <Card className="space-y-3">
          <p className="text-label font-semibold">Budget Breakdown</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-mid-gray">Total Income</span>
              <span className="font-semibold text-green-600">₦{incomeNum.toLocaleString()}</span>
            </div>
            <div className="h-1 bg-light-gray rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${percentageUsed > 100 ? 'bg-coral' : percentageUsed > 80 ? 'bg-orange-500' : 'bg-electric-blue'}`}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-light-gray rounded">
                <p className="text-xs text-mid-gray">Rent</p>
                <p className="font-medium">₦{rentNum.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-light-gray rounded">
                <p className="text-xs text-mid-gray">Feeding</p>
                <p className="font-medium">₦{feedingNum.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-light-gray rounded">
                <p className="text-xs text-mid-gray">Transport</p>
                <p className="font-medium">₦{transportNum.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-light-gray rounded">
                <p className="text-xs text-mid-gray">Other</p>
                <p className="font-medium">₦{otherNum.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 bg-light-gray">
            <p className="text-xs text-mid-gray mb-1">Total Expenses</p>
            <p className="text-h3 font-semibold">₦{totalExpenses.toLocaleString()}</p>
          </Card>
          <Card className="p-3 bg-light-gray">
            <p className="text-xs text-mid-gray mb-1">Budget Health</p>
            <p className={`text-h3 font-semibold ${budgetHealth === 'Good' ? 'text-green-600' : budgetHealth === 'Caution' ? 'text-orange-500' : 'text-coral'}`}>
              {budgetHealth}
            </p>
          </Card>
        </div>

        <Card className="p-4 rounded-xl bg-gradient-to-br from-electric-blue/10 to-electric-blue/5">
          <p className="text-caption text-mid-gray mb-1">Estimated remaining budget</p>
          <p className={`text-h2 font-bold ${remaining < 0 ? "text-coral" : "text-electric-blue"}`}>
            ₦{remaining.toLocaleString()}
          </p>
          {spent > 0 && (
            <p className="text-xs text-mid-gray mt-2">Already spent: ₦{spent.toLocaleString()}</p>
          )}
        </Card>
      </div>
    </ScreenScaffold>
  );
}
