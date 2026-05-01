import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScreenScaffold } from "@/pages/ScreenScaffold";
import { useHostelsQuery } from "@/queries/useHostelQueries";
import api from "@/services/api";
import { useEffect, useState } from "react";

export function HostelListing() {
  const { data, isLoading } = useHostelsQuery();
  const hostels = Array.isArray(data) ? data : [];
  const [hostelEnabled, setHostelEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get<any>("/config/features");
        if (!mounted) return;
        setHostelEnabled(res.data?.hostelEnabled ?? true);
      } catch (e) {
        // If endpoint fails, default to enabled
        setHostelEnabled(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <ScreenScaffold title="Hostel Listing" description="Browse hostels and live bed availability.">
      <Card className="space-y-2">
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">Browse available hostels, compare distance and availability, and start a booking in a few taps.</p>
        <p className="text-caption text-mid-gray">{isLoading ? "Loading hostels..." : `${hostels.length} hostel(s) available for your profile`}</p>
      </Card>

      {hostelEnabled === false ? (
        <Card key="coming-soon" className="space-y-2">
          <h3 className="text-h3">Hostel — Coming Soon</h3>
          <p className="text-body-sm text-dark-gray">This feature is temporarily unavailable. Check back later.</p>
        </Card>
      ) : hostels.map((hostel: any) => (
        <Card key={hostel.id} className="space-y-2">
          <h3 className="text-h3">{hostel.name}</h3>
          <p className="text-body-sm text-dark-gray dark:text-mid-gray">{hostel.location} · {hostel.availableBeds} beds left</p>
          <p className="text-caption text-mid-gray">Session fee: N{Number(hostel.pricePerSession ?? 0).toLocaleString()}</p>
          <Link to={`/hostel/${hostel.id}`}>
            <Button className="w-full">View Hostel Details</Button>
          </Link>
        </Card>
      ))}
    </ScreenScaffold>
  );
}
