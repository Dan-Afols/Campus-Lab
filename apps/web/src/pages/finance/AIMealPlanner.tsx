import { useState } from "react";
import { Sparkles, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";

export function AIMealPlanner() {
  const [budget, setBudget] = useState("2000");
  const [days, setDays] = useState(7);
  const [constraints, setConstraints] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const toggle = (item: string) => {
    setConstraints((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  };

  const generate = async () => {
    setLoading(true);
    setResult("");

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/ai/meal-planner`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budget, days, constraints })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResult((prev) => prev + decoder.decode(value, { stream: true }));
      }
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 text-white shadow-[0_16px_45px_rgba(44,24,0,0.24)]" style={{ background: "var(--gradient-finance)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-label text-white/80">Meal planning</p>
            <h2 className="text-h2">AI Meal Planner</h2>
            <p className="text-body-sm text-white/90">Budget-smart meal plans for student life.</p>
          </div>
          <ChefHat className="h-6 w-6" />
        </div>
      </Card>

      <Card className="space-y-3">
        <label className="text-label text-dark-gray">Budget (₦)</label>
        <input className="focus-ring mt-1 h-12 w-full rounded-xl border border-mid-gray/40 bg-white text-center text-h2 text-electric-blue" value={budget} onChange={(event) => setBudget(event.target.value)} inputMode="decimal" pattern="[0-9]*" />
        <div className="mt-2 flex items-center justify-between rounded-xl border border-mid-gray/20 bg-light-gray px-3 py-2 dark:bg-near-black">
          <Button variant="ghost" onClick={() => setDays((v) => Math.max(1, v - 1))}>-</Button>
          <p className="text-h3">{days} days</p>
          <Button variant="ghost" onClick={() => setDays((v) => v + 1)}>+</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            "Vegetarian",
            "No Cooking",
            "₦500/day"
          ].map((item) => (
            <Chip key={item} active={constraints.includes(item)} onClick={() => toggle(item)}>{item}</Chip>
          ))}
        </div>
        <Button className="w-full" onClick={generate} loading={loading}><Sparkles className="mr-1 h-4 w-4" />Get Meal Plan</Button>
      </Card>

      {result ? <Card><pre className="whitespace-pre-wrap text-body-sm">{result}</pre></Card> : null}
    </div>
  );
}
