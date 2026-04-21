import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = {
  superadmin: "Super Admin",
  hod: "HOD",
  student: "Student",
};

function Navbar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-brick-500 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center font-bold text-sm">
            RK
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">{title || "Semester Registration"}</h1>
            <p className="text-brick-200 text-xs">RGUKT RK Valley</p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium">{user?.name || user?.email}</span>
            <span className="text-brick-200 text-xs">{user?.department} · {ROLE_LABELS[user?.role]}</span>
          </div>
          <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium hidden sm:inline">
            {ROLE_LABELS[user?.role]}
          </span>
          <button
            onClick={handleLogout}
            className="bg-white text-brick-600 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-brick-50 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
