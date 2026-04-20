import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, type = "text", className, ...props }, ref) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const effectiveType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <label className="relative block">
      <span className="mb-1 block text-label text-dark-gray dark:text-mid-gray">{label}</span>
      <div className="relative">
        <input
          ref={ref}
          type={effectiveType}
          className={cn(
            "focus-ring h-11 w-full rounded-md border border-mid-gray/40 bg-white px-3 text-body-md text-near-black dark:border-dark-border dark:bg-dark-surface dark:text-off-white",
            error && "border-coral",
            className
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-mid-gray"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
      {error ? <span className="mt-1 block text-caption text-coral">{error}</span> : null}
    </label>
  );
});
