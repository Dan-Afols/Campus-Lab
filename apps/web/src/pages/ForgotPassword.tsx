import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ScreenScaffold } from "@/pages/ScreenScaffold";
import { requestPasswordReset } from "@/lib/api";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await requestPasswordReset(email);
      if (response?.otp) {
        setMessage(`Reset code generated for local dev. Use OTP ${response.otp} on the reset page.`);
      } else {
        setMessage("If the email exists, a reset code was sent. Check your inbox and spam folder.");
      }
    } catch {
      setMessage("Unable to start password reset. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenScaffold title="Forgot Password" description="Request a password reset code and continue back into your Campus Lab account.">
      <Card>
        <form className="space-y-3" onSubmit={submit}>
          <Input label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Button type="submit" loading={loading} className="w-full">Send reset code</Button>
          {message ? <p className="text-body-sm text-dark-gray dark:text-mid-gray">{message}</p> : null}
          <Link className="text-body-sm text-electric-blue" to="/reset-password">
            I already have a reset code
          </Link>
        </form>
      </Card>
    </ScreenScaffold>
  );
}
