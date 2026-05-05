import { Card } from "@/components/ui/Card";
import { ScreenScaffold } from "@/pages/ScreenScaffold";

export function HostelListing() {
  return (
    <ScreenScaffold title="Hostel Listing" description="Browse hostels and live bed availability.">
      <Card className="space-y-2">
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">Hostel booking system coming soon. We're preparing an exciting new feature to help you find the perfect accommodation.</p>
      </Card>

      <Card className="space-y-4 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
        <h3 className="text-h3 text-amber-900 dark:text-amber-100">🏨 Hostel Booking — Coming Soon</h3>
        <p className="text-body-sm text-amber-800 dark:text-amber-200">This feature is temporarily unavailable. We're working hard to bring you a seamless hostel booking experience. Check back later!</p>
      </Card>
    </ScreenScaffold>
  );
}
