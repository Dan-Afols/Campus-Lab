import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ScreenScaffold } from "@/pages/ScreenScaffold";

export function BudgetCalculator() {
  const [income, setIncome] = useState("50000");
  const [rent, setRent] = useState("12000");
  const [feeding, setFeeding] = useState("18000");
  const [transport, setTransport] = useState("5000");

  const remaining = useMemo(() => Number(income || 0) - Number(rent || 0) - Number(feeding || 0) - Number(transport || 0), [income, rent, feeding, transport]);

  return (
    <ScreenScaffold title="Budget Calculator" description="Estimate spending limits by period.">
      <Card className="space-y-3">
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">Compare income, school costs, and monthly expenses before you spend.</p>
        <Input label="Monthly income (₦)" value={income} onChange={(event) => setIncome(event.target.value)} inputMode="decimal" />
        <Input label="Rent / accommodation (₦)" value={rent} onChange={(event) => setRent(event.target.value)} inputMode="decimal" />
        <Input label="Feeding (₦)" value={feeding} onChange={(event) => setFeeding(event.target.value)} inputMode="decimal" />
        <Input label="Transport (₦)" value={transport} onChange={(event) => setTransport(event.target.value)} inputMode="decimal" />
        <div className="rounded-xl bg-light-gray p-3 dark:bg-near-black">
          <p className="text-caption text-mid-gray">Estimated remaining budget</p>
          <p className={`text-h2 ${remaining < 0 ? "text-coral" : "text-electric-blue"}`}>₦{remaining.toLocaleString()}</p>
        </div>
        <Button type="button" className="w-full">Recalculate</Button>
      </Card>
    </ScreenScaffold>
  );
}
