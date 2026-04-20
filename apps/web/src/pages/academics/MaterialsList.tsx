import { useState } from "react";
import { FileAudio, FileText, FileVideo } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { useMaterialsQuery } from "@/queries/useMaterialsQuery";

const filters = ["all", "pdf", "video", "audio", "past", "bookmarked"];

export function MaterialsList() {
  const [filter, setFilter] = useState("all");
  const { data } = useMaterialsQuery(filter);
  const items = Array.isArray(data) && data.length ? data : [
    { id: "1", type: "pdf", title: "Fluid Mechanics", courseCode: "MTH 301", date: "Today" },
    { id: "2", type: "video", title: "Signals Revision", courseCode: "CPE 307", date: "Yesterday" }
  ];

  const iconByType = (type: string) => {
    const normalized = String(type || "").toLowerCase();
    if (["video", "mp4"].includes(normalized)) return <FileVideo className="h-4 w-4" />;
    if (["audio", "mp3", "wav"].includes(normalized)) return <FileAudio className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((name) => (
          <Chip key={name} active={filter === name} onClick={() => setFilter(name)}>
            {name.toUpperCase()}
          </Chip>
        ))}
      </div>

      <div className="space-y-2">
        {items.map((item: any) => (
          <Link key={item.id} to={`/academics/materials/${item.id}`}>
            <Card variant="list-item" className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-electric-blue/10 text-electric-blue">
                  {iconByType(item.type)}
                </span>
                <div>
                  <p className="text-body-sm font-medium">{item.title}</p>
                  <p className="text-caption text-mid-gray">
                    {item.courseCode || item.course?.code} · {item.date || new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge color="violet">AI</Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
