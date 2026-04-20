import { Link, useParams } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScreenScaffold } from "@/pages/ScreenScaffold";
import { useHostelLayoutQuery } from "@/queries/useHostelQueries";

export function HostelDetail() {
  const { id } = useParams();
  const { data, isLoading } = useHostelLayoutQuery(id);
  const rooms = data?.rooms ?? [];
  const availableBeds = rooms.reduce(
    (total: number, room: any) => total + (room.beds ?? []).filter((bed: any) => bed.status === "AVAILABLE").length,
    0
  );

  return (
    <ScreenScaffold title="Hostel Detail" description="Room layouts, amenities, and rules.">
      <Card className="space-y-2">
        <h3 className="text-h3">{isLoading ? "Loading..." : data?.hostel?.name ?? "Hostel"}</h3>
        <p className="text-body-sm text-dark-gray dark:text-mid-gray">See room options, bed status, and booking rules for the hostel you selected.</p>
        <p className="text-caption text-mid-gray">Rooms: {rooms.length} · Available beds: {availableBeds}</p>
        {id ? (
          <Link to={`/hostel/${id}/book`}>
            <Button className="w-full">Select Bed</Button>
          </Link>
        ) : null}
      </Card>

      {rooms.map((room: any) => (
        <Card key={room.id} className="space-y-2">
          <p className="text-body-md font-semibold">Room {room.roomNumber} · Floor {room.floor}</p>
          <div className="grid grid-cols-3 gap-2">
            {(room.beds ?? []).map((bed: any) => (
              <div key={bed.id} className="rounded-md border border-mid-gray/20 px-2 py-1 text-caption">
                {bed.bedNumber} · {String(bed.status).toLowerCase()}
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card>
        <p className="text-caption text-mid-gray">Rules</p>
        <ul className="mt-1 space-y-1 text-body-sm text-dark-gray dark:text-mid-gray">
          <li>One active booking per student.</li>
          <li>Cancellation closes 24 hours before move-in.</li>
          <li>Respect room hygiene and quiet hours.</li>
        </ul>
      </Card>
    </ScreenScaffold>
  );
}
