import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { useAuth } from "./context/AuthContext";
import { AuthPage } from "./pages/AuthPage";
import { CalendarPage } from "./pages/CalendarPage";
import { CoursesPage } from "./pages/CoursesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FocusPage } from "./pages/FocusPage";
import { NotesPage } from "./pages/NotesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { TasksPage } from "./pages/TasksPage";
import { LoadingState } from "./components/PageState";
import { AttendancePage } from "./pages/AttendancePage";

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState label="Oturum kontrol ediliyor..." />;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/focus" element={<FocusPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
