import { Card } from "@/components/ui/Card";
import { ScreenScaffold } from "@/pages/ScreenScaffold";

export function EmailVerification() {
  return (
    <ScreenScaffold title="Verify Email" description="Enter your verification code to continue.">
      <Card>
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">Enter the code sent to your email to activate your Campus Lab account.</p>
      </Card>
    </ScreenScaffold>
  );
}
