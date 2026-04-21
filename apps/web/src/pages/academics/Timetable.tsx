import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useTimetableQuery } from "@/queries/useTimetableQuery";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };

export function Timetable() {
  const [selectedDay, setSelectedDay] = useState(days[new Date().getDay() - 1] ?? "Mon");
  const [viewMode, setViewMode] = useState("day");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const { data: allClasses = [] } = useTimetableQuery(selectedDay);

  const classes = useMemo(() => {
    const dayOfWeek = dayMap[selectedDay as keyof typeof dayMap] || 1;
    const filtered = (Array.isArray(allClasses) ? allClasses : [])
      .filter((item: any) => item.dayOfWeek === dayOfWeek)
      .sort((a: any, b: any) => a.startsAt.localeCompare(b.startsAt));
    return filtered.length > 0 ? filtered : [];
  }, [allClasses, selectedDay]);

  const weekClasses = useMemo(() => {
    return days.map((day) => {
      const dayOfWeek = dayMap[day as keyof typeof dayMap];
      return (Array.isArray(allClasses) ? allClasses : [])
        .filter((item: any) => item.dayOfWeek === dayOfWeek)
        .length;
    });
  }, [allClasses]);

  return (
    <div className="space-y-4">
      <SegmentedControl
        items={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }]}
        value={viewMode}
        onChange={setViewMode}
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((day, idx) => (
          <Chip key={day} active={selectedDay === day} onClick={() => setSelectedDay(day)}>
            {day} ({weekClasses[idx]})
          </Chip>
        ))}
      </div>

      {viewMode === "day" ? (
        <div className="space-y-3">
          {classes.length > 0 ? (
            classes.map((item: any) => (
              <Card 
                key={item.id} 
                className="border-l-4 border-l-electric-blue cursor-pointer"
                onClick={() => { setSelectedClass(item); setSheetOpen(true); }}
              >
                <p className="text-label text-electric-blue">{item.course?.code || "Course"}</p>
                <h3 className="text-body-md font-semibold">{item.course?.title || "Class"}</h3>
                <p className="text-caption text-mid-gray">{item.startsAt} · {item.venue}</p>
                <p className="text-xs text-mid-gray mt-1">Lecturer: {item.lecturer}</p>
              </Card>
            ))
          ) : (
            <Card className="text-center py-6">
              <p className="text-body-sm text-mid-gray">No classes scheduled for {selectedDay}</p>
            </Card>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid min-w-[560px] grid-cols-5 gap-2">
            {days.map((day, idx) => (
              <Card key={day} className="cursor-pointer" onClick={() => setSelectedDay(day)}>
                <p className="text-label text-electric-blue">{day}</p>
                <p className="mt-2 text-body-sm font-semibold">{weekClasses[idx]} classes</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Class Details">
        {selectedClass && (
          <div className="space-y-2">
            <p className="text-label text-electric-blue">{selectedClass.course?.code}</p>
            <p className="text-body-md font-semibold">{selectedClass.course?.title}</p>
            <p className="text-caption text-mid-gray">Time: {selectedClass.startsAt} - {selectedClass.endsAt}</p>
            <p className="text-caption text-mid-gray">Venue: {selectedClass.venue}</p>
            <p className="text-caption text-mid-gray">Lecturer: {selectedClass.lecturer}</p>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
