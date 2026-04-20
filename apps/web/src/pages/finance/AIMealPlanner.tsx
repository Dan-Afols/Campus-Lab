import { useState } from "react";
import { Sparkles, ChefHat, Loader } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import toast from "react-hot-toast";

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
    if (!budget || Number(budget) <= 0) {
      toast.error("Please enter a valid budget");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/ai/meal-planner`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget: Number(budget), days, constraints })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResult = "";
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullResult += chunk;
          setResult(fullResult);
        }
      }
      
      toast.success("Meal plan generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate meal plan");
      setResult("");
    } finally {
      setLoading(false);
    }
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
        <input 
          className="focus-ring mt-1 h-12 w-full rounded-xl border border-mid-gray/40 bg-white text-center text-h2 text-electric-blue" 
          value={budget} 
          onChange={(event) => setBudget(event.target.value)} 
          inputMode="decimal" 
          pattern="[0-9]*"
          placeholder="e.g., 2000"
          disabled={loading}
        />
        <div className="mt-2 flex items-center justify-between rounded-xl border border-mid-gray/20 bg-light-gray px-3 py-2 dark:bg-near-black">
          <Button variant="ghost" onClick={() => setDays((v) => Math.max(1, v - 1))} disabled={loading}>-</Button>
          <p className="text-h3">{days} days</p>
          <Button variant="ghost" onClick={() => setDays((v) => v + 1)} disabled={loading}>+</Button>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-mid-gray">Dietary Preferences</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Vegetarian",
              "Vegan",
              "No Cooking",
              "Budget",
              "High Protein"
            ].map((item) => (
              <Chip 
                key={item} 
                active={constraints.includes(item)} 
                onClick={() => toggle(item)}
                disabled={loading}
              >
                {item}
              </Chip>
            ))}
          </div>
        </div>
        <Button 
          className="w-full" 
          onClick={generate} 
          loading={loading}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader className="mr-1 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-1 h-4 w-4" />
              Generate Meal Plan
            </>
          )}
        </Button>
      </Card>

      {result && (
        <Card className="space-y-3">
          <p className="text-label font-semibold">Your Meal Plan</p>
          <div className="max-h-96 overflow-y-auto">
            {result.split('\n').filter((line) => line.trim()).map((line, idx) => (
              <div key={idx} className="text-sm text-dark-gray mb-2 leading-relaxed">
                {line.trim()}
              </div>
            ))}
          </div>
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={() => setResult("")}
          >
            Clear Plan
          </Button>
        </Card>
      )}
      
      {!result && !loading && (
        <Card className="p-4 bg-light-gray text-center">
          <p className="text-sm text-mid-gray">Set your budget and preferences, then generate a personalized meal plan.</p>
        </Card>
      )}
    </div>
  );
}
