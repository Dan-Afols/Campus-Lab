type ProgressBarProps = {
  value: number;
  max?: number;
  color?: "blue" | "green" | "amber";
};

export function ProgressBar({ value, max = 100, color = "blue" }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="h-2 w-full rounded-full bg-light-gray dark:bg-dark-border" aria-label="progress">
      <div
        className={[
          "h-2 rounded-full transition-all duration-500",
          color === "blue" ? "bg-electric-blue" : color === "green" ? "bg-emerald" : "bg-amber"
        ].join(" ")}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
