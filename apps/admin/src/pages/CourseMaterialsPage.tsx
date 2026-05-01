import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api";
import { Loader2, CheckCircle, XCircle, Eye } from "lucide-react";

interface Material {
  id: string;
  title: string;
  course: { code: string; title?: string; name?: string };
  uploadedBy: { fullName?: string; name?: string; email: string };
  approvedByAdmin: boolean;
  createdAt: string;
}

interface AcademicSchool {
  id: string;
  name: string;
  colleges: Array<{
    id: string;
    name: string;
    departments: Array<{
      id: string;
      name: string;
    }>;
  }>;
}

export function CourseMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [schools, setSchools] = useState<AcademicSchool[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; code: string; name?: string; title?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    schoolId: "",
    collegeId: "",
    departmentId: "",
    courseId: "",
    type: "PDF"
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    void fetchMaterials();
    void fetchSchools();
  }, [filterStatus]);

  useEffect(() => {
    void fetchCourses();
  }, [uploadForm.schoolId, uploadForm.collegeId, uploadForm.departmentId]);

  const selectedSchool = useMemo(
    () => schools.find((school) => school.id === uploadForm.schoolId),
    [schools, uploadForm.schoolId]
  );

  const colleges = selectedSchool?.colleges ?? [];

  const selectedCollege = useMemo(
    () => colleges.find((college) => college.id === uploadForm.collegeId),
    [colleges, uploadForm.collegeId]
  );

  const departments = selectedCollege?.departments ?? [];

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>(`/admin/academic/materials?status=${filterStatus}`);
      setMaterials(response.data || []);
    } catch (error) {
      console.error("Failed to fetch materials:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await apiClient.get<AcademicSchool[]>("/admin/academic/schools");
      const rows = Array.isArray(response.data) ? response.data : [];
      setSchools(rows);

      setUploadForm((prev) => {
        if (prev.schoolId) {
          return prev;
        }
        const defaultSchool = rows[0];
        const defaultCollege = defaultSchool?.colleges?.[0];
        const defaultDepartment = defaultCollege?.departments?.[0];

        return {
          ...prev,
          schoolId: defaultSchool?.id || "",
          collegeId: defaultCollege?.id || "",
          departmentId: defaultDepartment?.id || ""
        };
      });
    } catch (error) {
      console.error("Failed to fetch schools:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (uploadForm.schoolId) {
        params.set("schoolId", uploadForm.schoolId);
      }
      if (uploadForm.collegeId) {
        params.set("collegeId", uploadForm.collegeId);
      }
      if (uploadForm.departmentId) {
        params.set("departmentId", uploadForm.departmentId);
      }

      const response = await apiClient.get<any>(`/admin/academic/courses?${params.toString()}`);
      const rows = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];
      setCourses(rows);

      setUploadForm((prev) => {
        const validCourseStillSelected = rows.some((course: any) => course.id === prev.courseId);
        return {
          ...prev,
          courseId: validCourseStillSelected ? prev.courseId : rows[0]?.id || ""
        };
      });
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  const handleSchoolChange = (schoolId: string) => {
    const school = schools.find((row) => row.id === schoolId);
    const firstCollege = school?.colleges?.[0];
    const firstDepartment = firstCollege?.departments?.[0];

    setUploadForm((prev) => ({
      ...prev,
      schoolId,
      collegeId: firstCollege?.id || "",
      departmentId: firstDepartment?.id || "",
      courseId: ""
    }));
  };

  const handleCollegeChange = (collegeId: string) => {
    const college = colleges.find((row) => row.id === collegeId);
    const firstDepartment = college?.departments?.[0];

    setUploadForm((prev) => ({
      ...prev,
      collegeId,
      departmentId: firstDepartment?.id || "",
      courseId: ""
    }));
  };

  const handleDepartmentChange = (departmentId: string) => {
    setUploadForm((prev) => ({
      ...prev,
      departmentId,
      courseId: ""
    }));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !uploadForm.courseId || !uploadForm.title || !uploadForm.description) {
      alert("Please provide file, title, description, and course");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", uploadForm.title);
    formData.append("description", uploadForm.description);
    formData.append("courseId", uploadForm.courseId);
    formData.append("type", uploadForm.type);

    try {
      setUploading(true);
      await apiClient.post("/materials/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setUploadForm((prev) => ({
        ...prev,
        title: "",
        description: "",
      }));
      setFile(null);
      fetchMaterials();
    } catch (error: any) {
      console.error("Failed to upload material:", error);
      alert(error?.response?.data?.error || error?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (materialId: string) => {
    try {
      await apiClient.post(`/admin/academic/materials/${materialId}/approve`);
      fetchMaterials();
      setSelectedMaterial(null);
    } catch (error) {
      console.error("Failed to approve:", error);
    }
  };

  const handleReject = async (materialId: string) => {
    if (!window.confirm("Reject this material?")) return;

    try {
      await apiClient.post(`/admin/academic/materials/${materialId}/reject`, {
        reason: "Rejected by admin",
      });
      fetchMaterials();
      setSelectedMaterial(null);
    } catch (error) {
      console.error("Failed to reject:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Course Materials</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Approve or reject course materials</p>
      </div>

      <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
        <CardHeader>
          <CardTitle className="text-lg">Upload Material</CardTitle>
          <CardDescription>Admin uploads are auto-approved and available to students immediately.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="Data Structures Note"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="schoolId">University</Label>
                <select
                  id="schoolId"
                  value={uploadForm.schoolId}
                  onChange={(e) => handleSchoolChange(e.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="">Select university...</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="collegeId">College</Label>
                <select
                  id="collegeId"
                  value={uploadForm.collegeId}
                  onChange={(e) => handleCollegeChange(e.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-50"
                  disabled={!uploadForm.schoolId}
                >
                  <option value="">Select college...</option>
                  {colleges.map((college) => (
                    <option key={college.id} value={college.id}>
                      {college.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="departmentId">Department</Label>
                <select
                  id="departmentId"
                  value={uploadForm.departmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-50"
                  disabled={!uploadForm.collegeId}
                >
                  <option value="">Select department...</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="courseId">Course</Label>
              <select
                id="courseId"
                value={uploadForm.courseId}
                onChange={(e) => setUploadForm({ ...uploadForm, courseId: e.target.value })}
                className="mt-2 h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-50"
                disabled={!uploadForm.departmentId}
              >
                <option value="">Select course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name || course.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder="Lecture material for week 2"
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                  className="mt-2 h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="PDF">PDF</option>
                  <option value="DOC">DOC</option>
                  <option value="DOCX">DOCX</option>
                  <option value="MP4">MP4</option>
                  <option value="MP3">MP3</option>
                  <option value="WAV">WAV</option>
                </select>
              </div>
              <div>
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-2"
                />
              </div>
            </div>

            <Button type="submit" disabled={uploading}>
              {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Upload Material
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {["pending", "approved", "rejected"].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                onClick={() => setFilterStatus(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Materials ({filterStatus === "pending" ? "Pending" : filterStatus === "approved" ? "Approved" : "Rejected"})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">No materials found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{material.course.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{material.uploadedBy.fullName || material.uploadedBy.name}</p>
                          <p className="text-slate-600 dark:text-slate-400">
                            {material.uploadedBy.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(material.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={material.approvedByAdmin ? "success" : "warning"}
                        >
                          {material.approvedByAdmin ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {!material.approvedByAdmin && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(material.id)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(material.id)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
