import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import { Loader2, Plus, Trash2 } from "lucide-react";

type Department = {
  id: string;
  name: string;
};

type College = {
  id: string;
  name: string;
  departments: Department[];
};

type School = {
  id: string;
  name: string;
  colleges: College[];
};

type CollegeDraft = {
  name: string;
  departmentsText: string;
};

const EMPTY_COLLEGE_DRAFT: CollegeDraft = {
  name: "",
  departmentsText: ""
};

export function AcademicStructurePage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [editingSchoolName, setEditingSchoolName] = useState("");

  const [schoolName, setSchoolName] = useState("");
  const [colleges, setColleges] = useState<CollegeDraft[]>([{ ...EMPTY_COLLEGE_DRAFT }]);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<School[]>("/admin/academic/schools");
      setSchools(Array.isArray(response.data) ? response.data : []);
    } catch (loadError: any) {
      console.error("Failed to load academic structure:", loadError);
      setError(loadError?.response?.data?.message || "Failed to load academic structure");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSchools();
  }, []);

  const totalDepartments = useMemo(
    () => schools.reduce((sum, school) => sum + school.colleges.reduce((inner, college) => inner + (college.departments?.length || 0), 0), 0),
    [schools]
  );

  const setCollegeField = (index: number, field: keyof CollegeDraft, value: string) => {
    setColleges((current) =>
      current.map((draft, i) => {
        if (i !== index) {
          return draft;
        }
        return {
          ...draft,
          [field]: value
        };
      })
    );
  };

  const addCollege = () => {
    setColleges((current) => [...current, { ...EMPTY_COLLEGE_DRAFT }]);
  };

  const removeCollege = (index: number) => {
    setColleges((current) => {
      if (current.length === 1) {
        return current;
      }
      return current.filter((_, i) => i !== index);
    });
  };

  const beginEditSchool = (school: School) => {
    setEditingSchoolId(school.id);
    setEditingSchoolName(school.name);
    setError(null);
    setSuccess(null);
  };

  const cancelEditSchool = () => {
    setEditingSchoolId(null);
    setEditingSchoolName("");
  };

  const saveSchoolName = async (schoolId: string) => {
    const normalizedName = editingSchoolName.trim();
    if (!normalizedName) {
      setError("University name is required.");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.patch(`/admin/academic/schools/${schoolId}`, { name: normalizedName });
      toast.success("University updated");
      setSuccess("University updated successfully.");
      setEditingSchoolId(null);
      setEditingSchoolName("");
      await loadSchools();
    } catch (updateError: any) {
      setError(updateError?.response?.data?.message || "Failed to update university");
    } finally {
      setSubmitting(false);
    }
  };

  // College edit helpers (rename existing college)
  const [editingCollegeId, setEditingCollegeId] = useState<string | null>(null);
  const [editingCollegeName, setEditingCollegeName] = useState("");

  const beginEditCollege = (college: College) => {
    setEditingCollegeId(college.id);
    setEditingCollegeName(college.name);
    setError(null);
    setSuccess(null);
  };

  const saveCollegeName = async (collegeId: string) => {
    const normalized = editingCollegeName.trim();
    if (!normalized) {
      setError("College name is required.");
      return;
    }
    try {
      setSubmitting(true);
      await apiClient.patch(`/admin/academic/colleges/${collegeId}`, { name: normalized });
      toast.success("College updated");
      setSuccess("College updated successfully.");
      setEditingCollegeId(null);
      setEditingCollegeName("");
      await loadSchools();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update college");
    } finally {
      setSubmitting(false);
    }
  };

  const addCollegeToSchool = async (schoolId: string) => {
    const name = window.prompt("New college name");
    if (!name || !name.trim()) return;
    try {
      setSubmitting(true);
      await apiClient.post(`/admin/academic/colleges`, { schoolId, name: name.trim() });
      toast.success("College added");
      await loadSchools();
    } catch (err) {
      console.error(err);
      setError("Failed to add college");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSchool = async (schoolId: string, schoolName: string) => {
    if (!window.confirm(`Delete university "${schoolName}" and all related data? This cannot be undone.`)) return;
    try {
      setSubmitting(true);
      await apiClient.delete(`/admin/academic/schools/${schoolId}`);
      toast.success("University deleted");
      await loadSchools();
    } catch (err) {
      console.error(err);
      setError("Failed to delete university. Check related records.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSchoolName("");
    setColleges([{ ...EMPTY_COLLEGE_DRAFT }]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedSchoolName = schoolName.trim();
    if (!normalizedSchoolName) {
      setError("University name is required.");
      return;
    }

    const normalizedColleges = colleges
      .map((entry) => ({
        name: entry.name.trim(),
        departments: entry.departmentsText
          .split("\n")
          .map((department) => department.trim())
          .filter(Boolean)
      }))
      .filter((entry) => entry.name.length > 0);

    if (normalizedColleges.length === 0) {
      setError("Add at least one college with departments.");
      return;
    }

    if (normalizedColleges.some((entry) => entry.departments.length === 0)) {
      setError("Each college must have at least one department.");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post("/admin/academic/structure", {
        schoolName: normalizedSchoolName,
        colleges: normalizedColleges
      });

      setSuccess("University structure created successfully.");
      resetForm();
      await loadSchools();
    } catch (submitError: any) {
      console.error("Failed to create academic structure:", submitError);
      setError(submitError?.response?.data?.message || "Failed to create university structure");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Academic Structure</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Create universities with their colleges and departments. Signup and admin selectors update from this data.
        </p>
      </div>

      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="text-lg">Add University</CardTitle>
          <CardDescription>
            Add one university and all its colleges/departments in one action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="schoolName">University name</Label>
              <Input
                id="schoolName"
                value={schoolName}
                onChange={(event) => setSchoolName(event.target.value)}
                placeholder="McPherson University"
                className="mt-2"
              />
            </div>

            {colleges.map((college, index) => (
              <div key={`college-draft-${index}`} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">College {index + 1}</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => removeCollege(index)} disabled={colleges.length === 1}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`college-name-${index}`}>College name</Label>
                    <Input
                      id={`college-name-${index}`}
                      value={college.name}
                      onChange={(event) => setCollegeField(index, "name", event.target.value)}
                      placeholder="College of Computing and Engineering"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`college-departments-${index}`}>Departments (one per line)</Label>
                    <Textarea
                      id={`college-departments-${index}`}
                      value={college.departmentsText}
                      onChange={(event) => setCollegeField(index, "departmentsText", event.target.value)}
                      placeholder={"Computer Science\nSoftware Engineering\nInformation Technology"}
                      className="mt-2 min-h-[110px]"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={addCollege}>
                <Plus className="mr-2 h-4 w-4" />
                Add Another College
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save University Structure
              </Button>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Academic Hierarchy</CardTitle>
          <CardDescription>
            {schools.length} universities, {totalDepartments} departments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            </div>
          ) : schools.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">No universities found yet.</p>
          ) : (
            <div className="space-y-4">
              {schools.map((school) => (
                <div key={school.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between gap-3">
                    {editingSchoolId === school.id ? (
                      <Input value={editingSchoolName} onChange={(event) => setEditingSchoolName(event.target.value)} className="max-w-md" />
                    ) : (
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{school.name}</h3>
                    )}
                    <div className="flex gap-2">
                      {editingSchoolId === school.id ? (
                        <>
                          <Button type="button" variant="outline" size="sm" onClick={() => saveSchoolName(school.id)} disabled={submitting}>
                            Save
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={cancelEditSchool}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button type="button" variant="outline" size="sm" onClick={() => beginEditSchool(school)}>
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 space-y-3">
                    {school.colleges?.map((college) => (
                      <div key={college.id}>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{college.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {(college.departments || []).map((department) => department.name).join(", ") || "No departments"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
