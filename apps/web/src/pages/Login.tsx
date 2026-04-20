import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLoginMutation } from "@/queries/useAuthQueries";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

type LoginValues = z.infer<typeof schema>;

export function LoginScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const mutation = useLoginMutation();
  const [error, setError] = useState<string | null>(null);
  const successMessage = (location.state as any)?.message as string | undefined;
  const redirect = new URLSearchParams(location.search).get("redirect") || "/dashboard";

  const form = useForm<LoginValues>({
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const result = schema.safeParse(values);
    if (!result.success) {
      setError(result.error.issues[0]?.message || "Validation failed");
      return;
    }

    try {
      await mutation.mutateAsync(result.data);
      navigate(redirect, { replace: true });
    } catch {
      setError("Unable to login. Check credentials and network.");
    }
  });

  return (
    <div className="phone-frame grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-md border-0 bg-gradient-to-br from-[#041937] via-[#0f2e5f] to-[#1c4f8f] text-white shadow-[0_18px_44px_rgba(4,25,55,0.42)]">
        <p className="text-caption uppercase tracking-[0.22em] text-white/80">Campus Lab</p>
        <h1 className="mt-1 text-h1">Welcome back</h1>
        <p className="mt-1 text-body-sm text-white/85">Sign in to continue your classes, materials, and updates.</p>
      </Card>

      <Card className="mt-4 w-full max-w-md">
        <form className="mt-4 space-y-3" onSubmit={onSubmit} noValidate>
          {successMessage ? <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-body-sm text-emerald-700">{successMessage}</div> : null}
          <Input label="Email" type="email" autoComplete="username" placeholder="you@university.edu" {...form.register("email")} />
          <Input label="Password" type="password" autoComplete="current-password" placeholder="Enter your password" {...form.register("password")} />
          {error ? <p className="text-body-sm text-coral">{error}</p> : null}
          <Button type="submit" className="w-full" loading={mutation.isPending}>
            Sign In
          </Button>
          <div className="flex items-center justify-between text-body-sm">
            <Link to="/forgot-password" className="text-electric-blue">Forgot password?</Link>
            <Link to="/register" className="text-electric-blue">Create account</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
