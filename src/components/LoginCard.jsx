import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import API from "../api";

const ROLE_PATHS = {
  superadmin: "/superadmin/dashboard",
  hod: "/hod/dashboard",
  student: "/student/dashboard",
};

function LoginCard() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError("Please enter both email and password");
      return;
    }
    try {
      setError("");
      setLoading(true);
      const res = await API.post("/auth/login", form);
      login(res.data.user, res.data.token);
      navigate(ROLE_PATHS[res.data.user.role] || "/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    try {
      setError("");
      setLoading(true);
      const res = await API.post("/auth/google", { token: credentialResponse.credential });
      login(res.data.user, res.data.token);
      navigate(ROLE_PATHS[res.data.user.role] || "/");
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">

        {/* ── LEFT PANEL ── */}
        <div className="md:w-5/12 bg-brick-500 flex flex-col items-center justify-center p-10 text-white text-center">
          {/* Logo placeholder - replace src with actual logo path */}
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-5">
            <span className="text-4xl font-black text-white">RK</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">RGUKT</h1>
          <p className="text-brick-100 text-sm font-medium mt-1">RK Valley</p>
          <div className="mt-6 border-t border-white/20 pt-6 w-full">
            <p className="text-brick-200 text-xs leading-relaxed">
              Rajiv Gandhi University of<br />Knowledge Technologies<br />RK Valley Campus
            </p>
          </div>
          <div className="mt-6 flex gap-2 flex-wrap justify-center">
            {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"].map((d) => (
              <span key={d} className="text-xs bg-white/10 px-2 py-0.5 rounded text-brick-100">{d}</span>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome Back</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to access Semester Registration</p>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="your@rguktrkv.ac.in"
                value={form.email}
                className={`input-field ${error ? "border-red-400 focus:ring-red-300" : ""}`}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  className={`input-field pr-12 ${error ? "border-red-400 focus:ring-red-300" : ""}`}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5 flex items-center gap-2">
                <span>⚠</span> {error}
              </div>
            )}

            {/* Login button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="btn-primary w-full text-center"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google Login */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogle}
                onError={() => setError("Google sign-in failed")}
                theme="outline"
                size="large"
                width="100%"
              />
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-8 text-center">
            For queries:{" "}
            <a href="mailto:websupport@rguktrkv.ac.in" className="text-brick-500 hover:underline">
              websupport@rguktrkv.ac.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginCard;
