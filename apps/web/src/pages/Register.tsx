import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { fetchRegistrationCatalog, register } from "@/lib/api";

const REGISTER_DRAFT_KEY = "campuslab_register_draft";

const schema = z
  .object({
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    email: z.string().email("Enter a valid email"),
    phoneNumber: z.string().min(7, "Phone number is required"),
    dateOfBirth: z.string().min(8, "Date of birth is required"),
    gender: z.enum(["MALE", "FEMALE"]),
    schoolId: z.string().min(1, "Select a school"),
    collegeId: z.string().min(1, "Select a college"),
    departmentId: z.string().min(1, "Select a department"),
    departmentLevelId: z.string().min(1, "Select a level"),
    matricNumber: z.string().min(3, "Matric number is required"),
    emergencyContactName: z.string().min(2, "Emergency contact name is required"),
    emergencyContactPhone: z.string().min(7, "Emergency contact phone is required"),
    role: z.enum(["STUDENT", "COURSE_REP"]),
    password: z
      .string()
      .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, "Use 8+ chars with uppercase, number, and symbol"),
    confirmPassword: z.string().min(8, "Confirm your password")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

type RegisterValues = z.infer<typeof schema>;
type Catalog = Awaited<ReturnType<typeof fetchRegistrationCatalog>>;

const EMPTY_VALUES: RegisterValues = {
  fullName: "",
  email: "",
  phoneNumber: "",
  dateOfBirth: "",
  gender: "MALE",
  schoolId: "",
  collegeId: "",
  departmentId: "",
  departmentLevelId: "",
  matricNumber: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  role: "STUDENT",
  password: "",
  confirmPassword: ""
};

export function RegisterScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadCatalog = async () => {
    try {
      setLoadingCatalog(true);
      setCatalogError(null);
      const response = await fetchRegistrationCatalog();
      setCatalog(response);
    } catch {
      setCatalogError("Unable to load universities, colleges, and departments. Check connection and retry.");
    } finally {
      setLoadingCatalog(false);
    }
  };

  const form = useForm<RegisterValues>({
    defaultValues: EMPTY_VALUES
  });

  useEffect(() => {
    const saved = sessionStorage.getItem(REGISTER_DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<RegisterValues>;
        form.reset({ ...EMPTY_VALUES, ...parsed });
      } catch {
        sessionStorage.removeItem(REGISTER_DRAFT_KEY);
      }
    }
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((values) => {
      sessionStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(values));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    void loadCatalog();
  }, []);

  const schoolId = form.watch("schoolId");
  const collegeId = form.watch("collegeId");
  const departmentId = form.watch("departmentId");

  const selectedSchool = useMemo(() => catalog?.schools.find((school) => school.id === schoolId), [catalog, schoolId]);
  const colleges = selectedSchool?.colleges ?? [];
  const selectedCollege = colleges.find((college) => college.id === collegeId);
  const departments = selectedCollege?.departments ?? [];
  const selectedDepartment = departments.find((department) => department.id === departmentId);
  const levels = selectedDepartment?.levels ?? [];

  useEffect(() => {
    if (!catalog?.schools?.length) {
      return;
    }

    const currentSchoolId = form.getValues("schoolId");
    if (currentSchoolId) {
      return;
    }

    const firstSchool = catalog.schools[0];
    const firstCollege = firstSchool?.colleges?.[0];
    const firstDepartment = firstCollege?.departments?.[0];
    const firstLevel = firstDepartment?.levels?.[0];

    form.setValue("schoolId", firstSchool?.id || "");
    form.setValue("collegeId", firstCollege?.id || "");
    form.setValue("departmentId", firstDepartment?.id || "");
    form.setValue("departmentLevelId", firstLevel?.id || "");
  }, [catalog, form]);

  useEffect(() => {
    if (!selectedSchool && colleges.length === 0) {
      form.setValue("collegeId", "");
      form.setValue("departmentId", "");
      form.setValue("departmentLevelId", "");
      return;
    }

    if (collegeId && !colleges.find((college) => college.id === collegeId)) {
      form.setValue("collegeId", "");
      form.setValue("departmentId", "");
      form.setValue("departmentLevelId", "");
    }
  }, [selectedSchool, colleges, collegeId, form]);

  useEffect(() => {
    if (departmentId && !departments.find((department) => department.id === departmentId)) {
      form.setValue("departmentId", "");
      form.setValue("departmentLevelId", "");
      return;
    }

    const currentDepartmentId = form.getValues("departmentId");
    if (!currentDepartmentId && departments[0]?.id) {
      form.setValue("departmentId", departments[0].id);
      form.setValue("departmentLevelId", departments[0].levels?.[0]?.id || "");
    }
  }, [departments, departmentId, form]);

  useEffect(() => {
    const currentLevel = form.getValues("departmentLevelId");
    if (!currentLevel && levels[0]?.id) {
      form.setValue("departmentLevelId", levels[0].id);
      return;
    }

    if (currentLevel && !levels.find((level) => level.id === currentLevel)) {
      form.setValue("departmentLevelId", "");
    }
  }, [levels, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const result = schema.safeParse(values);
    if (!result.success) {
      setSubmitError(result.error.issues[0]?.message || "Validation failed");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await register({
        fullName: result.data.fullName,
        email: result.data.email,
        password: result.data.password,
        matricNumber: result.data.matricNumber,
        phoneNumber: result.data.phoneNumber,
        dateOfBirth: result.data.dateOfBirth,
        gender: result.data.gender,
        schoolId: result.data.schoolId,
        collegeId: result.data.collegeId,
        departmentId: result.data.departmentId,
        departmentLevelId: result.data.departmentLevelId,
        role: result.data.role,
        emergencyContactName: result.data.emergencyContactName,
        emergencyContactPhone: result.data.emergencyContactPhone
      });

      sessionStorage.removeItem(REGISTER_DRAFT_KEY);
      toast.success("Account created successfully");
      if (response.requiresEmailVerification) {
        navigate("/verify-email", { replace: true });
      } else {
        navigate("/login", { replace: true, state: { message: "Account created successfully. Please sign in." } });
      }
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error || "Registration failed. Please review your fields and try again.");
    } finally {
      setSubmitting(false);
    }
  });

  const validateCurrentStep = async () => {
    const stepFields: Array<Array<keyof RegisterValues>> = [
      ["fullName", "email", "phoneNumber", "dateOfBirth", "gender"],
      ["schoolId", "collegeId", "departmentId", "departmentLevelId", "matricNumber"],
      ["emergencyContactName", "emergencyContactPhone", "role"],
      ["password", "confirmPassword"]
    ];

    const currentFields = stepFields[step - 1] ?? [];
    const valid = await form.trigger(currentFields, { shouldFocus: true });
    if (!valid) {
      setSubmitError("Please complete all required fields in this step.");
      return false;
    }

    setSubmitError(null);
    return true;
  };

  return (
    <div className="phone-frame min-h-screen p-4">
      <Card className="border-0 bg-gradient-to-br from-[#041937] via-[#0f2e5f] to-[#1c4f8f] text-white shadow-[0_16px_45px_rgba(4,25,55,0.45)]">
        <h1 className="text-h1">Join Campus Lab</h1>
        <p className="mt-1 text-body-sm text-white/85">Step {step} of 4. Your progress is saved as you type.</p>
      </Card>

      <Card className="mt-4 border-mid-gray/25 bg-white/95">
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          {step === 1 ? (
            <>
              <Input label="Full Name" {...form.register("fullName")} error={form.formState.errors.fullName?.message} />
              <Input label="Email" type="email" {...form.register("email")} error={form.formState.errors.email?.message} />
              <Input label="Phone Number" {...form.register("phoneNumber")} error={form.formState.errors.phoneNumber?.message} />
              <div>
                <label className="mb-1 block text-label text-dark-gray">Date of Birth</label>
                <input
                  type="date"
                  className="focus-ring h-11 w-full rounded-md border border-mid-gray/40 bg-white px-3 text-body-md text-near-black"
                  {...form.register("dateOfBirth")}
                />
                {form.formState.errors.dateOfBirth?.message ? <p className="mt-1 text-caption text-coral">{form.formState.errors.dateOfBirth.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-label text-dark-gray">Gender</label>
                <select
                  className="focus-ring h-11 w-full rounded-md border border-mid-gray/40 bg-white px-3 text-body-md text-near-black"
                  {...form.register("gender")}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div>
                <label className="mb-1 block text-label text-dark-gray">School</label>
                <select
                  className="focus-ring h-11 w-full rounded-md border border-mid-gray/40 bg-white px-3 text-body-md text-near-black"
                  {...form.register("schoolId")}
                  disabled={loadingCatalog}
                >
                  <option value="">Select school</option>
                  {(catalog?.schools || []).map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.schoolId?.message ? <p className="mt-1 text-caption text-coral">{form.formState.errors.schoolId.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-label text-dark-gray">College</label>
                <select
                  className="focus-ring h-11 w-full rounded-md border border-mid-gray/40 bg-white px-3 text-body-md text-near-black"
                  {...form.register("collegeId")}
                  disabled={loadingCatalog || !schoolId}
                >
                  <option value="">Select college</option>
                  {colleges.map((college) => (
                    <option key={college.id} value={college.id}>
                      {college.name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.collegeId?.message ? <p className="mt-1 text-caption text-coral">{form.formState.errors.collegeId.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-label text-dark-gray">Department</label>
                <select
                  className="focus-ring h-11 w-full rounded-md border border-mid-gray/40 bg-white px-3 text-body-md text-near-black"
                  {...form.register("departmentId")}
                  disabled={!collegeId}
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.departmentId?.message ? <p className="mt-1 text-caption text-coral">{form.formState.errors.departmentId.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-label text-dark-gray">Level</label>
                <select
                  className="focus-ring h-11 w-full rounded-md border border-mid-gray/40 bg-white px-3 text-body-md text-near-black"
                  {...form.register("departmentLevelId")}
                  disabled={!departmentId}
                >
                  <option value="">Select level</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.level}
                    </option>
                  ))}
                </select>
                {form.formState.errors.departmentLevelId?.message ? <p className="mt-1 text-caption text-coral">{form.formState.errors.departmentLevelId.message}</p> : null}
              </div>
              <Input label="Matric Number" {...form.register("matricNumber")} error={form.formState.errors.matricNumber?.message} />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Input label="Emergency Contact Name" {...form.register("emergencyContactName")} error={form.formState.errors.emergencyContactName?.message} />
              <Input label="Emergency Contact Phone" {...form.register("emergencyContactPhone")} error={form.formState.errors.emergencyContactPhone?.message} />
              <div>
                <label className="mb-1 block text-label text-dark-gray">Role</label>
                <select
                  className="focus-ring h-11 w-full rounded-md border border-mid-gray/40 bg-white px-3 text-body-md text-near-black"
                  {...form.register("role")}
                >
                  <option value="STUDENT">Student</option>
                  <option value="COURSE_REP">Course Representative</option>
                </select>
                {form.formState.errors.role?.message ? <p className="mt-1 text-caption text-coral">{form.formState.errors.role.message}</p> : null}
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <Input label="Password" type="password" {...form.register("password")} error={form.formState.errors.password?.message} />
              <Input label="Confirm Password" type="password" {...form.register("confirmPassword")} error={form.formState.errors.confirmPassword?.message} />
              <p className="text-caption text-dark-gray">Password must include uppercase, number, and special character.</p>
            </>
          ) : null}

          {submitError ? (
            <p className="text-body-sm text-coral">{submitError}</p>
          ) : null}

          {catalogError ? (
            <div className="space-y-2">
              <p className="text-body-sm text-coral">{catalogError}</p>
              <Button type="button" variant="ghost" onClick={() => void loadCatalog()}>
                Retry Loading Catalog
              </Button>
            </div>
          ) : null}

          {!loadingCatalog && catalog && catalog.schools.length === 0 ? (
            <p className="text-body-sm text-coral">No universities configured yet. Contact admin to add one.</p>
          ) : null}

          <div className="flex gap-2 pt-1">
            {step > 1 ? (
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            ) : null}
            {step < 4 ? (
              <Button
                type="button"
                className="flex-1"
                onClick={async () => {
                  const ok = await validateCurrentStep();
                  if (ok) {
                    setStep((s) => s + 1);
                  }
                }}
              >
                Continue
              </Button>
            ) : (
              <Button type="submit" className="flex-1" loading={submitting}>
                Create Account
              </Button>
            )}
          </div>
        </form>

        <p className="mt-4 text-body-sm">
          Already have an account? <Link className="font-medium text-electric-blue" to="/login">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}