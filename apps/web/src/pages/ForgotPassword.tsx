import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ScreenScaffold } from "@/pages/ScreenScaffold";
import { requestPasswordReset } from "@/lib/api";
import { Mail, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await requestPasswordReset(email);
      setSuccess(true);
      
      if (response?.otp) {
        setShowOtp(true);
        setMessage(`Reset code for development: ${response.otp}`);
        toast.success("Reset code generated (dev mode)");
      } else {
        setMessage("If the email exists in our system, a reset code has been sent. Check your inbox and spam folder (it may take a few moments to arrive).");
        toast.success("Check your email for reset code");
      }
    } catch (error: any) {
      setSuccess(false);
      const errorMsg = error?.response?.data?.error || "Unable to start password reset. Try again in a moment.";
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenScaffold title="Forgot Password" description="Request a password reset code and continue back into your Campus Lab account.">
      <div className="space-y-4">
        {!success ? (
          <Card>
            <form className="space-y-3" onSubmit={submit}>
              <div className="flex items-center gap-2 text-electric-blue mb-2">
                <Mail className="h-5 w-5" />
                <p className="font-semibold">Enter your email address</p>
              </div>
              <Input 
                label="Email address" 
                type="email" 
                value={email} 
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@university.edu"
                disabled={loading}
              />
              <Button type="submit" loading={loading} className="w-full">Send reset code</Button>
              {message ? (
                <p className={`text-body-sm ${showOtp ? 'text-orange-600 bg-orange-50 p-2 rounded' : 'text-dark-gray dark:text-mid-gray'}`}>
                  {message}
                </p>
              ) : null}
              <Link className="text-body-sm text-electric-blue" to="/reset-password">
                I already have a reset code
              </Link>
            </form>
          </Card>
        ) : (
          <Card className="space-y-4">
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <h3 className="text-h3 font-semibold">Check your email</h3>
              <p className="text-body-sm text-mid-gray">A password reset code has been sent to <strong>{email}</strong></p>
            </div>
            
            {showOtp && (
              <Card className="bg-orange-50 border border-orange-200 p-3">
                <p className="text-xs text-mid-gray mb-1">Development Mode - Reset Code:</p>
                <p className="text-h2 font-mono font-bold text-orange-700">{message.split(': ')[1]}</p>
              </Card>
            )}

            <div className="space-y-2">
              <p className="text-label font-semibold">Next steps:</p>
              <ol className="text-sm text-mid-gray space-y-1 list-decimal list-inside">
                <li>Check your email inbox</li>
                <li>Look in spam/junk folder if not found</li>
                <li>Copy the reset code</li>
                <li>Return here and paste it to reset your password</li>
              </ol>
            </div>

            <Button 
              className="w-full" 
              onClick={() => setSuccess(false)}
            >
              Enter reset code
            </Button>

            <Link className="text-body-sm text-electric-blue text-center block" to="/reset-password">
              Go to reset password page
            </Link>
          </Card>
        )}
      </div>
    </ScreenScaffold>
  );
}
