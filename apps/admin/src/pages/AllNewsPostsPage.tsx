import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api";
import { Loader2, Plus, Trash2, Send } from "lucide-react";

interface NewsPost {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  creator?: { fullName?: string; name?: string };
}

export function AllNewsPostsPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "ADMINISTRATION",
    schoolId: "",
    imageUrl: "",
  });
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  const limit = 20;

  useEffect(() => {
    fetchPosts();
    void fetchSchools();
  }, [page]);

  const getErrorMessage = (error: any, fallback: string) => {
    return error?.response?.data?.message || fallback;
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>(`/admin/news/posts?page=${page}&limit=${limit}`);
      setPosts(response.data.data || []);
      setTotal(response.data.pagination.total || 0);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await apiClient.get("/admin/academic/schools");
      const normalized = Array.isArray(response.data)
        ? response.data.map((school: any) => ({ id: school.id, name: school.name }))
        : [];
      setSchools(normalized);
      setFormData((current) => ({ ...current, schoolId: current.schoolId || normalized[0]?.id || "" }));
    } catch (error) {
      console.error("Failed to fetch schools:", error);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        schoolId: formData.schoolId,
        targetAudience: [],
        imageUrl: formData.imageUrl.trim() || undefined,
      };

      await apiClient.post("/admin/news/posts", payload);
      setFormData((current) => ({
        title: "",
        content: "",
        category: "ADMINISTRATION",
        schoolId: current.schoolId,
        imageUrl: ""
      }));
      setShowCreateForm(false);
      fetchPosts();
      alert("Post created successfully");
    } catch (error) {
      console.error("Failed to create post:", error);
      alert(getErrorMessage(error, "Failed to create post"));
    }
  };

  const handleSendNotification = async (postId: string) => {
    try {
      await apiClient.post(`/admin/news/posts/${postId}/send-notification`, {
        message: `New update: Check the latest posts!`,
      });
      alert("Notification queued for delivery");
    } catch (error) {
      console.error("Failed to send notification:", error);
      alert(getErrorMessage(error, "Failed to send notification"));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Delete this post?")) return;

    try {
      await apiClient.delete(`/admin/news/posts/${postId}`);
      fetchPosts();
      alert("Post deleted successfully");
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert(getErrorMessage(error, "Failed to delete post"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">News Posts</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Create and manage news announcements</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Create Post Form */}
      {showCreateForm && (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
          <CardHeader>
            <CardTitle className="text-lg">Create News Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Post title..."
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Post content..."
                  rows={5}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="school">University</Label>
                  <Select
                    id="school"
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
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Post</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Posts ({total})</CardTitle>
          <CardDescription>Page {page}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">No posts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{post.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{post.creator?.fullName || post.creator?.name || "Admin"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleSendNotification(post.id)}
                            title="Send notification"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {total > limit && (
            <div className="flex gap-2 mt-4 justify-center">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button variant="outline" disabled>
                Page {page} of {Math.ceil(total / limit)}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(total / limit)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
