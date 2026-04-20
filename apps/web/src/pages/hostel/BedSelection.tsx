import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { BedDouble, CheckCircle2, Hourglass, Lock, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Card } from "@/components/ui/Card";
import { useBookBedMutation, useHostelLayoutQuery } from "@/queries/useHostelQueries";

type BedState = "available" | "booked" | "coursemate" | "selected" | "processing";

type Bed = { id: string; number: string; state: BedState; floor?: number };

function mapStatus(status: string): BedState {
  if (status === "AVAILABLE") return "available";
  if (status === "BOOKED" || status === "HELD") return "booked";
  if (status === "COURSEMATE") return "coursemate";
  return "available";
}

export function BedSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data } = useHostelLayoutQuery(id);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [selected, setSelected] = useState<Bed | null>(null);
  const [success, setSuccess] = useState(false);
  const mutation = useBookBedMutation();

  useEffect(() => {
    const nextBeds: Bed[] = [];
    (data?.rooms ?? []).forEach((room: any) => {
      (room.beds ?? []).forEach((bed: any) => {
        nextBeds.push({
          id: bed.id,
          number: bed.bedNumber,
          state: mapStatus(bed.status),
          floor: room.floor
        });
      });
    });
    setBeds(nextBeds);
  }, [data]);

  const availableCount = useMemo(() => beds.filter((bed) => bed.state === "available").length, [beds]);

  const handleSelect = (bed: Bed) => {
    if (bed.state !== "available" && bed.state !== "coursemate") {
      return;
    }
    setSelected({ ...bed, state: "selected" });
  };

  const confirm = async () => {
    if (!selected) return;
    setBeds((prev) => prev.map((bed) => (bed.id === selected.id ? { ...bed, state: "processing" } : bed)));
    try {
      await mutation.mutateAsync({ bedId: selected.id, moveInDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() });
      setBeds((prev) => prev.map((bed) => (bed.id === selected.id ? { ...bed, state: "selected" } : bed)));
      setSuccess(true);
      confetti({ particleCount: 120, spread: 90 });
    } catch {
      setBeds((prev) => prev.map((bed) => (bed.id === selected.id ? { ...bed, state: "available" } : bed)));
    }
  };

  const icon = (state: BedState) => {
    if (state === "booked") return <Lock className="h-4 w-4" />;
    if (state === "selected") return <CheckCircle2 className="h-4 w-4" />;
    if (state === "coursemate") return <UserRound className="h-4 w-4" />;
    if (state === "processing") return <Hourglass className="h-4 w-4" />;
    return <BedDouble className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <Card className="bg-electric-blue/10">
        <p className="text-body-sm">Available beds: {availableCount}</p>
      </Card>

      <div className="grid grid-cols-4 gap-2">
        {beds.map((bed) => (
          <motion.button
            key={bed.id}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => handleSelect(bed)}
            className={[
              "focus-ring aspect-square rounded-md border-2 text-micro",
              bed.state === "available" && "border-emerald bg-emerald/10",
              bed.state === "booked" && "cursor-not-allowed border-coral bg-coral/10 opacity-70",
              bed.state === "selected" && "border-electric-blue bg-electric-blue/10 ring-2 ring-electric-blue/30",
              bed.state === "coursemate" && "border-amber bg-amber/10",
              bed.state === "processing" && "cursor-not-allowed border-mid-gray bg-light-gray"
            ].filter(Boolean).join(" ")}
          >
            <div className="mx-auto mb-1 w-fit">{icon(bed.state)}</div>
            <span>{bed.number}</span>
          </motion.button>
        ))}
      </div>

      <BottomSheet open={!!selected && !success} onClose={() => setSelected(null)} title="Confirm Bed Booking">
        <div className="space-y-2">
          <p className="text-body-sm">Hostel: {data?.hostel?.name ?? "Selected Hostel"}</p>
          <p className="text-body-sm">Floor: {selected?.floor ?? "-"}</p>
          <p className="text-body-sm">Bed: {selected?.number}</p>
          <Button className="mt-2 w-full" onClick={confirm} loading={mutation.isPending}>Confirm Booking</Button>
        </div>
      </BottomSheet>

      <BottomSheet open={success} onClose={() => setSuccess(false)} title="Booking Confirmed">
        <p className="text-body-md">Your hostel bed has been reserved successfully.</p>
        <Button className="mt-3 w-full" onClick={() => navigate("/hostel/my-booking")}>View My Booking</Button>
      </BottomSheet>
    </div>
  );
}
