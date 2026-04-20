import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function Chip({ active, className, ...props }: ChipProps) {
  return (
    <button
      className={cn(
        "focus-ring min-h-[44px] rounded-full border px-3 text-body-sm",
        active
          ? "border-electric-blue bg-electric-blue text-white"
          : "border-mid-gray/40 bg-white text-dark-gray dark:border-dark-border dark:bg-dark-surface dark:text-off-white",
        className
      )}
      {...props}
    />
  );
}
