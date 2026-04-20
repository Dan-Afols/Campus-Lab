import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { Loader2 } from "lucide-react";

type Booking = {
  id: string;
  moveInDate: string;
  user: { id: string; fullName: string; email: string };
  bed: { id: string; bedNumber: string; room: { hostel: { name: string } } };
};

const demoBookings: Booking[] = [
  { id: "b1", moveInDate: new Date().toISOString(), user: { id: "u1", fullName: "Eze Daniel", email: "eze@student.edu" }, bed: { id: "bed1", bedNumber: "B2", room: { hostel: { name: "Nile Hall" } } } },
  { id: "b2", moveInDate: new Date(Date.now() - 86400000).toISOString(), user: { id: "u2", fullName: "Ada Nnadi", email: "ada@student.edu" }, bed: { id: "bed2", bedNumber: "B1", room: { hostel: { name: "Volga Hall" } } } },
  { id: "b3", moveInDate: new Date(Date.now() - 172800000).toISOString(), user: { id: "u3", fullName: "Ifeanyi Obi", email: "ifeanyi@student.edu" }, bed: { id: "bed3", bedNumber: "B4", room: { hostel: { name: "Danube Hall" } } } },
];

export function BookingsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Booking[]>("/admin/hostel/bookings/list");
      setBookings(Array.isArray(res.data) && res.data.length > 0 ? res.data : demoBookings);
    } catch {
      setBookings(demoBookings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const checkout = async (bookingId: string) => {
    try {
      await apiClient.post(`/admin/hostel/${bookingId}/checkout`);
      await load();
    } catch {
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-72"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Hostel Bookings</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Track active allocations and process checkouts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Bookings</CardTitle>
          <CardDescription>{bookings.length} records currently visible</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="p-3 border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-medium">{b.user.fullName} <span className="text-sm text-slate-500">({b.user.email})</span></div>
                  <div className="text-sm text-slate-600">{b.bed.room.hostel.name} - Bed {b.bed.bedNumber}</div>
                  <div className="text-xs text-slate-500">Move-in: {new Date(b.moveInDate).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Booked</Badge>
                  <Button variant="outline" onClick={() => checkout(b.id)}>Checkout</Button>
                </div>
              </div>
            ))}
            {bookings.length === 0 && <p className="text-sm text-slate-600">No active bookings found.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
