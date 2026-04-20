import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function SecuritySettings() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);

  return (
    <div className="space-y-3">
      <Card>
        <h3 className="flex items-center gap-2 text-h3"><ShieldCheck className="h-5 w-5 text-electric-blue" />Password</h3>
        <div className="mt-2 grid gap-2">
          <Input label="Current Password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
          <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Button className="mt-1">Change Password</Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-h3">Two-Factor Authentication</h3>
        <p className="mt-1 text-body-sm text-dark-gray dark:text-mid-gray">Protect your account with one-time codes.</p>
        <Button className="mt-2" variant={twoFaEnabled ? "secondary" : "primary"} onClick={() => setTwoFaEnabled((v) => !v)}>
          {twoFaEnabled ? "Disable 2FA" : "Enable 2FA"}
        </Button>
      </Card>
    </div>
  );
}
