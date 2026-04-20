import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2 } from "lucide-react";

interface LoginResponse {
  message: string;
  admin: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  requiresOtp: boolean;
  sessionToken?: string;
  token?: string;
}

interface OtpVerifyResponse {
  message: string;
  token: string;
  admin: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export function LoginPage() {
  const navigate = useNavigate();
  const { setAdmin, setToken, setAuthenticated } = useAuthStore();

  const [step, setStep] = useState<"login" | "otp">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post<LoginResponse>(
        "/admin/auth/login",
        {
          email,
          password,
        }
      );

      if (response.data.token) {
        localStorage.setItem("admin_token", response.data.token);
        setToken(response.data.token);
        const adminUser = {
          id: response.data.admin.id,
          fullName: response.data.admin.name,
          email: response.data.admin.email,
          role: response.data.admin.role as any,
          twoFactorEnabled: false,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem("admin_user", JSON.stringify(adminUser));
        setAdmin(adminUser);
        setAuthenticated(true);
        navigate("/dashboard");
        return;
      }

      setSessionToken(response.data.sessionToken || "");
      if (response.data.requiresOtp) {
        setStep("otp");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post<OtpVerifyResponse>(
        "/admin/auth/verify-otp",
        {
          sessionToken,
          otp,
        }
      );

      localStorage.setItem("admin_token", response.data.token);
      setToken(response.data.token);
      const adminUser = {
        id: response.data.admin.id,
        fullName: response.data.admin.name,
        email: response.data.admin.email,
        role: response.data.admin.role as any,
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("admin_user", JSON.stringify(adminUser));
      setAdmin(adminUser);
      setAuthenticated(true);

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900">
                CampusLab Admin
              </h1>
              <p className="text-slate-600 mt-2">Two-Factor Authentication</p>
            </div>

            <form onSubmit={handleOtpVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Enter OTP
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="text-center tracking-widest"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify OTP
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("login");
                  setOtp("");
                  setSessionToken("");
                  setError("");
                }}
                disabled={loading}
              >
                Back to Login
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
              CampusLab Admin
            </h1>
            <p className="text-slate-600 mt-2">Administrative Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="admin@campuslab.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              Enter Your Credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
