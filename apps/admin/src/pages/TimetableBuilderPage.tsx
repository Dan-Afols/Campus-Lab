import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: string;
  code: string;
  name: string;
  creditHours: number;
  level: number;
  department: {
    name: string;
  };
}

interface DepartmentOption {
  id: string;
  name: string;
  collegeName: string;
  schoolName: string;
}

export function TimetableBuilderPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courseForm, setCourseForm] = useState({
    departmentId: "",
    code: "",
    name: "",
    creditHours: "3",
    level: "100"
  });
  const [formData, setFormData] = useState({
    venue: "",
    day: "MONDAY",
    startTime: "09:00",
    endTime: "10:00",
    lecturer: "",
  });

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 10000);
    return () => clearInterval(id);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, timetableRes, schoolsRes] = await Promise.all([
        apiClient.get<any>("/admin/academic/courses?limit=200"),
        apiClient.get<any>("/admin/academic/timetable"),
        apiClient.get<any[]>("/admin/academic/schools")
      ]);
      const normalizedCourses = Array.isArray(coursesRes.data?.data)
        ? coursesRes.data.data
        : Array.isArray(coursesRes.data)
          ? coursesRes.data
          : [];
      setCourses(normalizedCourses);
      setTimetable(timetableRes.data || []);
      const normalizedDepartments: DepartmentOption[] = (schoolsRes.data || []).flatMap((school: any) =>
        (school.colleges || []).flatMap((college: any) =>
          (college.departments || []).map((department: any) => ({
            id: department.id,
            name: department.name,
            collegeName: college.name,
            schoolName: school.name
          }))
        )
      );
      setDepartments(normalizedDepartments);
      if (!courseForm.departmentId && normalizedDepartments[0]?.id) {
        setCourseForm((prev) => ({ ...prev, departmentId: normalizedDepartments[0].id }));
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseForm.departmentId || !courseForm.code || !courseForm.name) {
      alert("Department, course code, and course name are required");
      return;
    }

    try {
      await apiClient.post("/admin/academic/courses", {
        departmentId: courseForm.departmentId,
        code: courseForm.code.trim().toUpperCase(),
        name: courseForm.name.trim(),
        creditHours: Number(courseForm.creditHours || 3),
        level: Number(courseForm.level || 100),
      });

      setCourseForm((prev) => ({
        ...prev,
        code: "",
        name: "",
        creditHours: "3",
        level: "100",
      }));
      setShowCourseForm(false);
      fetchData();
    } catch (error: any) {
      console.error("Failed to create course:", error);
      alert(error?.response?.data?.message || "Failed to create course");
    }
  };

  const handleAddTimetable = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourse) {
      alert("Please select a course");
      return;
    }

    try {
      await apiClient.post("/admin/academic/timetable", {
        courseId: selectedCourse,
        day: formData.day,
        venue: formData.venue,
        lecturer: formData.lecturer,
        startTime: formData.startTime,
        endTime: formData.endTime,
      });

      setFormData({
        venue: "",
        day: "MONDAY",
        startTime: "09:00",
        endTime: "10:00",
        lecturer: "",
      });
      setSelectedCourse("");
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error("Failed to add timetable:", error);
    }
  };

  const handleDeleteTimetable = async (id: string) => {
    if (!window.confirm("Delete this timetable entry?")) return;
    try {
      await apiClient.delete(`/admin/academic/timetable/${id}`);
      fetchData();
    } catch (error) {
      console.error("Failed to delete timetable:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Timetable Builder</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Manage class schedules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCourseForm(!showCourseForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </Button>
        </div>
      </div>

      {showCourseForm && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-lg">Create Course</CardTitle>
            <CardDescription>Create a course, then assign it in timetable schedule.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  id="department"
                  value={courseForm.departmentId}
                  onChange={(e) => setCourseForm({ ...courseForm, departmentId: e.target.value })}
                  className="mt-2"
                >
                  <option value="">Select a department...</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name} ({department.collegeName}, {department.schoolName})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Course Code</Label>
                  <Input
                    id="code"
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    placeholder="CSC101"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Course Name</Label>
                  <Input
                    id="name"
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    placeholder="Introduction to Computing"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="creditHours">Credit Hours</Label>
                  <Input
                    id="creditHours"
                    type="number"
                    min={0}
                    max={6}
                    value={courseForm.creditHours}
                    onChange={(e) => setCourseForm({ ...courseForm, creditHours: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="level">Level</Label>
                  <Input
                    id="level"
                    type="number"
                    min={100}
                    max={900}
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Course</Button>
                <Button type="button" variant="outline" onClick={() => setShowCourseForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add Form */}
      {showAddForm && (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
          <CardHeader>
            <CardTitle className="text-lg">Add Class Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTimetable} className="space-y-4">
              <div>
                <Label htmlFor="course">Course</Label>
                <Select
                  id="course"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="mt-2"
                >
                  <option value="">Select a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="day">Day</Label>
                  <Select
                    id="day"
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="mt-2"
                  >
                    <option value="MONDAY">Monday</option>
                    <option value="TUESDAY">Tuesday</option>
                    <option value="WEDNESDAY">Wednesday</option>
                    <option value="THURSDAY">Thursday</option>
                    <option value="FRIDAY">Friday</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="venue">Venue/Room</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="LT 101"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="lecturer">Lecturer (Optional)</Label>
                <Input
                  id="lecturer"
                  value={formData.lecturer}
                  onChange={(e) => setFormData({ ...formData, lecturer: e.target.value })}
                  placeholder="Dr. John Smith"
                  className="mt-2"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Add Schedule</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Timetable Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Class Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : timetable.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">No schedules created yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Lecturer</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timetable.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        <Badge variant="secondary">{entry.course.code}</Badge>
                      </TableCell>
                      <TableCell>{entry.day || entry.dayOfWeek}</TableCell>
                      <TableCell>
                        {(entry.startTime || entry.startsAt)} - {(entry.endTime || entry.endsAt)}
                      </TableCell>
                      <TableCell>{entry.venue}</TableCell>
                      <TableCell>{entry.lecturer || "TBA"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteTimetable(entry.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
