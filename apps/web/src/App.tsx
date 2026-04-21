import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/stores/authStore";

const OnboardingSlides = lazy(() => import("@/pages/Onboarding").then((m) => ({ default: m.OnboardingSlides })));
const LoginScreen = lazy(() => import("@/pages/Login").then((m) => ({ default: m.LoginScreen })));
const RegisterScreen = lazy(() => import("@/pages/Register").then((m) => ({ default: m.RegisterScreen })));
const EmailVerification = lazy(() => import("@/pages/EmailVerification").then((m) => ({ default: m.EmailVerification })));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword").then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import("@/pages/ResetPassword").then((m) => ({ default: m.ResetPassword })));

const Dashboard = lazy(() => import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const NewsFeed = lazy(() => import("@/pages/NewsFeed").then((m) => ({ default: m.NewsFeed })));
const NewsDetail = lazy(() => import("@/pages/NewsDetail").then((m) => ({ default: m.NewsDetail })));
const NotificationCenter = lazy(() => import("@/pages/NotificationCenter").then((m) => ({ default: m.NotificationCenter })));
const AcademicsHome = lazy(() => import("@/pages/academics/AcademicsHome").then((m) => ({ default: m.AcademicsHome })));
const Timetable = lazy(() => import("@/pages/academics/Timetable").then((m) => ({ default: m.Timetable })));
const MaterialsList = lazy(() => import("@/pages/academics/MaterialsList").then((m) => ({ default: m.MaterialsList })));
const MaterialDetail = lazy(() => import("@/pages/academics/MaterialDetail").then((m) => ({ default: m.MaterialDetail })));
const PastQuestions = lazy(() => import("@/pages/academics/PastQuestions").then((m) => ({ default: m.PastQuestions })));
const CourseRepTimetableUpload = lazy(() => import("@/pages/academics/CourseRepTimetableUpload").then((m) => ({ default: m.CourseRepTimetableUpload })));
const CourseRepSendNotification = lazy(() => import("@/pages/academics/CourseRepSendNotification").then((m) => ({ default: m.CourseRepSendNotification })));
const HostelListing = lazy(() => import("@/pages/hostel/HostelListing").then((m) => ({ default: m.HostelListing })));
const HostelDetail = lazy(() => import("@/pages/hostel/HostelDetail").then((m) => ({ default: m.HostelDetail })));
const BedSelection = lazy(() => import("@/pages/hostel/BedSelection").then((m) => ({ default: m.BedSelection })));
const MyBooking = lazy(() => import("@/pages/hostel/MyBooking").then((m) => ({ default: m.MyBooking })));
const FinanceDashboard = lazy(() => import("@/pages/finance/FinanceDashboard").then((m) => ({ default: m.FinanceDashboard })));
const LogExpense = lazy(() => import("@/pages/finance/LogExpense").then((m) => ({ default: m.LogExpense })));
const ExpenseHistory = lazy(() => import("@/pages/finance/ExpenseHistory").then((m) => ({ default: m.ExpenseHistory })));
const SavingsGoals = lazy(() => import("@/pages/finance/SavingsGoals").then((m) => ({ default: m.SavingsGoals })));
const BudgetCalculator = lazy(() => import("@/pages/finance/BudgetCalculator").then((m) => ({ default: m.BudgetCalculator })));
const AIMealPlanner = lazy(() => import("@/pages/finance/AIMealPlanner").then((m) => ({ default: m.AIMealPlanner })));
const HealthDashboard = lazy(() => import("@/pages/health/HealthDashboard").then((m) => ({ default: m.HealthDashboard })));
const StepCounter = lazy(() => import("@/pages/health/StepCounter").then((m) => ({ default: m.StepCounter })));
const WaterTracker = lazy(() => import("@/pages/health/WaterTracker").then((m) => ({ default: m.WaterTracker })));
const SleepLog = lazy(() => import("@/pages/health/SleepLog").then((m) => ({ default: m.SleepLog })));
const RemindersSettings = lazy(() => import("@/pages/health/RemindersSettings").then((m) => ({ default: m.RemindersSettings })));
const AIAssistant = lazy(() => import("@/pages/AIAssistant").then((m) => ({ default: m.AIAssistant })));
const UserProfile = lazy(() => import("@/pages/UserProfile").then((m) => ({ default: m.UserProfile })));
const AppSettings = lazy(() => import("@/pages/settings/AppSettings").then((m) => ({ default: m.AppSettings })));
const SecuritySettings = lazy(() => import("@/pages/settings/SecuritySettings").then((m) => ({ default: m.SecuritySettings })));
const NotificationPreferences = lazy(() => import("@/pages/settings/NotificationPreferences").then((m) => ({ default: m.NotificationPreferences })));
const PrivacySettings = lazy(() => import("@/pages/settings/PrivacySettings").then((m) => ({ default: m.PrivacySettings })));
const ActiveSessions = lazy(() => import("@/pages/settings/ActiveSessions").then((m) => ({ default: m.ActiveSessions })));

function RouteShell() {
  const location = useLocation();
  const { hydrated, accessToken } = useAuthStore();

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.key} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
        <Routes location={location}>
          <Route path="/" element={<Navigate to={hydrated && accessToken ? "/dashboard" : "/login"} replace />} />
          <Route path="/onboarding" element={<OnboardingSlides />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/news" element={<NewsFeed />} />
              <Route path="/news/:id" element={<NewsDetail />} />
              <Route path="/notifications" element={<NotificationCenter />} />
              <Route path="/academics" element={<AcademicsHome />} />
              <Route path="/academics/timetable" element={<Timetable />} />
              <Route path="/academics/materials" element={<MaterialsList />} />
              <Route path="/academics/materials/:id" element={<MaterialDetail />} />
              <Route path="/academics/past-questions" element={<PastQuestions />} />
              <Route path="/academics/course-rep/timetable-upload" element={<CourseRepTimetableUpload />} />
              <Route path="/academics/course-rep/send-notification" element={<CourseRepSendNotification />} />
              <Route path="/hostel" element={<HostelListing />} />
              <Route path="/hostel/:id" element={<HostelDetail />} />
              <Route path="/hostel/:id/book" element={<BedSelection />} />
              <Route path="/hostel/my-booking" element={<MyBooking />} />
              <Route path="/finance" element={<FinanceDashboard />} />
              <Route path="/finance/log" element={<LogExpense />} />
              <Route path="/finance/history" element={<ExpenseHistory />} />
              <Route path="/finance/savings" element={<SavingsGoals />} />
              <Route path="/finance/budget" element={<BudgetCalculator />} />
              <Route path="/finance/meal-planner" element={<AIMealPlanner />} />
              <Route path="/health" element={<HealthDashboard />} />
              <Route path="/health/steps" element={<StepCounter />} />
              <Route path="/health/water" element={<WaterTracker />} />
              <Route path="/health/sleep" element={<SleepLog />} />
              <Route path="/health/reminders" element={<RemindersSettings />} />
              <Route path="/ai" element={<AIAssistant />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/settings" element={<AppSettings />} />
              <Route path="/settings/security" element={<SecuritySettings />} />
              <Route path="/settings/notifications" element={<NotificationPreferences />} />
              <Route path="/settings/privacy" element={<PrivacySettings />} />
              <Route path="/settings/active-sessions" element={<ActiveSessions />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export function App() {
  return (
    <Suspense fallback={<div className="p-4"><Skeleton variant="card" /></div>}>
      <RouteShell />
    </Suspense>
  );
}
