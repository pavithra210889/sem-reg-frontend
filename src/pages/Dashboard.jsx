import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h2 className="text-xl sm:text-2xl font-bold">
        Welcome to Semester Registration
      </h2>

      <button
        onClick={logout}
        className="mt-6 px-6 py-2 bg-red-500 text-white rounded-md"
      >
        Logout
      </button>
    </div>
  );
}

export default Dashboard;