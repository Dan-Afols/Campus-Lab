import { Card } from "@/components/ui/Card";
import { ScreenScaffold } from "@/pages/ScreenScaffold";

export function OnboardingSlides() {
  return (
    <ScreenScaffold title="Welcome to Campus Lab" description="Your university life, all in one place.">
      <Card>
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">Set up your account once, then use the same profile, school feed, and notifications across the PWA and admin-connected services.</p>
      </Card>
    </ScreenScaffold>
  );
}
