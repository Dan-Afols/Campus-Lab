import { cn } from "@/utils/cn";

type SkeletonProps = {
  variant?: "card" | "text" | "circle";
  className?: string;
};

export function Skeleton({ variant = "text", className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-mid-gray/25",
        variant === "card" && "h-28 w-full",
        variant === "text" && "h-4 w-full",
        variant === "circle" && "h-10 w-10 rounded-full",
        className
      )}
    />
  );
}
