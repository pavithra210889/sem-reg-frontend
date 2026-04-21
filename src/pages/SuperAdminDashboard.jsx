import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import API from "../api";

const DEPARTMENTS  = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"];
const YEARS        = [1, 2, 3, 4];
const SEMESTERS    = [1, 2];
const CUR          = new Date().getFullYear();
const ACADEMIC_YEARS = [
  `${CUR - 1}-${String(CUR).slice(2)}`,
  `${CUR}-${String(CUR + 1).slice(2)}`,
  `${CUR + 1}-${String(CUR + 2).slice(2)}`,
];

const STATUS_CONFIG = {
  active:    { label: "Active",    cls: "badge-active" },
  detained:  { label: "Detained",  cls: "badge-detained" },
  graduated: { label: "Graduated", cls: "badge-graduated" },
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-brick-200 border-t-brick-500 rounded-full animate-spin" />
    </div>
  );
}

function Alert({ msg }) {
  if (!msg?.text) return null;
  const ok = msg.type === "success";
  return (
    <div className={`rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${
      ok ? "bg-green-50 text-green-700 border border-green-200"
         : "bg-red-50 text-red-600 border border-red-200"
    }`}>
      <span>{ok ? "✓" : "⚠"}</span> {msg.text}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  const bg = {
    red:    "bg-brick-50 border-brick-200",
    green:  "bg-green-50 border-green-200",
    amber:  "bg-amber-50 border-amber-200",
    blue:   "bg-blue-50 border-blue-200",
    purple: "bg-purple-50 border-purple-200",
  };
  return (
    <div className={`card border p-5 ${bg[color] || "bg-gray-50 border-gray-200"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-black text-gray-800 mt-1">{value ?? "—"}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  const cls = { student: "badge-student", hod: "badge-hod", superadmin: "badge-superadmin" };
  return <span className={`badge ${cls[role] || ""} capitalize`}>{role}</span>;
}

function StatusBadge({ status }) {
  return status === "open"
    ? <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />OPEN
      </span>
    : <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs font-semibold px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full inline-block" />CLOSED
      </span>;
}

function useRegulations() {
  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading]         = useState(true);
  useEffect(() => {
    API.get("/superadmin/regulations")
      .then((r) => setRegulations(r.data.regulations))
      .catch(() => setRegulations(["R23"]))
      .finally(() => setLoading(false));
  }, []);
  return { regulations, loading };
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: REGISTRATION WINDOWS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
// ── Live countdown hook — ticks every second while deadline is in future ────────
function useDeadlineCountdown(deadline, isOpen) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!deadline || !isOpen) { setTimeLeft(null); return; }
    const dl = new Date(deadline);

    const tick = () => {
      const diff = dl - new Date();
      if (diff <= 0) { setTimeLeft("expired"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000)  / 60000);
      const s = Math.floor((diff % 60000)    / 1000);
      if (d > 0)      setTimeLeft(`${d}d ${h}h ${m}m remaining`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s remaining`);
      else if (m > 0) setTimeLeft(`${m}m ${s}s remaining`);
      else            setTimeLeft(`${s}s remaining`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline, isOpen]);

  return timeLeft;
}

function WindowCard({ w, fmt, actionId, onOpen, onClose, onDelete, onRefresh }) {
  const isOpen    = w.status === "open";
  const countdown = useDeadlineCountdown(w.deadline, isOpen);
  const isExpired = countdown === "expired";

  // When countdown hits "expired", wait 2 s then re-fetch so superadmin
  // sees the window flip to Closed (backend already closed it on next GET).
  useEffect(() => {
    if (!isExpired) return;
    const t = setTimeout(() => onRefresh?.(), 2000);
    return () => clearTimeout(t);
  }, [isExpired]);

  // Border colour: green = open, orange = about to expire (≤1 h), red = expired, gray = closed
  const borderCls = !isOpen
    ? "border-l-gray-200"
    : isExpired
      ? "border-l-orange-400 bg-orange-50/30"
      : countdown && countdown.startsWith("0") || (countdown && !countdown.startsWith("expired") && countdown.includes("m") && !countdown.includes("h") && !countdown.includes("d"))
        ? "border-l-amber-400"
        : "border-l-green-500";

  return (
    <div className={`card p-4 border-l-4 transition ${borderCls}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={w.status} />
            <span className="font-bold text-gray-800">E{w.targetYear} — Year {w.targetYear}</span>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded">{w.regulation}</span>
            <span className="text-gray-500 text-sm">Sem {w.semester} · {w.academicYear}</span>
          </div>

          <div className="text-xs text-gray-400 space-y-0.5">
            {w.openedAt && <p>Opened: {fmt(w.openedAt)}</p>}
            {w.batchEmail && <p className="text-xs text-blue-600 mt-0.5">📧 Batch: {w.batchEmail}</p>}
            {w.closedAt && <p>Closed: {fmt(w.closedAt)}</p>}
            {w.note     && <p className="italic text-gray-500">"{w.note}"</p>}
          </div>

          {/* Deadline display — shows countdown if open, plain time if closed */}
          {w.deadline && (
            <div className="mt-1">
              {isOpen ? (
                isExpired ? (
                  <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    ⏰ Deadline passed — closing automatically…
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    countdown && !countdown.includes("d") && !countdown.includes("h")
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    ⏰ {fmt(w.deadline)} &nbsp;·&nbsp; {countdown}
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full">
                  ⏰ Deadline was: {fmt(w.deadline)}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 items-center">
          {w.status === "closed" ? (
            <button onClick={() => onOpen(w._id)} disabled={actionId === w._id}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50">
              {actionId === w._id ? "..." : "Open"}
            </button>
          ) : (
            <button onClick={() => onClose(w._id)} disabled={actionId === w._id || isExpired}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50">
              {actionId === w._id ? "..." : isExpired ? "Closing…" : "Close"}
            </button>
          )}
          {w.status === "closed" && (
            <button onClick={() => onDelete(w._id)} disabled={actionId === w._id}
              className="text-red-400 hover:text-red-600 text-xs font-semibold px-2 disabled:opacity-50">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WindowsTab() {
  const [windows,   setWindows]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [actionId,  setActionId]  = useState(null);
  const [msg,       setMsg]       = useState({ text: "", type: "" });
  const [showForm,  setShowForm]  = useState(false);
  const { regulations, loading: regLoading } = useRegulations();

  const EMPTY = { academicYear: ACADEMIC_YEARS[1], semester: "1", targetYear: "1", regulation: "", deadline: "", note: "", batchEmail: "" };
  const [form,     setForm]     = useState(EMPTY);
  const [formMsg,  setFormMsg]  = useState({ text: "", type: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (regulations.length > 0 && !form.regulation) setForm((p) => ({ ...p, regulation: regulations[0] }));
  }, [regulations]);

  const fetchWindows = useCallback(async () => {
    try { setLoading(true); const r = await API.get("/superadmin/windows"); setWindows(r.data.windows); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWindows(); }, [fetchWindows]);

  const flash = (text, type = "success") => { setMsg({ text, type }); setTimeout(() => setMsg({ text: "", type: "" }), 5000); };

  const handleCreate = async () => {
    setFormMsg({ text: "", type: "" });
    if (!form.academicYear || !form.semester || !form.targetYear || !form.regulation) { setFormMsg({ text: "All fields are required", type: "error" }); return; }
    try {
      setCreating(true);
      await API.post("/superadmin/windows", form);
      setShowForm(false); setForm({ ...EMPTY, regulation: regulations[0] || "" });
      flash("Window created. Click Open to activate it."); fetchWindows();
    } catch (e) { setFormMsg({ text: e.response?.data?.message || "Failed to create window", type: "error" }); }
    finally { setCreating(false); }
  };

  const handleOpen = async (id) => {
    if (!window.confirm("Open this window? Students can start registering.")) return;
    try { setActionId(id); await API.patch(`/superadmin/windows/${id}/open`); flash("Window opened ✓"); fetchWindows(); }
    catch (e) { flash(e.response?.data?.message || "Failed", "error"); } finally { setActionId(null); }
  };

  const handleClose = async (id) => {
    if (!window.confirm("Close this window?")) return;
    try { setActionId(id); await API.patch(`/superadmin/windows/${id}/close`); flash("Window closed."); fetchWindows(); }
    catch (e) { flash(e.response?.data?.message || "Failed", "error"); } finally { setActionId(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this window permanently?")) return;
    try { setActionId(id); await API.delete(`/superadmin/windows/${id}`); flash("Window deleted."); fetchWindows(); }
    catch (e) { flash(e.response?.data?.message || "Failed", "error"); } finally { setActionId(null); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  const openWins   = windows.filter((w) => w.status === "open");
  const closedWins = windows.filter((w) => w.status === "closed");

  return (
    <div className="space-y-5">
      <Alert msg={msg} />
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <p className="text-sm text-gray-600 font-medium">Currently open: <strong className="text-green-600">{openWins.length}</strong> window(s)</p>
          <p className="text-xs text-gray-400 mt-0.5">Multiple windows can be open — each targets a different year + regulation.</p>
        </div>
        <button onClick={() => setShowForm((p) => !p)} className="btn-primary text-sm">{showForm ? "✕ Cancel" : "+ New Window"}</button>
      </div>

      <div className="card p-4 bg-blue-50 border border-blue-200">
        <p className="text-sm font-semibold text-blue-800 mb-1">ℹ️ How Registration Windows Work</p>
        <div className="text-xs text-blue-700 space-y-1">
          <p>• Each window targets a <strong>specific year + regulation</strong> (e.g. E3 R23).</p>
          <p>• Multiple windows can be open simultaneously — one per year+regulation combination.</p>
          <p>• Students only see the window matching their year and regulation.</p>
          <p>• If a <strong>deadline</strong> is set, the window closes automatically when it passes. No manual action needed.</p>
        </div>
      </div>

      {showForm && (
        <div className="card p-6 space-y-4 border-2 border-brick-200">
          <h3 className="font-semibold text-gray-800">Create Registration Window</h3>
          {regLoading ? <p className="text-sm text-gray-400 animate-pulse">Loading regulations...</p> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Academic Year</label>
                <input
                  type="text"
                  placeholder="e.g. 2026-27"
                  value={form.academicYear}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Semester</label>
                <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="input-field">
                  <option value="1">Semester 1</option><option value="2">Semester 2</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Target Year</label>
                <select value={form.targetYear} onChange={(e) => setForm({ ...form, targetYear: e.target.value })} className="input-field">
                  {YEARS.map((y) => <option key={y} value={y}>E{y} — Year {y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Regulation</label>
                <select value={form.regulation} onChange={(e) => setForm({ ...form, regulation: e.target.value })} className="input-field">
                  {regulations.length === 0 ? <option value="">No regulations yet</option> : regulations.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Deadline (optional)</label>
                <input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Note (optional)</label>
                <input type="text" placeholder="e.g. Register before 15 Jan" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="input-field" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Batch Email <span className="text-gray-400 font-normal normal-case">(optional — notify all students with this email prefix)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. r21@rguktrkv.ac.in — notifies all students whose email starts with r21"
                  value={form.batchEmail}
                  onChange={(e) => setForm({ ...form, batchEmail: e.target.value })}
                  className="input-field"
                />
                <p className="text-xs text-gray-400 mt-1">
                  When window is opened, all matching students receive a registration notification email automatically.
                </p>
              </div>
            </div>
          )}
          <Alert msg={formMsg} />
          <div className="flex gap-3 items-center flex-wrap">
            <button onClick={handleCreate} disabled={creating || regulations.length === 0} className="btn-primary disabled:opacity-50">
              {creating ? "Creating..." : "Create Window"}
            </button>
            <button onClick={() => { setShowForm(false); setFormMsg({ text: "", type: "" }); }} className="btn-outline">Cancel</button>
            <p className="text-xs text-gray-400">⚠ Window is created as <strong>CLOSED</strong>. Click Open to activate.</p>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : windows.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🗓️</p>
          <p className="font-medium text-gray-600">No registration windows yet</p>
        </div>
      ) : (
        <div className="space-y-5">
          {openWins.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />Open — students can register ({openWins.length})
              </p>
              <div className="space-y-2">{openWins.map((w) => <WindowCard key={w._id} w={w} fmt={fmt} actionId={actionId} onOpen={handleOpen} onClose={handleClose} onDelete={handleDelete} onRefresh={fetchWindows} />)}</div>
            </div>
          )}
          {closedWins.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Closed ({closedWins.length})</p>
              <div className="space-y-2">{closedWins.map((w) => <WindowCard key={w._id} w={w} fmt={fmt} actionId={actionId} onOpen={handleOpen} onClose={handleClose} onDelete={handleDelete} onRefresh={fetchWindows} />)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: REGISTRATIONS (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────
function RegistrationsTab() {
  const [regs, setRegs]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError]         = useState("");
  const [expanded, setExpanded]   = useState(null);
  const [view, setView]           = useState("table");
  const [department, setDepartment] = useState("");
  const [year, setYear]             = useState("");
  const [semester, setSemester]     = useState("");
  const [regulation, setRegulation] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  const fetchRegs = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const params = new URLSearchParams();
      if (department)   params.append("department", department);
      if (year)         params.append("year", year);
      if (semester)     params.append("semester", semester);
      if (regulation)   params.append("regulation", regulation);
      if (academicYear) params.append("academicYear", academicYear);
      const res = await API.get(`/superadmin/registrations?${params}`);
      setRegs(res.data.registrations || []);
    } catch (e) { setError(e.response?.data?.message || "Failed to load registrations"); }
    finally { setLoading(false); }
  }, [department, year, semester, regulation, academicYear]);

  useEffect(() => { fetchRegs(); }, [fetchRegs]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (department)   params.append("department", department);
      if (year)         params.append("year", year);
      if (semester)     params.append("semester", semester);
      if (regulation)   params.append("regulation", regulation);
      if (academicYear) params.append("academicYear", academicYear);
      const res = await API.get(`/superadmin/registrations/export?${params}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a"); link.href = url;
      link.setAttribute("download", `AllRegistrations_${department || "AllDepts"}_${academicYear || "all"}_Sem${semester || "all"}.xlsx`);
      document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
    } catch (e) { alert(e.response?.data?.message || "Export failed"); }
    finally { setExporting(false); }
  };

  const byDept = DEPARTMENTS.reduce((acc, d) => { acc[d] = regs.filter((r) => r.department === d); return acc; }, {});

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Department</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="input-field w-36">
              <option value="">All Depts</option>{DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select></div>
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="input-field w-28">
              <option value="">All Years</option>{YEARS.map((y) => <option key={y} value={y}>E{y}</option>)}
            </select></div>
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Semester</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="input-field w-36">
              <option value="">All Semesters</option>{SEMESTERS.map((s) => <option key={s} value={s}>Sem {s}</option>)}
            </select></div>
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Regulation</label>
            <input value={regulation} onChange={(e) => setRegulation(e.target.value.toUpperCase())} placeholder="e.g. R23" maxLength={4} className="input-field w-24 uppercase font-mono" /></div>
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Academic Year</label>
            <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2025-26" className="input-field w-28" /></div>
          <button onClick={fetchRegs} className="btn-outline text-sm h-[42px]">🔍 Filter</button>
          <div className="ml-auto flex gap-2">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[["table","🗂 Table"], ["dept","🏛 Dept View"]].map(([v, label]) => (
                <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${view === v ? "bg-white text-brick-600 shadow-sm" : "text-gray-500"}`}>{label}</button>
              ))}
            </div>
            <button onClick={handleExport} disabled={exporting || regs.length === 0}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition disabled:opacity-40">
              {exporting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Exporting...</> : <><span>📥</span> Download Excel</>}
            </button>
          </div>
        </div>
      </div>
      {!loading && !error && regs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {DEPARTMENTS.map((d) => (
            <div key={d} onClick={() => setDepartment(d)} className={`card p-3 text-center cursor-pointer hover:shadow-md transition border-2 ${department === d ? "border-brick-400 bg-brick-50" : "border-transparent"}`}>
              <p className="text-xl font-black text-brick-600">{byDept[d].length}</p>
              <p className="text-xs font-semibold text-gray-600 mt-0.5">{d}</p>
            </div>
          ))}
        </div>
      )}
      {!loading && !error && <p className="text-sm text-gray-500"><strong className="text-gray-800">{regs.length}</strong> registrations found{department && <> in <strong>{department}</strong></>}</p>}
      {loading && <Spinner />}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>}
      {!loading && !error && regs.length === 0 && <div className="card p-10 text-center"><p className="text-4xl mb-3">📋</p><p className="font-semibold text-gray-700">No registrations found</p></div>}
      {!loading && !error && regs.length > 0 && view === "table" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brick-500 text-white text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Dept</th>
                  <th className="px-4 py-3 text-left">Roll No.</th>
                  <th className="px-4 py-3 text-left">Student Name</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">Year · Sem</th>
                  <th className="px-4 py-3 text-center hidden md:table-cell">Regulation</th>
                  <th className="px-4 py-3 text-center hidden lg:table-cell">Acad. Year</th>
                  <th className="px-4 py-3 text-center">Credits</th>
                  <th className="px-4 py-3 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {regs.map((reg, i) => (
                  <React.Fragment key={reg._id}>
                    <tr className="hover:bg-gray-50 transition cursor-pointer" onClick={() => setExpanded(expanded === reg._id ? null : reg._id)}>
                      <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 hidden md:table-cell"><span className="bg-brick-100 text-brick-700 text-xs font-bold px-2 py-0.5 rounded">{reg.department}</span></td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{reg.rollNumber || "—"}</td>
                      <td className="px-4 py-3"><p className="font-medium text-gray-800">{reg.studentName || "—"}</p><p className="text-xs text-gray-400">{reg.email}</p></td>
                      <td className="px-4 py-3 text-center text-xs text-gray-600 hidden sm:table-cell">E{reg.year} · S{reg.semester}</td>
                      <td className="px-4 py-3 text-center hidden md:table-cell"><span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded font-mono">{reg.regulation}</span></td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500 hidden lg:table-cell">{reg.academicYear}</td>
                      <td className="px-4 py-3 text-center"><span className="bg-brick-100 text-brick-700 text-sm font-bold px-2 py-0.5 rounded">{reg.totalCredits}</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-xs text-brick-500 font-semibold">{expanded === reg._id ? "▲" : "▼"}</span></td>
                    </tr>
                    {expanded === reg._id && (
                      <tr className="bg-gray-50">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {(reg.subjects || []).map((s, si) => (
                              <div key={si} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${s.type === "elective" ? "bg-purple-50 border border-purple-100" : "bg-white border border-gray-200"}`}>
                                <div><span className="font-mono text-gray-500 mr-2">{s.code}</span><span className="font-medium text-gray-800">{s.name}</span></div>
                                <span className="bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded ml-2 shrink-0">{s.credits} cr</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW TAB: ATTENDANCE UPLOADS
// SuperAdmin views all HOD-uploaded attendance records
// ─────────────────────────────────────────────────────────────────────────────
function AttendanceTab() {
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [filterDept, setFilterDept] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSem, setFilterSem]   = useState("");
  const [filterAY, setFilterAY]     = useState("");
  const [filterSec, setFilterSec]   = useState("");
  const [expanded, setExpanded]     = useState(null);
  const [togglingId, setTogglingId] = useState(null); // rollNumber being toggled
  const [toggleMsg, setToggleMsg]   = useState({ text: "", type: "" });

  // We also need the student user list to know current academicStatus by rollNumber
  // We fetch it lazily when a section is expanded
  const [studentStatusMap, setStudentStatusMap] = useState({}); // rollNumber → { _id, academicStatus }

  const flash = (text, type = "success") => { setToggleMsg({ text, type }); setTimeout(() => setToggleMsg({ text: "", type: "" }), 5000); };

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDept) params.append("department", filterDept);
      if (filterYear) params.append("year", filterYear);
      if (filterSem)  params.append("semester", filterSem);
      if (filterAY)   params.append("academicYear", filterAY);
      if (filterSec)  params.append("section", filterSec);
      const r = await API.get(`/superadmin/attendance?${params}`);
      setRecords(r.data.records || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterDept, filterYear, filterSem, filterAY, filterSec]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // When a section is expanded, fetch student statuses for that dept+year+sem
  const fetchStudentStatuses = useCallback(async (department, year, semester) => {
    try {
      const params = new URLSearchParams();
      params.append("role", "student");
      params.append("department", department);
      params.append("year", year);
      params.append("semester", semester);
      const r = await API.get(`/superadmin/users?${params}`);
      const map = {};
      (r.data.users || []).forEach((u) => {
        if (u.rollNumber) map[u.rollNumber] = { _id: u._id, academicStatus: u.academicStatus };
      });
      setStudentStatusMap((prev) => ({ ...prev, ...map }));
    } catch (e) { console.error(e); }
  }, []);

  const handleToggleStatus = async (rollNumber, currentStatus, name) => {
    const info = studentStatusMap[rollNumber];
    if (!info) { flash("Student not found in system — roll number may not match", "error"); return; }
    const newStatus = currentStatus === "detained" ? "active" : "detained";
    const action    = newStatus === "detained" ? "Detain" : "Reinstate";
    if (!window.confirm(`${action} ${name || rollNumber}?`)) return;
    try {
      setTogglingId(rollNumber);
      await API.patch(`/superadmin/users/${info._id}/status`, { academicStatus: newStatus });
      setStudentStatusMap((prev) => ({
        ...prev,
        [rollNumber]: { ...prev[rollNumber], academicStatus: newStatus },
      }));
      flash(`${name || rollNumber} ${newStatus === "detained" ? "detained" : "reinstated"} successfully.`);
    } catch (e) { flash(e.response?.data?.message || "Failed to update status", "error"); }
    finally { setTogglingId(null); }
  };

  const pctColor = (pct) => {
    if (pct >= 75) return "text-green-700 font-semibold";
    if (pct >= 60) return "text-amber-600 font-semibold";
    return "text-red-600 font-bold";
  };

  const totalBelow75 = records.reduce((acc, r) => acc + r.students.filter((s) => s.attendancePercentage < 75).length, 0);
  const totalStudents = records.reduce((acc, r) => acc + r.students.length, 0);

  return (
    <div className="space-y-5">
      <Alert msg={toggleMsg} />
      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Department</label>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="input-field w-36">
            <option value="">All Depts</option>{DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select></div>
        <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Year</label>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="input-field w-28">
            <option value="">All Years</option>{YEARS.map((y) => <option key={y} value={y}>E{y}</option>)}
          </select></div>
        <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Semester</label>
          <select value={filterSem} onChange={(e) => setFilterSem(e.target.value)} className="input-field w-36">
            <option value="">All Sems</option>{SEMESTERS.map((s) => <option key={s} value={s}>Sem {s}</option>)}
          </select></div>
        <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Academic Year</label>
          <select value={filterAY} onChange={(e) => setFilterAY(e.target.value)} className="input-field w-36">
            <option value="">All Acad Years</option>{ACADEMIC_YEARS.map((y) => <option key={y}>{y}</option>)}
          </select></div>
        <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Section</label>
          <input value={filterSec} onChange={(e) => setFilterSec(e.target.value.toUpperCase())} placeholder="A / B / C" maxLength={2} className="input-field w-24 uppercase font-mono" /></div>
      </div>

      {/* Summary bar */}
      {!loading && records.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 text-center"><p className="text-2xl font-black text-brick-500">{records.length}</p><p className="text-xs text-gray-500 mt-1">Upload Records</p></div>
          <div className="card p-4 text-center"><p className="text-2xl font-black text-blue-500">{totalStudents}</p><p className="text-xs text-gray-500 mt-1">Total Students</p></div>
          <div className="card p-4 text-center"><p className="text-2xl font-black text-red-500">{totalBelow75}</p><p className="text-xs text-gray-500 mt-1">Below 75%</p></div>
        </div>
      )}

      {loading && <Spinner />}

      {!loading && records.length === 0 && (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-medium text-gray-600">No attendance uploads yet</p>
          <p className="text-sm mt-1">HODs upload attendance from their dashboard → Upload Attendance tab.</p>
        </div>
      )}

      {!loading && records.length > 0 && (
        <div className="space-y-4">
          {records.map((rec) => {
            const below75 = rec.students.filter((s) => s.attendancePercentage < 75).length;
            const isExpanded = expanded === rec._id;
            return (
              <div key={rec._id} className="card overflow-hidden">
                <div
                  className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center gap-3 justify-between cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => {
                    if (!isExpanded) fetchStudentStatuses(rec.department, rec.year, rec.semester);
                    setExpanded(isExpanded ? null : rec._id);
                  }}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-brick-100 text-brick-700 badge font-bold">{rec.department}</span>
                    <span className="font-semibold text-gray-800">E{rec.year} · Sem {rec.semester} · {rec.academicYear}</span>
                    <span className="bg-blue-100 text-blue-700 badge">Section {rec.section}</span>
                    <span className="text-sm text-gray-500">{rec.students.length} students</span>
                    {below75 > 0 && <span className="bg-red-100 text-red-600 badge text-xs font-semibold">⚠ {below75} below 75%</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-400">Uploaded by: {rec.uploadedBy?.email || "—"} · {new Date(rec.updatedAt).toLocaleDateString("en-IN")}</p>
                    <span className="text-xs text-gray-500 font-semibold">{isExpanded ? "▲ Hide" : "▼ Show students"}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="bg-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                          <th className="px-4 py-2.5 text-left">#</th>
                          <th className="px-4 py-2.5 text-left">Roll No.</th>
                          <th className="px-4 py-2.5 text-left">Name</th>
                          <th className="px-4 py-2.5 text-center">Attendance %</th>
                          <th className="px-4 py-2.5 text-center">Action</th>
                          <th className="px-4 py-2.5 text-center">Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rec.students.map((s, i) => {
                            const info       = studentStatusMap[s.rollNumber];
                            const status     = info?.academicStatus || "active";
                            const isDetained = status === "detained";
                            return (
                              <tr key={i} className={`transition ${s.attendancePercentage < 75 ? "bg-red-50" : "hover:bg-gray-50"}`}>
                                <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                                <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{s.rollNumber}</td>
                                <td className="px-4 py-2.5 font-medium text-gray-800">{s.name}</td>
                                <td className={`px-4 py-2.5 text-center ${pctColor(s.attendancePercentage)}`}>
                                  {s.attendancePercentage.toFixed(2)}%
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  {info ? (
                                    <button
                                      onClick={() => handleToggleStatus(s.rollNumber, status, s.name)}
                                      disabled={togglingId === s.rollNumber || s.attendancePercentage >= 75}
                                      title={s.attendancePercentage >= 75 ? "Attendance is OK — no action needed" : ""}
                                      className={`text-xs font-semibold px-3 py-1 rounded-lg border transition whitespace-nowrap ${
                                        s.attendancePercentage >= 75
                                          ? "opacity-30 cursor-not-allowed text-gray-400 border-gray-200 bg-gray-50"
                                          : isDetained
                                            ? "text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                                            : "text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                                      }`}
                                    >
                                      {togglingId === s.rollNumber ? "..." : isDetained ? "✓ Reinstate" : "🚫 Detain"}
                                    </button>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">Not in system</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  {s.attendancePercentage < 75
                                    ? <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">Below 75%</span>
                                    : <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">OK</span>}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW TAB: DETAINED STUDENTS
// SuperAdmin sees all detained students across all departments
// ─────────────────────────────────────────────────────────────────────────────
function DetainedTab() {
  const [students, setStudents]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [msg, setMsg]               = useState({ text: "", type: "" });
  const [filterDept, setFilterDept] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSem, setFilterSem]   = useState("");

  const flash = (text, type = "success") => { setMsg({ text, type }); setTimeout(() => setMsg({ text: "", type: "" }), 5000); };

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDept) params.append("department", filterDept);
      if (filterYear) params.append("year", filterYear);
      if (filterSem)  params.append("semester", filterSem);
      const r = await API.get(`/superadmin/detained?${params}`);
      setStudents(r.data.students || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterDept, filterYear, filterSem]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleReinstate = async (id, name) => {
    if (!window.confirm(`Reinstate ${name || "this student"}? Their status will change to Active.`)) return;
    try {
      setTogglingId(id);
      await API.patch(`/superadmin/users/${id}/status`, { academicStatus: "active" });
      setStudents((p) => p.filter((s) => s._id !== id));
      flash(`Student reinstated successfully.`);
    } catch (e) { flash(e.response?.data?.message || "Failed to update status", "error"); }
    finally { setTogglingId(null); }
  };

  // Group by department for summary
  const byDept = DEPARTMENTS.reduce((acc, d) => {
    acc[d] = students.filter((s) => s.department === d).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <Alert msg={msg} />

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <span className="text-amber-500 text-lg">⚠️</span>
        <div className="text-sm text-amber-700">
          These are <strong>all currently detained students</strong> across all departments.
          Use the <strong>Users</strong> tab to detain a student. Use the <strong>Reinstate</strong> button here to restore them to Active.
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Department</label>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="input-field w-36">
            <option value="">All Depts</option>{DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select></div>
        <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Year</label>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="input-field w-28">
            <option value="">All Years</option>{YEARS.map((y) => <option key={y} value={y}>E{y}</option>)}
          </select></div>
        <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Semester</label>
          <select value={filterSem} onChange={(e) => setFilterSem(e.target.value)} className="input-field w-36">
            <option value="">All Sems</option>{SEMESTERS.map((s) => <option key={s} value={s}>Sem {s}</option>)}
          </select></div>
        <p className="text-sm text-gray-500 self-end pb-1">Total detained: <strong className="text-red-600">{students.length}</strong></p>
      </div>

      {/* Dept summary chips */}
      {students.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.filter((d) => byDept[d] > 0).map((d) => (
            <button key={d} onClick={() => setFilterDept(filterDept === d ? "" : d)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition border ${filterDept === d ? "bg-red-500 text-white border-red-500" : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"}`}>
              {d} <span className="bg-white text-red-600 rounded-full px-1.5 font-bold">{byDept[d]}</span>
            </button>
          ))}
        </div>
      )}

      {loading && <Spinner />}

      {!loading && students.length === 0 && (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-medium text-gray-600">No detained students{filterDept ? ` in ${filterDept}` : ""}</p>
        </div>
      )}

      {!loading && students.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brick-500 text-white text-xs uppercase tracking-wide">
                  <th className="px-5 py-3.5 text-left">#</th>
                  <th className="px-5 py-3.5 text-left">Student</th>
                  <th className="px-5 py-3.5 text-left hidden sm:table-cell">Roll No</th>
                  <th className="px-5 py-3.5 text-left hidden md:table-cell">Dept</th>
                  <th className="px-5 py-3.5 text-left hidden lg:table-cell">Year · Sem</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s, i) => (
                  <tr key={s._id} className="hover:bg-red-50 transition">
                    <td className="px-5 py-3.5 text-gray-400">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{s.name || s.email}</p>
                      {s.name && <p className="text-xs text-gray-400">{s.email}</p>}
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{s.rollNumber || "—"}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="bg-gray-100 text-gray-700 badge">{s.department}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-sm hidden lg:table-cell">
                      {s.year ? `E${s.year} · S${s.semester}` : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="badge badge-detained">Detained</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleReinstate(s._id, s.name || s.email)}
                        disabled={togglingId === s._id}
                        className="text-xs font-semibold text-green-600 hover:text-green-800 disabled:opacity-50 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg transition"
                      >
                        {togglingId === s._id ? "..." : "✓ Reinstate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// TAB: ADD REGULATION (SuperAdmin — selects branch, uploads for any department)
// SuperAdmin uploads regulation subjects for any of the 7 branches.
// The subjectController's addRegulationForBranch accepts { department, regulation, subjects }.
// Uses upsert — safe to re-run; existing subjects are not duplicated.
// ─────────────────────────────────────────────────────────────────────────────
const VALID_COURSE_TYPES = ["BSC","ESC","PCC","PEC","OEC","HSMC","PR","MC","EAC"];

const EMPTY_SUBJECT = {
  code: "", name: "", credits: "3", courseType: "PCC",
  year: "1", semester: "1", type: "core",
  electiveSlot: "", isLab: false,
  hours: { L: "3", T: "0", P: "0" },
};

function AddRegulationTab() {
  // Branch + regulation
  const [department,  setDepartment]  = useState("CSE");
  const [regulation,  setRegulation]  = useState("");
  const [msg,         setMsg]         = useState({ text: "", type: "" });
  const [loading,     setLoading]     = useState(false);

  // Existing regulations for selected branch
  const [existingRegs, setExistingRegs] = useState([]);
  const [loadingRegs,  setLoadingRegs]  = useState(false);

  // Mode: "json" | "manual"
  const [mode, setMode] = useState("json");

  // JSON mode
  const [jsonText,    setJsonText]    = useState("");
  const [jsonPreview, setJsonPreview] = useState(null);
  const [jsonError,   setJsonError]   = useState("");

  // Manual mode
  const [manualSubjects,  setManualSubjects]  = useState([]);
  const [currentSubject,  setCurrentSubject]  = useState(EMPTY_SUBJECT);
  const [subjectMsg,      setSubjectMsg]      = useState({ text: "", type: "" });

  // Delete regulation
  const [delReg,     setDelReg]     = useState("");
  const [delLoading, setDelLoading] = useState(false);
  const [delMsg,     setDelMsg]     = useState({ text: "", type: "" });

  const flash = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 6000);
  };

  // Fetch existing regulations when branch changes
  useEffect(() => {
    setLoadingRegs(true);
    API.get(`/superadmin/regulations/branch?department=${department}`)
      .then((r) => setExistingRegs(r.data.regulations || []))
      .catch(() => setExistingRegs([]))
      .finally(() => setLoadingRegs(false));
  }, [department]);

  // ── JSON ──────────────────────────────────────────────────────────────────
  const handleParseJson = () => {
    setJsonError(""); setJsonPreview(null);
    try {
      const parsed = JSON.parse(jsonText.trim());
      const subjects = Array.isArray(parsed) ? parsed : parsed.subjects;
      if (!Array.isArray(subjects)) throw new Error("Expected an array of subjects");
      if (subjects.length === 0)    throw new Error("Array is empty");
      setJsonPreview(subjects);
    } catch (e) { setJsonError("Invalid JSON: " + e.message); }
  };

  const handleSubmitJson = async () => {
    if (!regulation.trim()) { flash("Enter a regulation name (e.g. R26)", "error"); return; }
    if (!jsonPreview)        { flash("Parse your JSON first", "error"); return; }
    try {
      setLoading(true);
      const r = await API.post("/superadmin/regulations", {
        department, regulation: regulation.trim().toUpperCase(), subjects: jsonPreview,
      });
      flash(`${r.data.message}${r.data.errors?.length ? " — errors: " + r.data.errors.join(", ") : ""}`);
      setJsonText(""); setJsonPreview(null); setRegulation("");
      // Refresh existing regs
      const rr = await API.get(`/superadmin/regulations/branch?department=${department}`);
      setExistingRegs(rr.data.regulations || []);
    } catch (e) { flash(e.response?.data?.message || "Upload failed", "error"); }
    finally { setLoading(false); }
  };

  // ── Manual ────────────────────────────────────────────────────────────────
  const handleAddSubject = () => {
    setSubjectMsg({ text: "", type: "" });
    const { code, name, credits, courseType, year, semester } = currentSubject;
    if (!code || !name || !credits || !courseType || !year || !semester) {
      setSubjectMsg({ text: "Code, name, credits, courseType, year and semester are required", type: "error" }); return;
    }
    if (manualSubjects.find((s) => s.code.toUpperCase() === code.toUpperCase())) {
      setSubjectMsg({ text: `Code "${code}" already in list`, type: "error" }); return;
    }
    setManualSubjects((p) => [...p, {
      ...currentSubject,
      code:     code.toUpperCase(),
      credits:  Number(credits),
      year:     Number(year),
      semester: Number(semester),
      hours:    { L: Number(currentSubject.hours.L), T: Number(currentSubject.hours.T), P: Number(currentSubject.hours.P) },
    }]);
    setCurrentSubject(EMPTY_SUBJECT);
    setSubjectMsg({ text: `Added "${name}"`, type: "success" });
  };

  const handleSubmitManual = async () => {
    if (!regulation.trim())         { flash("Enter a regulation name", "error"); return; }
    if (manualSubjects.length === 0) { flash("Add at least one subject", "error"); return; }
    try {
      setLoading(true);
      const r = await API.post("/superadmin/regulations", {
        department, regulation: regulation.trim().toUpperCase(), subjects: manualSubjects,
      });
      flash(r.data.message);
      setManualSubjects([]); setRegulation("");
      const rr = await API.get(`/superadmin/regulations/branch?department=${department}`);
      setExistingRegs(rr.data.regulations || []);
    } catch (e) { flash(e.response?.data?.message || "Upload failed", "error"); }
    finally { setLoading(false); }
  };

  // ── Delete regulation ──────────────────────────────────────────────────────
  const handleDeleteReg = async () => {
    if (!delReg) { setDelMsg({ text: "Select a regulation to delete", type: "error" }); return; }
    if (!window.confirm(`Delete ALL subjects for ${department} ${delReg}? This cannot be undone.`)) return;
    try {
      setDelLoading(true);
      const r = await API.delete(`/superadmin/regulations/${delReg}?department=${department}`);
      setDelMsg({ text: r.data.message, type: "success" });
      setDelReg("");
      const rr = await API.get(`/superadmin/regulations/branch?department=${department}`);
      setExistingRegs(rr.data.regulations || []);
    } catch (e) { setDelMsg({ text: e.response?.data?.message || "Delete failed", type: "error" }); }
    finally { setDelLoading(false); }
  };

  const semSummary = manualSubjects.reduce((acc, s) => {
    const k = `E${s.year} Sem${s.semester}`;
    acc[k] = (acc[k] || 0) + Number(s.credits);
    return acc;
  }, {});

  return (
    <div className="space-y-6">

      {/* Branch + existing regs overview */}
      <div className="card p-5">
        <div className="flex flex-wrap gap-4 items-start">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Select Branch *
            </label>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map((d) => (
                <button key={d} onClick={() => setDepartment(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                    department === d
                      ? "bg-brick-500 text-white border-brick-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-brick-300"
                  }`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Regulations in DB — {department}
          </p>
          {loadingRegs ? (
            <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
          ) : existingRegs.length === 0 ? (
            <p className="text-sm text-amber-600">
              No regulation data yet for {department}. Upload one using the form below.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {existingRegs.map((r) => (
                <span key={r} className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-sm font-bold px-3 py-1.5 rounded-lg">
                  ✓ {r}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add new regulation */}
      <div className="card p-6 space-y-5">
        <div>
          <h3 className="font-semibold text-gray-800 text-base">
            Add Regulation for <span className="text-brick-600">{department}</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Upload subjects for a new regulation for the selected branch.
            Safe to re-run — existing subjects are not duplicated (upsert).
          </p>
        </div>

        {/* Regulation name input */}
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Regulation Name *
            </label>
            <input type="text" placeholder="e.g. R26" value={regulation}
              onChange={(e) => setRegulation(e.target.value.toUpperCase())}
              className="input-field w-28 uppercase font-mono" maxLength={4} />
          </div>
          <p className="text-xs text-gray-400 pb-2">Format: R23, R26, R20 …</p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {[["json","📄 Paste JSON"], ["manual","✏️ Manual Entry"]].map(([id, label]) => (
            <button key={id} onClick={() => setMode(id)}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                mode === id ? "bg-white text-brick-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* JSON MODE */}
        {mode === "json" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
              <p className="font-semibold mb-1">📋 How to use JSON mode:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Paste either a full subjects array or the full regulation JSON file contents.</li>
                <li>Click <strong>Parse & Preview</strong> to validate.</li>
                <li>Confirm the subject count, then click <strong>Upload to DB</strong>.</li>
              </ol>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Paste JSON</label>
              <textarea value={jsonText}
                onChange={(e) => { setJsonText(e.target.value); setJsonPreview(null); setJsonError(""); }}
                placeholder={`[
  {
    "code": "26CS1101",
    "name": "Subject Name",
    "credits": 4,
    "courseType": "PCC",
    "year": 1,
    "semester": 1,
    "type": "core",
    "hours": { "L": 3, "T": 1, "P": 0 }
  }
]`}
                className="w-full h-48 p-3 font-mono text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brick-400 resize-y"
              />
            </div>
            {jsonError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 flex items-start gap-2">
                <span>✗</span><pre className="whitespace-pre-wrap text-xs">{jsonError}</pre>
              </div>
            )}
            {jsonPreview && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                <p className="text-green-700 font-semibold text-sm">✓ Parsed — {jsonPreview.length} subjects</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(
                    jsonPreview.reduce((acc, s) => { const k = `E${s.year} Sem${s.semester}`; acc[k] = (acc[k]||0)+1; return acc; }, {})
                  ).sort().map(([k, n]) => (
                    <span key={k} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">{k}: {n} subjects</span>
                  ))}
                </div>
                <p className="text-xs text-gray-500">First few: {jsonPreview.slice(0,3).map((s) => s.name).join(", ")}{jsonPreview.length > 3 ? ` +${jsonPreview.length-3} more` : ""}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleParseJson} disabled={!jsonText.trim()} className="btn-outline disabled:opacity-40">Parse & Preview</button>
              <button onClick={handleSubmitJson} disabled={loading || !jsonPreview || !regulation.trim()} className="btn-primary disabled:opacity-40">
                {loading ? "Uploading..." : `Upload to DB (${jsonPreview?.length ?? 0} subjects)`}
              </button>
            </div>
          </div>
        )}

        {/* MANUAL MODE */}
        {mode === "manual" && (
          <div className="space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
              Add subjects one by one. For a full regulation (many subjects), JSON mode is faster.
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Add Subject</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Code *</label>
                  <input type="text" placeholder="e.g. 26CS1101" value={currentSubject.code}
                    onChange={(e) => setCurrentSubject({ ...currentSubject, code: e.target.value.toUpperCase() })}
                    className="input-field uppercase font-mono text-sm" /></div>
                <div className="sm:col-span-2"><label className="block text-xs text-gray-500 mb-1">Subject Name *</label>
                  <input type="text" placeholder="e.g. Advanced Algorithms" value={currentSubject.name}
                    onChange={(e) => setCurrentSubject({ ...currentSubject, name: e.target.value })}
                    className="input-field text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Course Type *</label>
                  <select value={currentSubject.courseType} onChange={(e) => setCurrentSubject({ ...currentSubject, courseType: e.target.value })} className="input-field text-sm">
                    {VALID_COURSE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Credits *</label>
                  <select value={currentSubject.credits} onChange={(e) => setCurrentSubject({ ...currentSubject, credits: e.target.value })} className="input-field text-sm">
                    {[0,1,1.5,2,2.5,3,4,5,6,10].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Type *</label>
                  <select value={currentSubject.type} onChange={(e) => setCurrentSubject({ ...currentSubject, type: e.target.value, electiveSlot: "" })} className="input-field text-sm">
                    <option value="core">Core</option><option value="elective">Elective</option>
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Year *</label>
                  <select value={currentSubject.year} onChange={(e) => setCurrentSubject({ ...currentSubject, year: e.target.value })} className="input-field text-sm">
                    {YEARS.map((y) => <option key={y} value={y}>E{y}</option>)}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Semester *</label>
                  <select value={currentSubject.semester} onChange={(e) => setCurrentSubject({ ...currentSubject, semester: e.target.value })} className="input-field text-sm">
                    <option value="1">Sem 1</option><option value="2">Sem 2</option>
                  </select></div>
                <div className="flex gap-2">
                  {["L","T","P"].map((h) => (
                    <div key={h} className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">{h}</label>
                      <input type="number" min="0" max="12" value={currentSubject.hours[h]}
                        onChange={(e) => setCurrentSubject({ ...currentSubject, hours: { ...currentSubject.hours, [h]: e.target.value } })}
                        className="input-field text-sm text-center" />
                    </div>
                  ))}
                </div>
                {currentSubject.type === "elective" && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Elective Slot (e.g. Elective-I)</label>
                    <input type="text" placeholder="Elective-I" value={currentSubject.electiveSlot}
                      onChange={(e) => setCurrentSubject({ ...currentSubject, electiveSlot: e.target.value })}
                      className="input-field text-sm" />
                  </div>
                )}
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="isLab" checked={currentSubject.isLab}
                    onChange={(e) => setCurrentSubject({ ...currentSubject, isLab: e.target.checked })}
                    className="w-4 h-4 accent-brick-500" />
                  <label htmlFor="isLab" className="text-xs text-gray-600">Lab subject</label>
                </div>
              </div>
              {subjectMsg.text && (
                <div className={`rounded-lg px-3 py-2 text-xs flex items-center gap-2 ${subjectMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                  {subjectMsg.type === "success" ? "✓" : "⚠"} {subjectMsg.text}
                </div>
              )}
              <button onClick={handleAddSubject} className="btn-outline text-sm">+ Add to List</button>
            </div>

            {manualSubjects.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Subjects to upload ({manualSubjects.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(semSummary).sort().map(([k, cr]) => (
                      <span key={k} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded">{k}: {cr} cr</span>
                    ))}
                  </div>
                </div>
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-gray-100 text-gray-600 uppercase tracking-wide">
                        <th className="px-3 py-2 text-left">Code</th><th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-center">Yr</th><th className="px-3 py-2 text-center">Sem</th>
                        <th className="px-3 py-2 text-center">Cr</th><th className="px-3 py-2 text-center">Type</th>
                        <th className="px-3 py-2 text-center"></th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {manualSubjects.map((s) => (
                          <tr key={s.code} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-mono text-gray-700">{s.code}</td>
                            <td className="px-3 py-2 text-gray-800">{s.name}</td>
                            <td className="px-3 py-2 text-center text-gray-500">E{s.year}</td>
                            <td className="px-3 py-2 text-center text-gray-500">S{s.semester}</td>
                            <td className="px-3 py-2 text-center"><span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{s.credits}</span></td>
                            <td className="px-3 py-2 text-center"><span className={`px-1.5 py-0.5 rounded ${s.type === "core" ? "bg-brick-100 text-brick-700" : "bg-purple-100 text-purple-700"}`}>{s.type}</span></td>
                            <td className="px-3 py-2 text-center"><button onClick={() => setManualSubjects((p) => p.filter((x) => x.code !== s.code))} className="text-red-400 hover:text-red-600">✕</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <button onClick={handleSubmitManual} disabled={loading || !regulation.trim()} className="btn-primary disabled:opacity-40">
                  {loading ? "Uploading..." : `Save ${manualSubjects.length} subjects for ${department} ${regulation || "??"}`}
                </button>
              </div>
            )}
          </div>
        )}

        <Alert msg={msg} />
      </div>

      {/* Delete regulation */}
      {existingRegs.length > 0 && (
        <div className="card p-5 border border-red-100">
          <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2"><span>⚠️</span> Delete Regulation Data</h3>
          <p className="text-xs text-gray-500 mb-4">
            Permanently removes all subjects for a regulation from <strong>{department}</strong>.
            Only allowed if no students are assigned to that regulation.
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Select Regulation</label>
              <select value={delReg} onChange={(e) => setDelReg(e.target.value)} className="input-field w-32">
                <option value="">Choose...</option>
                {existingRegs.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <button onClick={handleDeleteReg} disabled={delLoading || !delReg}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-40">
              {delLoading ? "Deleting..." : "Delete All Subjects"}
            </button>
          </div>
          {delMsg.text && (
            <div className={`mt-3 rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${delMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
              {delMsg.type === "success" ? "✓" : "⚠"} {delMsg.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SUPERADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function SuperAdminDashboard() {
  const [stats,      setStats]      = useState(null);
  const [hods,       setHods]       = useState([]);
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState("overview");

  // Users tab filters — default to students only
  const [filterDept, setFilterDept] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSem,  setFilterSem]  = useState("");
  const [search,     setSearch]     = useState("");

  // Status toggle state
  const [togglingId, setTogglingId] = useState(null);
  const [toggleMsg,  setToggleMsg]  = useState({ text: "", type: "" });

  const [hodForm,    setHodForm]    = useState({ email: "", password: "", department: "" });
  const [hodMsg,     setHodMsg]     = useState({ text: "", type: "" });
  const [hodLoading, setHodLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { fetchInit(); }, []);
  // Users tab always loads students only
  useEffect(() => { if (activeTab === "users") fetchUsers(); }, [activeTab, filterDept, filterYear, filterSem]);

  const fetchInit = async () => {
    try {
      setLoading(true);
      const [sr, hr] = await Promise.all([API.get("/superadmin/stats"), API.get("/superadmin/hods")]);
      setStats(sr.data); setHods(hr.data.hods);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Always fetch students only (role=student hardcoded)
  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      params.append("role", "student"); // Only students in this tab
      if (filterDept) params.append("department", filterDept);
      if (filterYear) params.append("year", filterYear);
      if (filterSem)  params.append("semester", filterSem);
      const r = await API.get(`/superadmin/users?${params}`);
      setUsers(r.data.users);
    } catch (e) { console.error(e); }
  };

  const flashToggle = (text, type = "success") => { setToggleMsg({ text, type }); setTimeout(() => setToggleMsg({ text: "", type: "" }), 5000); };

  // Toggle between Active ↔ Detained
  const handleToggleStatus = async (id, currentStatus, name) => {
    const newStatus = currentStatus === "detained" ? "active" : "detained";
    const action    = newStatus === "detained" ? "detain" : "reinstate";
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${name || "this student"}?`)) return;
    try {
      setTogglingId(id);
      await API.patch(`/superadmin/users/${id}/status`, { academicStatus: newStatus });
      setUsers((p) => p.map((u) => u._id === id ? { ...u, academicStatus: newStatus } : u));
      // Refresh stats
      const sr = await API.get("/superadmin/stats"); setStats(sr.data);
      flashToggle(`Student ${newStatus === "detained" ? "detained" : "reinstated"} successfully.`);
    } catch (e) { flashToggle(e.response?.data?.message || "Failed to update status", "error"); }
    finally { setTogglingId(null); }
  };

  const handleCreateHOD = async () => {
    setHodMsg({ text: "", type: "" });
    if (!hodForm.email || !hodForm.password || !hodForm.department) { setHodMsg({ text: "All fields are required", type: "error" }); return; }
    try {
      setHodLoading(true);
      await API.post("/superadmin/create-hod", hodForm);
      setHodMsg({ text: `HOD for ${hodForm.department} created`, type: "success" });
      setHodForm({ email: "", password: "", department: "" });
      const r = await API.get("/superadmin/hods"); setHods(r.data.hods);
    } catch (e) { setHodMsg({ text: e.response?.data?.message || "Failed", type: "error" }); }
    finally { setHodLoading(false); }
  };

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Delete user: ${email}?`)) return;
    try {
      setDeletingId(id);
      await API.delete(`/superadmin/users/${id}`);
      setUsers((p) => p.filter((u) => u._id !== id));
      setHods((p) => p.filter((u) => u._id !== id));
      const sr = await API.get("/superadmin/stats"); setStats(sr.data);
    } catch (e) { alert(e.response?.data?.message || "Delete failed"); }
    finally { setDeletingId(null); }
  };

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.rollNumber || "").toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: "overview",       label: "Overview" },
    { id: "windows",        label: "🗓️ Registration Windows" },
    { id: "departments",    label: "Departments" },
    { id: "hods",           label: "HODs" },
    { id: "users",          label: "👥 Students" },
    { id: "attendance",     label: "📊 Attendance" },
    { id: "detained",       label: "🚫 Detained" },
    { id: "registrations",  label: "📋 Registrations" },
    { id: "add regulation", label: "📚 Add Regulation" },
    { id: "create hod",     label: "Create HOD" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Super Admin Panel" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Academic Administration</h2>
          <p className="text-gray-500 text-sm mt-1">Full system control — RGUKT RK Valley</p>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-6">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`tab-btn ${activeTab === t.id ? "tab-active" : "tab-inactive"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading && ["overview", "departments"].includes(activeTab) ? <Spinner /> : (
          <>
            {/* OVERVIEW */}
            {activeTab === "overview" && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon="🎓" label="Total Students"  value={stats.totalStudents}    color="red"   />
                  <StatCard icon="👨‍🏫" label="HOD Accounts"   value={stats.totalHODs}        color="blue"  />
                  <StatCard icon="✅" label="Active Students" value={stats.activeStudents}   color="green" />
                  <StatCard icon="🚫" label="Detained"        value={stats.detainedStudents} color="amber" />
                </div>
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-700 mb-4">Department Overview</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {(stats.deptBreakdown || []).map((d) => (
                      <div key={d.department} className="bg-brick-50 border border-brick-100 rounded-xl p-3 text-center">
                        <p className="text-xl font-black text-brick-600">{d.count}</p>
                        <p className="text-xs font-semibold text-gray-600 mt-0.5">{d.department}</p>
                        {d.detained > 0 && <p className="text-xs text-red-500">{d.detained} detained</p>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-700 mb-3">Quick Actions</h3>
                  <div className="flex gap-3 flex-wrap">
                    <button onClick={() => setActiveTab("windows")} className="btn-primary text-sm">🗓️ Manage Registration Windows</button>
                    <button onClick={() => setActiveTab("attendance")} className="btn-outline text-sm">📊 View Attendance Uploads</button>
                    <button onClick={() => setActiveTab("detained")} className="border border-red-300 text-red-600 hover:bg-red-50 font-medium px-5 py-2.5 rounded-lg transition text-sm">🚫 Detained Students</button>
                    <button onClick={() => setActiveTab("registrations")} className="btn-outline text-sm">📋 View All Registrations</button>
                    <button onClick={() => setActiveTab("add regulation")} className="btn-outline text-sm">📚 Add Regulation</button>
                    <button onClick={() => setActiveTab("create hod")} className="btn-outline text-sm">+ Create HOD Account</button>
                  </div>
                </div>
              </div>
            )}

            {/* WINDOWS */}
            {activeTab === "windows" && <WindowsTab />}

            {/* DEPARTMENTS */}
            {activeTab === "departments" && stats && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Department-wise Breakdown</h3>
                <div className="grid gap-4">
                  {(stats.deptBreakdown || []).map((d) => {
                    const pct       = stats.totalStudents > 0 ? Math.round((d.count / stats.totalStudents) * 100) : 0;
                    const activePct = d.count > 0 ? Math.round((d.active / d.count) * 100) : 0;
                    return (
                      <div key={d.department} className="card p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brick-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">{d.department.slice(0, 2)}</div>
                            <div><h4 className="font-semibold text-gray-800">{d.department}</h4><p className="text-xs text-gray-500">{d.count} students · {pct}% of total</p></div>
                          </div>
                          <div className="text-right"><p className="text-2xl font-black text-brick-500">{d.count}</p>{d.detained > 0 && <p className="text-xs text-red-500">{d.detained} detained</p>}</div>
                        </div>
                        <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-100">
                          <div className="bg-green-400 rounded-full" style={{ width: `${activePct}%` }} />
                          {d.detained > 0 && <div className="bg-red-400 rounded-full" style={{ width: `${d.count > 0 ? Math.round((d.detained/d.count)*100) : 0}%` }} />}
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full" />Active: {d.active}</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full" />Detained: {d.detained}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* HODs */}
            {activeTab === "hods" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-700">HOD Accounts ({hods.length})</h3>
                  <button onClick={() => setActiveTab("create hod")} className="btn-primary text-sm">+ Create HOD</button>
                </div>
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-brick-500 text-white text-xs uppercase tracking-wide">
                        <th className="px-5 py-3.5 text-left">#</th>
                        <th className="px-5 py-3.5 text-left">Email</th>
                        <th className="px-5 py-3.5 text-left">Department</th>
                        <th className="px-5 py-3.5 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {hods.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-10 text-gray-400">No HODs found</td></tr>
                      ) : hods.map((h, i) => (
                        <tr key={h._id} className="hover:bg-gray-50 transition">
                          <td className="px-5 py-3.5 text-gray-400">{i + 1}</td>
                          <td className="px-5 py-3.5 text-gray-800">{h.email}</td>
                          <td className="px-5 py-3.5"><span className="bg-brick-100 text-brick-700 badge">{h.department}</span></td>
                          <td className="px-5 py-3.5">
                            <button onClick={() => handleDelete(h._id, h.email)} disabled={deletingId === h._id}
                              className="text-red-500 hover:text-red-700 text-xs font-semibold disabled:opacity-50">
                              {deletingId === h._id ? "..." : "Delete"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* USERS — STUDENTS ONLY with Detain/Reinstate toggle */}
            {activeTab === "users" && (
              <div className="space-y-4">
                <Alert msg={toggleMsg} />

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                  <span className="text-blue-500 text-lg">ℹ️</span>
                  <div className="text-sm text-blue-700">
                    This tab shows <strong>students only</strong>. Use the <strong>Detain</strong> button to detain a student after reviewing their attendance in the Attendance tab.
                    Detaining a student <strong>blocks them from registering</strong> subjects. Use the <strong>Detained</strong> tab to reinstate.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                  <input type="text" placeholder="Search email, name, roll number..."
                    value={search} onChange={(e) => setSearch(e.target.value)} className="input-field flex-1 min-w-[200px]" />
                  <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="input-field sm:w-44">
                    <option value="">All Departments</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="input-field sm:w-36">
                    <option value="">All Years</option>
                    {YEARS.map((y) => <option key={y} value={y}>E{y} — Year {y}</option>)}
                  </select>
                  <select value={filterSem} onChange={(e) => setFilterSem(e.target.value)} className="input-field sm:w-36">
                    <option value="">All Semesters</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>

                <p className="text-sm text-gray-500">Showing <strong>{filteredUsers.length}</strong> students</p>

                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-brick-500 text-white text-xs uppercase tracking-wide">
                          <th className="px-5 py-3.5 text-left">#</th>
                          <th className="px-5 py-3.5 text-left">Student</th>
                          <th className="px-5 py-3.5 text-left hidden sm:table-cell">Roll No</th>
                          <th className="px-5 py-3.5 text-left hidden md:table-cell">Dept</th>
                          <th className="px-5 py-3.5 text-left hidden lg:table-cell">Year · Sem</th>
                          <th className="px-5 py-3.5 text-center">Status</th>
                          <th className="px-5 py-3.5 text-left">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredUsers.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-10 text-gray-400">No students found</td></tr>
                        ) : filteredUsers.map((u, i) => {
                          const sc = STATUS_CONFIG[u.academicStatus] || STATUS_CONFIG.active;
                          const isDetained = u.academicStatus === "detained";
                          return (
                            <tr key={u._id} className={`transition ${isDetained ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}`}>
                              <td className="px-5 py-3.5 text-gray-400">{i + 1}</td>
                              <td className="px-5 py-3.5">
                                <p className="font-medium text-gray-800">{u.name || u.email}</p>
                                {u.name && <p className="text-xs text-gray-400">{u.email}</p>}
                              </td>
                              <td className="px-5 py-3.5 hidden sm:table-cell">
                                <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{u.rollNumber || "—"}</span>
                              </td>
                              <td className="px-5 py-3.5 hidden md:table-cell">
                                <span className="bg-gray-100 text-gray-700 badge">{u.department}</span>
                              </td>
                              <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">
                                {u.year ? `E${u.year} · S${u.semester}` : "—"}
                              </td>
                              <td className="px-5 py-3.5 text-center">
                                <span className={`badge ${sc.cls}`}>{sc.label}</span>
                              </td>
                              <td className="px-5 py-3.5">
                                <button onClick={() => handleDelete(u._id, u.email)} disabled={deletingId === u._id}
                                  className="text-red-500 hover:text-red-700 text-xs font-semibold disabled:opacity-50">
                                  {deletingId === u._id ? "..." : "Delete"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ATTENDANCE UPLOADS */}
            {activeTab === "attendance" && <AttendanceTab />}

            {/* DETAINED STUDENTS */}
            {activeTab === "detained" && <DetainedTab />}

            {/* REGISTRATIONS */}
            {activeTab === "registrations" && <RegistrationsTab />}

            {/* ADD REGULATION */}
            {activeTab === "add regulation" && <AddRegulationTab />}

            {/* CREATE HOD */}
            {activeTab === "create hod" && (
              <div className="max-w-lg space-y-4">
                <h3 className="font-semibold text-gray-700">Create New HOD Account</h3>
                <div className="card p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" placeholder="hod.dept@rguktrkv.ac.in"
                      value={hodForm.email} onChange={(e) => setHodForm({ ...hodForm, email: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Password</label>
                    <input type="password" placeholder="Set a secure password"
                      value={hodForm.password} onChange={(e) => setHodForm({ ...hodForm, password: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select value={hodForm.department} onChange={(e) => setHodForm({ ...hodForm, department: e.target.value })} className="input-field">
                      <option value="">Select department</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  {hodMsg.text && (
                    <div className={`rounded-lg px-4 py-2.5 text-sm ${hodMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                      {hodMsg.type === "success" ? "✓" : "⚠"} {hodMsg.text}
                    </div>
                  )}
                  <button onClick={handleCreateHOD} disabled={hodLoading} className="btn-primary w-full">
                    {hodLoading ? "Creating..." : "Create HOD Account"}
                  </button>
                </div>
                {hods.length > 0 && (
                  <div className="card p-5">
                    <h4 className="font-medium text-gray-700 mb-3 text-sm">Existing HODs</h4>
                    <div className="space-y-2">
                      {hods.map((h) => (
                        <div key={h._id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{h.email}</span>
                          <span className="bg-brick-100 text-brick-700 badge">{h.department}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SuperAdminDashboard;
