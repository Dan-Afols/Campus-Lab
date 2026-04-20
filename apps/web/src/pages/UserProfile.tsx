import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Edit3 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useHealthDashboardQuery } from "@/queries/useHealthQueries";
import { useMeQuery } from "@/queries/useProfileQueries";
import { useUpdateProfileMutation } from "@/queries/useProfileQueries";
import { useAuthStore } from "@/stores/authStore";

function resolveLevelLabel(user: any) {
  const levelValue = user?.departmentLevel?.level ?? user?.level;
  const parsed =
    typeof levelValue === "string"
      ? Number.parseInt(levelValue, 10)
      : typeof levelValue === "number"
        ? levelValue
        : typeof levelValue?.level === "number"
          ? levelValue.level
          : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return "Unavailable";
  }

  return `${parsed >= 100 ? parsed : parsed * 100}L`;
}

export function UserProfile() {
  const { data } = useMeQuery();
  const { data: healthData } = useHealthDashboardQuery();
  const authUser = useAuthStore((state) => state.user);
  const updateProfileMutation = useUpdateProfileMutation();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const stepTotal = (healthData?.steps ?? []).reduce((sum: number, entry: any) => sum + Number(entry.steps ?? 0), 0);

  const user = data ?? authUser ?? {
    fullName: "Student",
    email: "student@campuslab.app",
    matricNumber: "",
    department: { name: "" },
    departmentLevel: { level: undefined },
    phoneNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    profilePhotoUrl: ""
  };

  useEffect(() => {
    const source = data ?? authUser;
    if (!source) {
      return;
    }

    setFullName(source.fullName ?? "");
    setPhoneNumber((source as any).phoneNumber ?? "");
    setEmergencyContactName((source as any).emergencyContactName ?? "");
    setEmergencyContactPhone((source as any).emergencyContactPhone ?? "");
    setProfilePhotoPreview((source as any).profilePhotoUrl ?? "");
  }, [data, authUser]);

  const saveProfile = async () => {
    const formData = new FormData();
    formData.append("fullName", fullName || user.fullName);
    formData.append("phoneNumber", phoneNumber);
    formData.append("emergencyContactName", emergencyContactName);
    formData.append("emergencyContactPhone", emergencyContactPhone);
    if (profilePhotoFile) {
      formData.append("profilePhoto", profilePhotoFile);
    } else if (profilePhotoPreview) {
      formData.append("profilePhotoUrl", profilePhotoPreview);
    }

    await updateProfileMutation.mutateAsync(formData);
    toast.success("Profile updated");
    setEditing(false);
    setProfilePhotoFile(null);
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 text-white" style={{ background: "var(--gradient-brand)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={user.fullName} src={(user as any)?.profilePhotoUrl} size={80} />
            <div>
              <p className="text-h2">{user.fullName}</p>
              <p className="text-body-sm text-white/85">{user.matricNumber || "Matric unavailable"}</p>
              <p className="text-body-sm text-white/85">{resolveLevelLabel(user)} · {typeof user.department === "string" ? user.department : user.department?.name ?? "Department unavailable"}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setEditing((v) => !v)}>
            <Edit3 className="mr-1 h-4 w-4" />Edit
          </Button>
        </div>
      </Card>

      {editing ? (
        <Card>
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            <Input label="Phone number" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
            <Input label="Emergency contact name" value={emergencyContactName} onChange={(event) => setEmergencyContactName(event.target.value)} />
            <Input label="Emergency contact phone" value={emergencyContactPhone} onChange={(event) => setEmergencyContactPhone(event.target.value)} />
          </div>
          <div className="mt-3 space-y-2">
            <label className="block text-label text-dark-gray dark:text-mid-gray">Profile picture</label>
            <Input
              label="Profile picture URL"
              value={profilePhotoPreview}
              onChange={(event) => setProfilePhotoPreview(event.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              className="block w-full text-body-sm text-dark-gray dark:text-mid-gray"
              onChange={(event) => setProfilePhotoFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button loading={updateProfileMutation.isPending} onClick={saveProfile}>Save</Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        <Card className="text-center"><p className="text-caption text-mid-gray">Active Days</p><p className="text-h3">21</p></Card>
        <Card className="text-center"><p className="text-caption text-mid-gray">Materials</p><p className="text-h3">17</p></Card>
        <Card className="text-center"><p className="text-caption text-mid-gray">Steps</p><p className="text-h3">{stepTotal.toLocaleString()}</p></Card>
      </div>

      <Card>
        <h3 className="text-h3">Personal Info</h3>
        <p className="mt-2 text-body-sm">Email: {user.email}</p>
        <p className="text-body-sm">Phone: {(user as any).phoneNumber || "Not set"}</p>
        <p className="text-body-sm">Profile photo: {(user as any).profilePhotoUrl ? "Uploaded" : "Not uploaded yet"}</p>
      </Card>

      <Card>
        <h3 className="text-h3">Academic Info</h3>
        <p className="mt-2 text-body-sm">Department: {typeof user.department === "string" ? user.department : user.department?.name ?? "N/A"}</p>
        <p className="text-body-sm">Level: {resolveLevelLabel(user)}</p>
        <p className="text-body-sm">Matric number: {user.matricNumber || "Unavailable"}</p>
        <p className="text-body-sm">Emergency contact: {(user as any).emergencyContactName || "Not set"}</p>
      </Card>
    </div>
  );
}
