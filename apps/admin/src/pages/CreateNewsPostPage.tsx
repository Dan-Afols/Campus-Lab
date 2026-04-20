import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import { Loader2, Save } from "lucide-react";

export function CreateNewsPostPage() {
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "ADMINISTRATION",
    schoolId: "",
    imageUrl: "",
    scheduledPublish: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadSchools = async () => {
      try {
        const response = await apiClient.get("/admin/academic/schools");
        const normalized = Array.isArray(response.data)
          ? response.data.map((school: any) => ({ id: school.id, name: school.name }))
          : [];
        setSchools(normalized);
        setFormData((current) => ({ ...current, schoolId: current.schoolId || normalized[0]?.id || "" }));
      } catch (error) {
        console.error("Failed to load schools:", error);
      }
    };

    void loadSchools();
  }, []);

  const getErrorMessage = (error: any, fallback: string) => {
    return error?.response?.data?.message || fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      alert("Please fill title and content");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        schoolId: formData.schoolId,
        targetAudience: [],
        imageUrl: formData.imageUrl.trim() || undefined,
        scheduledPublish: formData.scheduledPublish || undefined,
      };

      await apiClient.post("/admin/news/posts", {
        ...payload,
      });

      setSuccessMessage("Post created successfully!");
      setFormData((current) => ({
        title: "",
        content: "",
        category: "ADMINISTRATION",
        schoolId: current.schoolId,
        imageUrl: "",
        scheduledPublish: "",
      }));

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to create post:", error);
      alert(getErrorMessage(error, "Failed to create post"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create News Post</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Write and publish announcements</p>
      </div>

      {successMessage && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <p className="text-green-900 dark:text-green-50">{successMessage}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Post Title</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter post title..."
              className="text-lg"
            />
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Content</CardTitle>
            <CardDescription>Write or paste your announcement content</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your post content here..."
              rows={12}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="schoolId">University</Label>
              <Select
                id="schoolId"
                value={formData.schoolId}
                onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                className="mt-2"
              >
                <option value="">Select university</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-2"
                >
                  <option value="GENERAL">General</option>
                  <option value="ACADEMIC">Academic</option>
                  <option value="EVENTS">Events</option>
                  <option value="ADMINISTRATION">Administration</option>
                  <option value="URGENT_ALERTS">Urgent Alerts</option>
                  <option value="SPORTS">Sports</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="scheduled">Schedule (Optional)</Label>
                <Input
                  id="scheduled"
                  type="datetime-local"
                  value={formData.scheduledPublish}
                  onChange={(e) => setFormData({ ...formData, scheduledPublish: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="imageUrl">Cover Image URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading} size="lg">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            Publish Post
          </Button>
          <Button type="button" variant="outline" size="lg">
            Preview
          </Button>
        </div>
      </form>
    </div>
  );
}
