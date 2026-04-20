import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useTimetableQuery } from "@/queries/useTimetableQuery";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function Timetable() {
  const [selectedDay, setSelectedDay] = useState(days[new Date().getDay() - 1] ?? "Mon");
  const [viewMode, setViewMode] = useState("day");
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data } = useTimetableQuery(selectedDay);
  const classes = useMemo(() => (Array.isArray(data) && data.length ? data : [
    { id: "1", code: "MTH 301", title: "Numerical Methods", venue: "LT-4", time: "10:00" },
    { id: "2", code: "CPE 307", title: "Digital Systems", venue: "Lab 3", time: "13:00" }
  ]), [data]);

  return (
    <div className="space-y-4">
      <SegmentedControl
        items={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }]}
        value={viewMode}
        onChange={setViewMode}
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((day) => (
          <Chip key={day} active={selectedDay === day} onClick={() => setSelectedDay(day)}>
            {day}
          </Chip>
        ))}
      </div>

      {viewMode === "day" ? (
        <div className="space-y-3">
          {classes.map((item: any) => (
            <Card key={item.id} className="border-l-4 border-l-electric-blue">
              <p className="text-label text-electric-blue">{item.code}</p>
              <h3 className="text-body-md font-semibold">{item.title}</h3>
              <p className="text-caption text-mid-gray">{item.time} · {item.venue}</p>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid min-w-[560px] grid-cols-5 gap-2">
            {days.map((day) => (
              <Card key={day} className="cursor-pointer" onClick={() => setSheetOpen(true)}>
                <p className="text-label text-electric-blue">{day}</p>
                <p className="mt-2 text-body-sm">Tap to inspect classes</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Class Detail">
        <p className="text-body-sm">MTH 301 in 45 minutes · Room LT-4</p>
      </BottomSheet>
    </div>
  );
}
