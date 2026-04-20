import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScreenScaffold } from "@/pages/ScreenScaffold";
import { useMyBookingQuery } from "@/queries/useHostelQueries";

export function MyBooking() {
  const { data, isLoading, error } = useMyBookingQuery();

  if (error) {
    return (
      <ScreenScaffold title="My Booking" description="Your current hostel assignment details.">
        <Card className="space-y-2">
          <p className="text-body-sm text-dark-gray dark:text-mid-gray">You do not have an active booking yet.</p>
          <Link to="/hostel">
            <Button className="w-full">Browse Hostels</Button>
          </Link>
        </Card>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold title="My Booking" description="Your current hostel assignment details.">
      <Card className="space-y-2">
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">Review your current bed, payment status, and booking history from the hostel service.</p>
        <p className="text-body-md font-semibold">{isLoading ? "Loading..." : data?.bed?.hostel?.name ?? "-"}</p>
        <p className="text-body-sm">Room {data?.bed?.roomNumber ?? "-"} · Bed {data?.bed?.bedNumber ?? "-"}</p>
        <p className="text-caption text-mid-gray">Floor {data?.bed?.floor ?? "-"} · Move-in {data?.moveInDate ? new Date(data.moveInDate).toLocaleDateString() : "-"}</p>
      </Card>

      <Card>
        <p className="text-caption text-mid-gray">Location</p>
        <p className="text-body-sm">{data?.bed?.hostel?.location ?? "-"}</p>
        <p className="mt-1 text-caption text-mid-gray">Session fee: N{Number(data?.bed?.hostel?.pricePerSession ?? 0).toLocaleString()}</p>
      </Card>
    </ScreenScaffold>
  );
}
