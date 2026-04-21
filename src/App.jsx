import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import HodDashboard from "./pages/HodDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role === "superadmin") return <Navigate to="/superadmin/dashboard" replace />;
  if (user.role === "hod") return <Navigate to="/hod/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />

        {/* Student */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* HOD */}
        <Route
          path="/hod/dashboard"
          element={
            <ProtectedRoute allowedRole="hod">
              <HodDashboard />
            </ProtectedRoute>
          }
        />

        {/* Super Admin */}
        <Route
          path="/superadmin/dashboard"
          element={
            <ProtectedRoute allowedRole="superadmin">
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
