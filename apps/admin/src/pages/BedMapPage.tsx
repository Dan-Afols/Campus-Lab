import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { apiClient } from "@/lib/api";
import { Loader2, Grid3x3, Plus } from "lucide-react";

interface Hostel {
  id: string;
  name: string;
  type: string;
  location: string;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
}

interface Bed {
  id: string;
  roomNumber: string;
  bedNumber: string;
  status: string;
  currentBooking?: {
    id: string;
    userId: string;
    student: {
      name: string;
      matricNumber: string;
    };
  };
}

interface StudentOption {
  id: string;
  fullName?: string;
  name?: string;
}

export function BedMapPage() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [selectedHostel, setSelectedHostel] = useState("");
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    type: "MIXED",
    location: "",
    totalRooms: 10,
    bedsPerRoom: 2,
    costPerSemester: 50000,
  });

  useEffect(() => {
    fetchHostels();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedHostel) {
      fetchBeds(selectedHostel);
    }
  }, [selectedHostel]);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>("/admin/hostel/all");
      const hostelList = response.data || [];
      setHostels(hostelList);
      if (hostelList.length > 0) {
        setSelectedHostel(hostelList[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch hostels:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBeds = async (hostelId: string) => {
    try {
      const response = await apiClient.get<any>(`/admin/hostel/${hostelId}/beds`);
      setBeds(response.data || []);
    } catch (error) {
      console.error("Failed to fetch beds:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await apiClient.get<any>("/admin/users/students?page=1&limit=200");
      const list = response.data?.data || [];
      setStudents(list);
      if (list.length > 0) {
        setSelectedStudentId(list[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  const handleAssignBed = async (bedId: string) => {
    if (!selectedStudentId) {
      alert("Please select a student to assign");
      return;
    }
    try {
      await apiClient.post(`/admin/hostel/${bedId}/assign`, {
        userId: selectedStudentId,
        moveInDate: new Date().toISOString(),
      });
      if (selectedHostel) {
        fetchBeds(selectedHostel);
        fetchHostels();
      }
    } catch (error) {
      console.error("Failed to assign bed:", error);
      alert("Could not assign bed");
    }
  };

  const handleCheckout = async (bookingId: string) => {
    if (!window.confirm("Check this student out of the bed?")) return;
    try {
      await apiClient.post(`/admin/hostel/${bookingId}/checkout`);
      if (selectedHostel) {
        fetchBeds(selectedHostel);
        fetchHostels();
      }
    } catch (error) {
      console.error("Failed to checkout:", error);
      alert("Could not checkout booking");
    }
  };

  const handleCreateHostel = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiClient.post("/admin/hostel/create", formData);
      setFormData({
        name: "",
        type: "MIXED",
        location: "",
        totalRooms: 10,
        bedsPerRoom: 2,
        costPerSemester: 50000,
      });
      setShowCreateForm(false);
      fetchHostels();
    } catch (error) {
      console.error("Failed to create hostel:", error);
    }
  };

  const groupBedsByRoom = () => {
    const grouped = new Map<string, Bed[]>();
    beds.forEach((bed) => {
      if (!grouped.has(bed.roomNumber)) {
        grouped.set(bed.roomNumber, []);
      }
      grouped.get(bed.roomNumber)!.push(bed);
    });
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Bed Map</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Visual bed allocation and management</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Hostel
        </Button>
      </div>

      {/* Create Hostel Form */}
      {showCreateForm && (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
          <CardHeader>
            <CardTitle className="text-lg">Create New Hostel</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateHostel} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Hostel Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Block A"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-2"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="MIXED">Mixed</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Campus West"
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="rooms">Total Rooms</Label>
                  <Input
                    id="rooms"
                    type="number"
                    value={formData.totalRooms}
                    onChange={(e) =>
                      setFormData({ ...formData, totalRooms: parseInt(e.target.value) })
                    }
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="beds">Beds Per Room</Label>
                  <Input
                    id="beds"
                    type="number"
                    value={formData.bedsPerRoom}
                    onChange={(e) =>
                      setFormData({ ...formData, bedsPerRoom: parseInt(e.target.value) })
                    }
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="cost">Cost Per Semester</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.costPerSemester}
                    onChange={(e) =>
                      setFormData({ ...formData, costPerSemester: parseInt(e.target.value) })
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Hostel</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Hostel Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Hostel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedHostel} onChange={(e) => setSelectedHostel(e.target.value)}>
            <option value="">Select a hostel...</option>
            {hostels.map((hostel) => (
              <option key={hostel.id} value={hostel.id}>
                {hostel.name} ({hostel.occupiedBeds}/{hostel.totalBeds} occupied)
              </option>
            ))}
          </Select>
          <div>
            <Label htmlFor="studentAssign">Student To Assign</Label>
            <Select id="studentAssign" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
              <option value="">Select student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.fullName || s.name}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bed Map */}
      {selectedHostel && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bed Map</CardTitle>
            <CardDescription>{hostels.find(h => h.id === selectedHostel)?.name}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {groupBedsByRoom().map(([room, roomBeds]) => (
                  <div key={room} className="border-l-4 border-indigo-600 pl-4">
                    <h3 className="font-semibold mb-3">Room {room}</h3>
                    <div className="grid grid-cols-auto gap-3">
                      {roomBeds.map((bed) => (
                        <button
                          key={bed.id}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            bed.status === "BOOKED"
                              ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                              : "border-green-500 bg-green-50 dark:bg-green-900/20"
                          }`}
                          title={bed.currentBooking ? `Occupied by ${bed.currentBooking.student.name}` : "Vacant"}
                          onClick={() => {
                            if (bed.status === "AVAILABLE") {
                              handleAssignBed(bed.id);
                            } else if (bed.currentBooking?.id) {
                              handleCheckout(bed.currentBooking.id);
                            }
                          }}
                        >
                          <div className="text-sm font-medium">
                            Bed {bed.bedNumber}
                          </div>
                          <Badge variant={bed.status === "BOOKED" ? "destructive" : "success"}>
                            {bed.status === "BOOKED" ? "Occupied" : "Vacant"}
                          </Badge>
                          {bed.currentBooking && (
                            <div className="text-xs mt-2 text-slate-600 dark:text-slate-400">
                              {bed.currentBooking.student.name}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
