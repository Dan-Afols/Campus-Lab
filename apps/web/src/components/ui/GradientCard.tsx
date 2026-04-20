import type { PropsWithChildren } from "react";

type GradientCardProps = PropsWithChildren<{
  gradient?: "brand" | "ai" | "health" | "finance";
}>;

export function GradientCard({ gradient = "brand", children }: GradientCardProps) {
  const background =
    gradient === "brand"
      ? "var(--gradient-brand)"
      : gradient === "ai"
        ? "var(--gradient-ai)"
        : gradient === "health"
          ? "var(--gradient-health)"
          : "var(--gradient-finance)";

  return (
    <div className="rounded-xl p-4 text-white shadow-level-2" style={{ background }}>
      {children}
    </div>
  );
}
