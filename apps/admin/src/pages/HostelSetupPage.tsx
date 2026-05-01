import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { Loader2, Home, PlusCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

type Hostel = {
  id: string;
  name: string;
  gender: "MALE" | "FEMALE";
  distanceKm: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
};

const demoHostels: Hostel[] = [
  { id: "h1", name: "Nile Hall", gender: "MALE", distanceKm: 1.2, totalBeds: 120, occupiedBeds: 97, vacantBeds: 23 },
  { id: "h2", name: "Volga Hall", gender: "FEMALE", distanceKm: 0.9, totalBeds: 110, occupiedBeds: 88, vacantBeds: 22 },
  { id: "h3", name: "Danube Hall", gender: "MALE", distanceKm: 1.5, totalBeds: 90, occupiedBeds: 76, vacantBeds: 14 },
];

export function HostelSetupPage() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [hostelEnabled, setHostelEnabled] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [form, setForm] = useState({
    name: "",
    gender: "MALE",
    totalRooms: 20,
    bedsPerRoom: 4,
    distanceKm: 1,
  });

  const occupancy = useMemo(() => {
    const total = hostels.reduce((sum, h) => sum + h.totalBeds, 0);
    const occ = hostels.reduce((sum, h) => sum + h.occupiedBeds, 0);
    return total > 0 ? Math.round((occ / total) * 100) : 0;
  }, [hostels]);

  useEffect(() => {
    const load = async () => {
      try {
        // Load hostel config
        const configRes = await apiClient.get("/admin/config/settings").catch(() => ({ data: { hostelEnabled: true } }));
        setHostelEnabled(configRes.data?.hostelEnabled ?? true);

        // Load hostels
        const res = await apiClient.get<Hostel[]>("/admin/hostel/all");
        setHostels(Array.isArray(res.data) && res.data.length > 0 ? res.data : demoHostels);
      } catch {
        setHostelEnabled(true);
        setHostels(demoHostels);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const createHostel = async () => {
    try {
      setCreating(true);
      await apiClient.post("/admin/hostel/create", form);
      const res = await apiClient.get<Hostel[]>("/admin/hostel/all");
      setHostels(Array.isArray(res.data) && res.data.length > 0 ? res.data : demoHostels);
      setForm({ ...form, name: "" });
    } catch {
      const totalBeds = form.totalRooms * form.bedsPerRoom;
      setHostels((prev) => [
        {
          id: `demo-${Date.now()}`,
          name: form.name || "New Hall",
          gender: form.gender as "MALE" | "FEMALE",
          distanceKm: form.distanceKm,
          totalBeds,
          occupiedBeds: Math.floor(totalBeds * 0.72),
          vacantBeds: Math.ceil(totalBeds * 0.28),
        },
        ...prev,
      ]);
      setForm({ ...form, name: "" });
    } finally {
      setCreating(false);
    }
  };

  const deleteHostel = async (hostelId: string, hostelName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${hostelName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.delete(`/admin/hostel/${hostelId}`, {
        data: { confirmed: true },
      });
      setHostels((prev) => prev.filter((h) => h.id !== hostelId));
      alert("Hostel deleted successfully");
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Failed to delete hostel";
      alert(errorMsg);
    }
  };

  const saveHostelConfig = async () => {
    try {
      setSavingConfig(true);
      await apiClient.patch("/admin/config/settings", { hostelEnabled });
      toast.success("Hostel setting updated successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update hostel setting");
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-72"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Hostel Setup</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Create hostels and monitor capacity at a glance.</p>
      </div>

      <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
        <CardHeader>
          <CardTitle>Hostel Service Control</CardTitle>
          <CardDescription>Enable or disable the hostel feature for students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="hostelToggle" className="text-base font-semibold">
                {hostelEnabled ? "✓ Hostel Service Active" : "✗ Hostel Service Disabled"}
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {hostelEnabled 
                  ? "Students can view and book hostel rooms" 
                  : "Students will see a 'Coming Soon' message for hostel feature"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="hostelToggle"
                type="checkbox"
                checked={hostelEnabled}
                onChange={(e) => setHostelEnabled(e.target.checked)}
                className="w-6 h-6 rounded border-slate-300"
              />
              <Button
                onClick={saveHostelConfig}
                disabled={savingConfig}
                variant="default"
                size="sm"
              >
                {savingConfig && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Total Hostels</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{hostels.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Bed Capacity</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{hostels.reduce((s, h) => s + h.totalBeds, 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Global Occupancy</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{occupancy}%</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PlusCircle className="w-4 h-4" />Create New Hostel</CardTitle>
          <CardDescription>Quick setup for demo data and operational preview.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Block A" />
          </div>
          <div>
            <Label>Gender</Label>
            <select
              className="h-10 w-full rounded-md border px-3"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div>
            <Label>Total Rooms</Label>
            <Input type="number" value={form.totalRooms} onChange={(e) => setForm({ ...form, totalRooms: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Beds / Room</Label>
            <Input type="number" value={form.bedsPerRoom} onChange={(e) => setForm({ ...form, bedsPerRoom: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Distance (km)</Label>
            <Input type="number" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: Number(e.target.value) })} />
          </div>
          <div className="md:col-span-5">
            <Button onClick={createHostel} disabled={creating || !form.name.trim()}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create Hostel
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {hostels.map((h) => (
          <Card key={h.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Home className="w-4 h-4" />{h.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={h.gender === "MALE" ? "default" : "secondary"}>{h.gender}</Badge>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteHostel(h.id, h.name)}
                    title="Delete hostel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>{h.distanceKm}km from campus center</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span>Total Beds</span><strong>{h.totalBeds}</strong></div>
              <div className="flex justify-between"><span>Occupied</span><strong>{h.occupiedBeds}</strong></div>
              <div className="flex justify-between"><span>Vacant</span><strong>{h.vacantBeds}</strong></div>
              <div className="h-2 rounded bg-slate-200 overflow-hidden mt-2">
                <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, Math.round((h.occupiedBeds / Math.max(1, h.totalBeds)) * 100))}%` }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
