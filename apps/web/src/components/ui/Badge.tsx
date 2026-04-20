import type { PropsWithChildren } from "react";
import { cn } from "@/utils/cn";

type BadgeProps = PropsWithChildren<{ color?: "blue" | "green" | "amber" | "red" | "violet" }>;

export function Badge({ color = "blue", children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-micro font-medium",
        color === "blue" && "bg-electric-blue/15 text-electric-blue",
        color === "green" && "bg-emerald/15 text-emerald",
        color === "amber" && "bg-amber/15 text-amber",
        color === "red" && "bg-coral/15 text-coral",
        color === "violet" && "bg-violet/15 text-violet"
      )}
    >
      {children}
    </span>
  );
}
