import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-50":
            variant === "default",
          "border border-slate-200 bg-white text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50":
            variant === "outline",
          "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-50":
            variant === "destructive",
          "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-50":
            variant === "secondary",
          "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-50":
            variant === "success",
          "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-50":
            variant === "warning",
        },
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge };
