import { useState } from "react";
import { FileAudio, FileText, FileVideo, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";
import { useMaterialsQuery } from "@/queries/useMaterialsQuery";
import api from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";

const filters = ["all", "pdf", "video", "audio", "past", "bookmarked"];

export function MaterialsList() {
  const [filter, setFilter] = useState("all");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    type: "PDF",
    file: null as File | null
  });

  const { data } = useMaterialsQuery(filter);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const departmentName = typeof user?.department === "string" ? user.department : user?.department?.name;

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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess("");

    if (!formData.file || !formData.title || !formData.courseId || !formData.type) {
      setUploadError("Please fill in all required fields");
      return;
    }

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", formData.file);
      uploadFormData.append("title", formData.title);
      uploadFormData.append("description", formData.description);
      uploadFormData.append("courseId", formData.courseId);
      uploadFormData.append("type", formData.type);

      await api.post("/materials/upload", uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setUploadSuccess("Material uploaded successfully! Pending admin approval.");
      setFormData({ title: "", description: "", courseId: "", type: "PDF", file: null });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      
      setTimeout(() => {
        setShowUploadForm(false);
        setUploadSuccess("");
      }, 2000);
    } catch (error: any) {
      setUploadError(error?.response?.data?.error || "Failed to upload material");
    } finally {
      setUploading(false);
    }
  };

  const isCoursRep = user?.role === "COURSE_REP" || user?.role === "ADMIN";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((name) => (
            <Chip key={name} active={filter === name} onClick={() => setFilter(name)}>
              {name.toUpperCase()}
            </Chip>
          ))}
        </div>
        {isCoursRep && (
          <Button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center gap-2 whitespace-nowrap"
            size="sm"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        )}
      </div>

      {showUploadForm && (
        <Card className="p-4 space-y-4 bg-light-gray">
          <h3 className="font-semibold">Upload Course Material</h3>
          {uploadError && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{uploadError}</div>}
          {uploadSuccess && <div className="text-sm text-green-600 bg-green-50 p-2 rounded">{uploadSuccess}</div>}

          <form onSubmit={handleUploadSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Calculus 101 Lecture Notes"
                className="w-full px-3 py-2 border rounded text-sm"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional: Describe the material content"
                className="w-full px-3 py-2 border rounded text-sm"
                rows={2}
                disabled={uploading}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
                disabled={uploading}
              >
                <option value="PDF">PDF Document</option>
                <option value="DOC">Word Document</option>
                <option value="DOCX">Word Document (Modern)</option>
                <option value="MP4">Video</option>
                <option value="MP3">Audio</option>
                <option value="WAV">Audio (WAV)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Course ID *</label>
              <input
                type="text"
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                placeholder="e.g., MTH301"
                className="w-full px-3 py-2 border rounded text-sm"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="text-sm font-medium">File *</label>
              <input
                type="file"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                className="w-full text-sm"
                accept=".pdf,.doc,.docx,.mp4,.mp3,.wav"
                disabled={uploading}
              />
              {formData.file && (
                <p className="text-xs text-mid-gray mt-1">Selected: {formData.file.name}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? "Uploading..." : "Upload Material"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowUploadForm(false)}
                disabled={uploading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>

            <p className="text-xs text-mid-gray">
              Material will be uploaded under your department {departmentName || ""} and pending admin approval.
            </p>
          </form>
        </Card>
      )}

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
