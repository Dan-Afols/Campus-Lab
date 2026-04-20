import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ScreenScaffold } from "@/pages/ScreenScaffold";
import { resetPassword } from "@/lib/api";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [otpCode, setOtpCode] = useState(searchParams.get("otp") ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const helper = useMemo(() => searchParams.get("otp") ? "Use the OTP from the previous step." : "Enter the email used for reset and the OTP from your inbox.", [searchParams]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await resetPassword({ email, otpCode, newPassword });
      setMessage("Password updated. You can now sign in with the new password.");
    } catch {
      setMessage("Unable to reset password. Check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenScaffold title="Reset Password" description="Choose a stronger password and regain access to Campus Lab.">
      <Card>
        <form className="space-y-3" onSubmit={submit}>
          <p className="text-body-sm text-dark-gray dark:text-mid-gray">{helper}</p>
          <Input label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input label="Reset code" value={otpCode} onChange={(event) => setOtpCode(event.target.value)} />
          <Input label="New password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
          <Button type="submit" loading={loading} className="w-full">Update password</Button>
          {message ? <p className="text-body-sm text-dark-gray dark:text-mid-gray">{message}</p> : null}
          <Link className="text-body-sm text-electric-blue" to="/login">Back to sign in</Link>
        </form>
      </Card>
    </ScreenScaffold>
  );
}
