import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_PATHS = {
  superadmin: "/superadmin/dashboard",
  hod: "/hod/dashboard",
  student: "/student/dashboard",
};

function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  if (user.role !== allowedRole) {
    return <Navigate to={ROLE_PATHS[user.role] || "/"} replace />;
  }

  return children;
}

export default ProtectedRoute;
