import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api";
import { Loader2, Plus } from "lucide-react";

interface Course {
  id: string;
  code: string;
  title?: string;
  name?: string;
  creditHours: number;
  level: number;
  department: {
    name: string;
    college: {
      name: string;
    };
  };
}

export function PastQuestionsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState("");

  useEffect(() => {
    fetchCourses();
    if (selectedCourse) {
      fetchQuestions(selectedCourse);
    }
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchQuestions(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const response = await apiClient.get<any>("/admin/academic/courses?limit=100");
      const rows = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];
      setCourses(rows);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  const fetchQuestions = async (courseId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>(
        `/admin/academic/past-questions?courseId=${courseId}`
      );
      setQuestions(response.data || []);
    } catch (error) {
      console.error("Failed to fetch past questions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Past Questions</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Archive and manage past exam questions</p>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="course">Select Course</Label>
              <Select
                id="course"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="mt-2"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.title || course.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Past Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Past Questions ({questions.length})</CardTitle>
          <CardDescription>
            {selectedCourse ? (courses.find((c) => c.id === selectedCourse)?.title || courses.find((c) => c.id === selectedCourse)?.name) : "All courses"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">No past questions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question: any) => (
                    <TableRow key={question.id}>
                      <TableCell className="font-medium">
                        <Badge variant="secondary">{question.course?.code}</Badge>
                      </TableCell>
                      <TableCell>{question.year || "—"}</TableCell>
                      <TableCell>{question.semester || "Rain"}</TableCell>
                      <TableCell className="text-sm">
                        {question.uploadedBy?.name || question.uploadedBy?.fullName}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline">
                          Download
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
