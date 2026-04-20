import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";
import { LoginPage } from "@/pages/LoginPage";
import { ProtectedRoute } from "@/lib/protected-route";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";


// Import all pages
import { DashboardPage } from "@/pages/DashboardPage";
import { AllStudentsPage } from "@/pages/AllStudentsPage";
import { CourseRepsPage } from "@/pages/CourseRepsPage";
import { AdminsPage } from "@/pages/AdminsPage";
import { TimetableBuilderPage } from "@/pages/TimetableBuilderPage";
import { AcademicStructurePage } from "@/pages/AcademicStructurePage";
import { CourseMaterialsPage } from "@/pages/CourseMaterialsPage";
import { PastQuestionsPage } from "@/pages/PastQuestionsPage";
import { BedMapPage } from "@/pages/BedMapPage";
import { AllNewsPostsPage } from "@/pages/AllNewsPostsPage";
import { CreateNewsPostPage } from "@/pages/CreateNewsPostPage";
import { AuditLogsPage } from "@/pages/AuditLogsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { HostelSetupPage } from "@/pages/HostelSetupPage";
import { BookingsPage } from "@/pages/BookingsPage";
import { NotificationLogsPage } from "@/pages/NotificationLogsPage";

function App() {
  const { isAuthenticated, admin } = useAuthStore();

  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* User Management */}
        <Route
          path="/users/students"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AllStudentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/course-reps"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CourseRepsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/admins"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AdminsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Academic Management */}
        <Route
          path="/academic/structure"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AcademicStructurePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic/timetable"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TimetableBuilderPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic/materials"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CourseMaterialsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic/past-questions"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PastQuestionsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Hostel Management */}
        <Route
          path="/hostel/setup"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <HostelSetupPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hostel/bed-map"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <BedMapPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hostel/bookings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <BookingsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* News Management */}
        <Route
          path="/news/create"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CreateNewsPostPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/news/all"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AllNewsPostsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/news/notifications"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <NotificationLogsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* System Management */}
        <Route
          path="/system/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/system/audit-logs"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AuditLogsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
