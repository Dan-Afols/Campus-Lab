import { useRef, useState } from "react";
import { Sparkles, WandSparkles, Send } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { MathRenderer } from "@/components/ui/MathRenderer";
import { useVirtualViewport } from "@/hooks/useVirtualViewport";
import api from "@/services/api";

type Message = { role: "user" | "assistant"; text: string; model?: string };

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [model, setModel] = useState("general");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const keyboardOffset = useVirtualViewport();
  const containerRef = useRef<HTMLDivElement>(null);

  const send = async (question = input) => {
    if (!question.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      if (model === "math") {
        const response = await api.post("/ai/math", { prompt: question });
        setMessages((prev) => [...prev, { role: "assistant", text: response.data?.answer ?? "No response", model }]);
      } else if (model === "summary") {
        const response = await api.post("/ai/summarize", { text: question });
        setMessages((prev) => [...prev, { role: "assistant", text: response.data?.summary ?? "No response", model }]);
      } else {
        const response = await api.post("/ai/chat", { prompt: question });
        setMessages((prev) => [...prev, { role: "assistant", text: response.data?.answer ?? "No response", model }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "AI request failed. Check GROK_API_KEY and AI server health.", model }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" }));
    }
  };

  return (
    <div className="flex h-[calc(100vh-190px)] flex-col gap-3">
      <Card className="border-0 text-white shadow-[0_16px_45px_rgba(9,31,61,0.26)]" style={{ background: "linear-gradient(135deg, #06203f 0%, #18427d 50%, #5b8ee8 100%)" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <WandSparkles className="h-5 w-5" />
              <p className="text-label text-white/80">Campus Lab AI</p>
            </div>
            <h2 className="text-h2">Ask, summarize, or solve in one place</h2>
            <p className="text-body-sm text-white/85">Fast prompts, math support, and open-source model responses tailored for students.</p>
          </div>
          <Sparkles className="h-7 w-7 opacity-90" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip active={model === "math"} onClick={() => setModel("math")}>Math</Chip>
          <Chip active={model === "general"} onClick={() => setModel("general")}>General</Chip>
          <Chip active={model === "summary"} onClick={() => setModel("summary")}>Summary</Chip>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div ref={containerRef} className="space-y-2 overflow-y-auto rounded-2xl border border-mid-gray/20 bg-white p-3 dark:border-dark-border dark:bg-dark-surface">
        {messages.length === 0 ? (
          <Card>
            <p className="text-body-md">Hi, how can I help?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {["How do I book a hostel?", "Summarize my latest material", "Plan meals for ₦2,000", "Solve a math problem"].map((q) => (
                <button key={q} onClick={() => send(q)} className="focus-ring rounded-md border border-electric-blue/30 p-3 text-left text-body-sm">
                  {q}
                </button>
              ))}
            </div>
          </Card>
        ) : null}

        {messages.map((message, index) => (
          <div key={index} className={message.role === "user" ? "ml-8 rounded-2xl rounded-br-sm bg-electric-blue p-3 text-white" : "mr-8 rounded-2xl rounded-bl-sm bg-light-gray p-3 dark:bg-dark-surface"}>
            {message.model === "math" && message.role === "assistant" ? (
              <div className="mb-2 rounded-md bg-near-black p-3 text-white">
                <MathRenderer expression="x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}" />
              </div>
            ) : null}
            <p className="whitespace-pre-wrap text-body-sm">{message.text}</p>
          </div>
        ))}
        </div>

        <Card className="border border-mid-gray/20 bg-white/95 dark:border-dark-border dark:bg-dark-surface/95">
          <p className="text-label text-mid-gray">Quick prompts</p>
          <div className="mt-3 space-y-2">
            {["Explain my lecture notes", "Create a budget meal plan", "Solve this equation", "Summarize a PDF"].map((q) => (
              <button key={q} onClick={() => send(q)} className="focus-ring flex w-full items-center justify-between rounded-xl border border-mid-gray/20 px-3 py-3 text-left text-body-sm transition hover:border-electric-blue/40 hover:bg-electric-blue/5">
                <span>{q}</span>
                <Send className="h-4 w-4 text-electric-blue" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="safe-bottom rounded-2xl border border-mid-gray/20 bg-white p-3 shadow-level-1 dark:border-dark-border dark:bg-dark-surface" style={{ transform: `translateY(-${keyboardOffset}px)` }}>
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask Campus Lab AI"
            rows={2}
            className="focus-ring min-h-[56px] flex-1 resize-none rounded-xl border border-mid-gray/40 bg-white px-3 py-2 text-body-sm text-near-black dark:bg-dark-surface dark:text-off-white"
          />
          <Button onClick={() => send()} loading={loading} className="shrink-0">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
