import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ScreenScaffold } from "@/pages/ScreenScaffold";
import { resetPassword } from "@/lib/api";
import { Lock, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [otpCode, setOtpCode] = useState(searchParams.get("otp") ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const helper = useMemo(() => searchParams.get("otp") ? "Use the OTP from the previous step." : "Enter the email used for reset and the OTP from your inbox.", [searchParams]);

  const passwordsMatch = newPassword && newPassword === confirmPassword;
  const isValid = email && otpCode && newPassword && passwordsMatch;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    
    if (!isValid) {
      toast.error("Please fill in all fields correctly");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await resetPassword({ email, otpCode, newPassword });
      setSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || "Unable to reset password. Check the code and try again.";
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <ScreenScaffold title="Password Reset" description="">
        <Card className="space-y-4 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
          <h3 className="text-h3 font-semibold">Password updated successfully!</h3>
          <p className="text-body-sm text-mid-gray">You can now sign in with your new password.</p>
          <Button className="w-full" onClick={() => window.location.href = "/login"}>
            Go to sign in
          </Button>
        </Card>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold title="Reset Password" description="Choose a stronger password and regain access to Campus Lab.">
      <Card>
        <form className="space-y-3" onSubmit={submit}>
          <div className="flex items-center gap-2 text-electric-blue mb-2">
            <Lock className="h-5 w-5" />
            <p className="font-semibold">Create a new password</p>
          </div>
          <p className="text-body-sm text-dark-gray dark:text-mid-gray">{helper}</p>
          
          <Input 
            label="Email address" 
            type="email" 
            value={email} 
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@university.edu"
            disabled={loading}
          />
          
          <Input 
            label="Reset code" 
            value={otpCode} 
            onChange={(event) => setOtpCode(event.target.value)}
            placeholder="6-digit code from your email"
            disabled={loading}
            maxLength={6}
          />
          
          <Input 
            label="New password" 
            type="password" 
            value={newPassword} 
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="At least 8 characters"
            disabled={loading}
          />
          
          <Input 
            label="Confirm password" 
            type="password" 
            value={confirmPassword} 
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your password"
            disabled={loading}
          />

          {newPassword && confirmPassword && !passwordsMatch && (
            <p className="text-sm text-coral bg-coral/10 p-2 rounded">Passwords don't match</p>
          )}
          
          <Button 
            type="submit" 
            loading={loading} 
            disabled={!isValid || loading}
            className="w-full"
          >
            Update password
          </Button>
          
          {message ? (
            <p className="text-body-sm text-coral bg-coral/10 p-2 rounded">{message}</p>
          ) : null}
          
          <Link className="text-body-sm text-electric-blue text-center block" to="/login">
            Back to sign in
          </Link>
        </form>
      </Card>
    </ScreenScaffold>
  );
}
