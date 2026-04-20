import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/utils/cn";

type CardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement> & {
  variant?: "standard" | "feature" | "hero" | "stat" | "list-item";
  className?: string;
}>;

export function Card({ variant = "standard", className, children, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-xl border border-mid-gray/20 bg-white p-4 shadow-level-1 dark:border-dark-border dark:bg-dark-surface",
        variant === "feature" && "shadow-level-2",
        variant === "hero" && "bg-electric-blue text-white",
        variant === "stat" && "bg-off-white dark:bg-near-black",
        variant === "list-item" && "rounded-lg p-3",
        className
      )}
    >
      {children}
    </div>
  );
}
