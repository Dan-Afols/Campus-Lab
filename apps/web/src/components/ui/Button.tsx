import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Button({ className, variant = "primary", size = "md", loading, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 font-medium transition",
        variant === "primary" && "bg-electric-blue text-white hover:bg-[#3f85d8]",
        variant === "secondary" && "bg-light-gray text-near-black hover:bg-[#dfe4ea]",
        variant === "ghost" && "border border-mid-gray/40 bg-transparent text-near-black dark:text-off-white",
        variant === "danger" && "bg-coral text-white hover:bg-[#d64637]",
        size === "sm" && "h-9 px-3 text-body-sm",
        size === "md" && "h-11 px-4 text-body-md",
        size === "lg" && "h-12 px-5 text-body-lg",
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
