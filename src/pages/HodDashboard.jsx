import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../api";

const YEARS = [1, 2, 3, 4];
const SEMS  = [1, 2];
const VALID_COURSE_TYPES = ["BSC","ESC","PCC","PEC","OEC","HSMC","PR","MC","EAC"];

const CUR = new Date().getFullYear();
const ACADEMIC_YEARS = [
  `${CUR - 1}-${String(CUR).slice(2)}`,
  `${CUR}-${String(CUR + 1).slice(2)}`,
  `${CUR + 1}-${String(CUR + 2).slice(2)}`,
];

function useRegulations() {
  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading]         = useState(true);
  const refresh = useCallback(() => {
    setLoading(true);
    API.get("/hod/regulations")
      .then((r) => setRegulations(r.data.regulations))
      .catch(() => setRegulations([]))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { regulations, loading, refresh };
}

const COURSE_TYPE_COLORS = {
  PCC:  "bg-blue-100 text-blue-700",
  PEC:  "bg-purple-100 text-purple-700",
  OEC:  "bg-green-100 text-green-700",
  HSMC: "bg-amber-100 text-amber-700",
  PR:   "bg-rose-100 text-rose-700",
  MC:   "bg-gray-100 text-gray-600",
  BSC:  "bg-cyan-100 text-cyan-700",
  ESC:  "bg-indigo-100 text-indigo-700",
  EAC:  "bg-teal-100 text-teal-700",
};

function StatCard({ icon, label, value, color }) {
  const colors = {
    red:    "bg-brick-50 border-brick-200",
    blue:   "bg-blue-50 border-blue-200",
    green:  "bg-green-50 border-green-200",
    amber:  "bg-amber-50 border-amber-200",
    purple: "bg-purple-50 border-purple-200",
  };
  return (
    <div className={`card border p-5 ${colors[color] || "bg-gray-50 border-gray-200"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-black text-gray-800 mt-1">{value ?? "—"}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function AlertMsg({ msg }) {
  if (!msg?.text) return null;
  const ok = msg.type === "success";
  return (
    <div className={`rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${
      ok ? "bg-green-50 text-green-700 border border-green-200"
         : "bg-red-50 text-red-600 border border-red-200"
    }`}>
      <span>{ok ? "✓" : "⚠"}</span>{msg.text}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-4 border-brick-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function FilterBar({ year, sem, reg, onYear, onSem, onReg, regulations = [] }) {
  return (
    <div className="card p-4 flex flex-wrap gap-3 items-end">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Year</label>
        <select value={year} onChange={(e) => onYear(e.target.value)} className="input-field w-36">
          {YEARS.map((y) => <option key={y} value={y}>E{y} — Year {y}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Semester</label>
        <select value={sem} onChange={(e) => onSem(e.target.value)} className="input-field w-32">
          {SEMS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Regulation</label>
        {regulations.length === 0 ? (
          <div className="input-field w-28 text-gray-400 text-xs">No data</div>
        ) : (
          <select value={reg} onChange={(e) => onReg(e.target.value)} className="input-field w-28">
            {regulations.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: REGULATION VIEW
// ─────────────────────────────────────────────────────────────────────────────
function RegulationTab({ dept }) {
  const { regulations, loading: regLoading } = useRegulations();
  const [year, setYear] = useState("3");
  const [sem, setSem]   = useState("1");
  const [reg, setReg]   = useState("");
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (regulations.length > 0 && !reg) setReg(regulations[0]);
  }, [regulations]);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const r = await API.get(`/hod/subjects?year=${year}&semester=${sem}&regulation=${reg}`);
      setSubjects(r.data.subjects);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [year, sem, reg]);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const coreSubjects  = subjects.filter((s) => s.type === "core");
  const electiveSlots = subjects.filter((s) => s.type === "elective");
  const totalCredits  = subjects.reduce((acc, s) => acc + s.credits, 0);

  return (
    <div className="space-y-4">
      <FilterBar year={year} sem={sem} reg={reg} onYear={setYear} onSem={setSem} onReg={setReg} regulations={regulations} />
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <span className="text-blue-500 text-lg mt-0.5">ℹ️</span>
        <div className="text-sm text-blue-700">
          <strong>Read-only view.</strong> These subjects come from the regulation data uploaded by the <strong>SuperAdmin</strong>.
          Use the <strong>Elective Groups</strong> tab to configure which subjects students pick for each elective slot.
        </div>
      </div>
      {loading ? <Spinner /> : subjects.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <p className="text-4xl mb-3">📄</p>
          <p className="font-medium">No regulation data found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            <div className="card p-4 text-center"><p className="text-2xl font-black text-brick-500">{subjects.length}</p><p className="text-xs text-gray-500 mt-1">Total Subjects</p></div>
            <div className="card p-4 text-center"><p className="text-2xl font-black text-blue-500">{coreSubjects.length}</p><p className="text-xs text-gray-500 mt-1">Core</p></div>
            <div className="card p-4 text-center"><p className="text-2xl font-black text-purple-500">{electiveSlots.length}</p><p className="text-xs text-gray-500 mt-1">Elective Slots</p></div>
            <div className="card p-4 text-center"><p className="text-2xl font-black text-green-500">{totalCredits}</p><p className="text-xs text-gray-500 mt-1">Total Credits</p></div>
          </div>
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">{dept} · E{year} · Semester {sem} · {reg}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brick-500 text-white text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left w-8">#</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Subject Name</th>
                    <th className="px-4 py-3 text-center">L</th>
                    <th className="px-4 py-3 text-center">T</th>
                    <th className="px-4 py-3 text-center">P</th>
                    <th className="px-4 py-3 text-center">Credits</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subjects.map((s, i) => (
                    <tr key={s._id} className={`hover:bg-gray-50 transition ${s.type === "elective" ? "bg-purple-50/40" : ""}`}>
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3"><span className={`badge text-xs ${COURSE_TYPE_COLORS[s.courseType] || "bg-gray-100 text-gray-600"}`}>{s.courseType}</span></td>
                      <td className="px-4 py-3"><span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{s.code}</span></td>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.name}{s.type === "elective" && <span className="ml-2 text-xs text-purple-500 font-normal">← HOD fills this</span>}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{s.hours?.L ?? 0}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{s.hours?.T ?? 0}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{s.hours?.P ?? 0}</td>
                      <td className="px-4 py-3 text-center"><span className="bg-blue-50 text-blue-700 badge font-semibold">{s.credits}</span></td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {s.type === "core" ? <span className="badge bg-brick-100 text-brick-700 text-xs">Core</span>
                          : s.electiveGroupId ? <span className="badge bg-green-100 text-green-700 text-xs">✓ Group set</span>
                          : <span className="badge bg-amber-100 text-amber-700 text-xs">Needs group</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td colSpan={7} className="px-4 py-3 font-semibold text-gray-700 text-sm">Total Credits</td>
                    <td className="px-4 py-3 text-center"><span className="bg-brick-500 text-white badge font-bold">{totalCredits}</span></td>
                    <td className="hidden md:table-cell" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: ELECTIVE GROUPS
// ─────────────────────────────────────────────────────────────────────────────
function ElectiveGroupsTab({ dept }) {
  const { regulations, loading: regLoading } = useRegulations();
  const [year, setYear] = useState("3");
  const [sem, setSem]   = useState("1");
  const [reg, setReg]   = useState("");
  useEffect(() => { if (regulations.length > 0 && !reg) setReg(regulations[0]); }, [regulations]);

  const [electiveSlots, setElectiveSlots] = useState([]);
  const [groups, setGroups]               = useState([]);
  const [loading, setLoading]             = useState(false);
  const EMPTY_FORM = { electiveSlot: "", groupName: "", chooseLimit: "1" };
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formMsg, setFormMsg]         = useState({ text: "", type: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [optionForms, setOptionForms] = useState({});
  const [optionMsgs, setOptionMsgs]   = useState({});
  const [deletingId, setDeletingId]   = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = `?year=${year}&semester=${sem}&regulation=${reg}`;
      const [sr, gr] = await Promise.all([
        API.get(`/hod/subjects${params}`),
        API.get(`/hod/elective-groups${params}`),
      ]);
      setElectiveSlots(sr.data.subjects.filter((s) => s.type === "elective"));
      setGroups(gr.data.groups);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [year, sem, reg]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setForm(EMPTY_FORM); setFormMsg({ text: "", type: "" }); }, [year, sem, reg]);

  const handleCreateGroup = async () => {
    setFormMsg({ text: "", type: "" });
    if (!form.electiveSlot || !form.groupName) { setFormMsg({ text: "Elective slot and group name are required", type: "error" }); return; }
    try {
      setFormLoading(true);
      if (editingGroup) {
        await API.put(`/hod/elective-groups/${editingGroup._id}`, { groupName: form.groupName, chooseLimit: form.chooseLimit });
        setFormMsg({ text: "Group updated", type: "success" });
        setEditingGroup(null);
      } else {
        await API.post("/hod/elective-groups", { electiveSlot: form.electiveSlot, groupName: form.groupName, year, semester: sem, regulation: reg, chooseLimit: form.chooseLimit });
        setFormMsg({ text: `Group created for "${form.electiveSlot}"`, type: "success" });
      }
      setForm(EMPTY_FORM);
      fetchData();
    } catch (e) { setFormMsg({ text: e.response?.data?.message || "Failed", type: "error" }); }
    finally { setFormLoading(false); }
  };

  const handleEditGroup = (g) => { setEditingGroup(g); setForm({ electiveSlot: g.electiveSlot, groupName: g.groupName, chooseLimit: String(g.chooseLimit) }); };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm("Delete this elective group?")) return;
    try { setDeletingId(id); await API.delete(`/hod/elective-groups/${id}`); fetchData(); }
    catch (e) { alert(e.response?.data?.message || "Delete failed"); }
    finally { setDeletingId(null); }
  };

  const setOptionForm = (gid, val) => setOptionForms((p) => ({ ...p, [gid]: val }));
  const setOptionMsg  = (gid, val) => setOptionMsgs((p) => ({ ...p, [gid]: val }));

  const handleAddOption = async (gid) => {
    const of = optionForms[gid] || { code: "", name: "", credits: "3" };
    setOptionMsg(gid, { text: "", type: "" });
    if (!of.code || !of.name) { setOptionMsg(gid, { text: "Code and name required", type: "error" }); return; }
    try {
      setDeletingId(gid);
      await API.post(`/hod/elective-groups/${gid}/options`, { code: of.code.toUpperCase(), name: of.name, credits: Number(of.credits) });
      setOptionForm(gid, { code: "", name: "", credits: "3" });
      setOptionMsg(gid, { text: "Option added", type: "success" });
      fetchData();
    } catch (e) { setOptionMsg(gid, { text: e.response?.data?.message || "Failed", type: "error" }); }
    finally { setDeletingId(null); }
  };

  const handleDeleteOption = async (gid, optId) => {
    try { setDeletingId(optId); await API.delete(`/hod/elective-groups/${gid}/options/${optId}`); fetchData(); }
    catch (e) { alert("Delete failed"); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-4">
      <FilterBar year={year} sem={sem} reg={reg} onYear={setYear} onSem={setSem} onReg={setReg} regulations={regulations} />
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-gray-800">{editingGroup ? "Edit Group" : "Create Elective Group"}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Elective Slot</label>
            {editingGroup ? (
              <div className="input-field bg-gray-100 text-gray-500 text-sm">{form.electiveSlot}</div>
            ) : (
              <select value={form.electiveSlot} onChange={(e) => setForm({ ...form, electiveSlot: e.target.value })} className="input-field">
                <option value="">Select slot...</option>
                {Array.from(new Map(electiveSlots.map((s) => { const lbl = s.electiveSlot || s.name; return [lbl, { lbl, id: s._id }]; })).values()).map(({ lbl, id }) => (
                  <option key={id} value={lbl}>{lbl}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Group Name</label>
            <input type="text" placeholder="e.g. Group A" value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Choose Limit</label>
            <select value={form.chooseLimit} onChange={(e) => setForm({ ...form, chooseLimit: e.target.value })} className="input-field">
              {[1,2,3].map((n) => <option key={n} value={n}>Choose {n}</option>)}
            </select>
          </div>
        </div>
        <AlertMsg msg={formMsg} />
        <div className="flex gap-3">
          <button onClick={handleCreateGroup} disabled={formLoading} className="btn-primary disabled:opacity-40">
            {formLoading ? "Saving..." : editingGroup ? "Update Group" : "Create Group"}
          </button>
          {editingGroup && <button onClick={() => { setEditingGroup(null); setForm(EMPTY_FORM); }} className="btn-outline">Cancel</button>}
        </div>
      </div>
      {loading ? <Spinner /> : groups.length === 0 ? (
        <div className="card p-10 text-center text-gray-400"><p className="text-4xl mb-3">📂</p><p className="font-medium">No elective groups yet</p></div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const of = optionForms[g._id] || { code: "", name: "", credits: "3" };
            const om = optionMsgs[g._id]  || { text: "", type: "" };
            return (
              <div key={g._id} className="card overflow-hidden">
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{g.groupName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Slot: {g.electiveSlot} · Choose {g.chooseLimit}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleEditGroup(g)} className="text-blue-500 hover:text-blue-700 text-sm font-semibold">Edit Group</button>
                    <button onClick={() => handleDeleteGroup(g._id)} disabled={deletingId === g._id} className="text-red-400 hover:text-red-600 text-sm font-semibold disabled:opacity-50">{deletingId === g._id ? "..." : "Delete Group"}</button>
                  </div>
                </div>
                <div className="px-5 py-4">
                  {g.electiveOptions.length === 0 ? (
                    <p className="text-sm text-amber-600 flex items-center gap-2 mb-4"><span>⚠</span>No subject options yet. Add at least {g.chooseLimit} option(s) below.</p>
                  ) : (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Subject Options ({g.electiveOptions.length})</p>
                      <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                        {g.electiveOptions.map((opt, idx) => (
                          <div key={opt._id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                              <div><p className="font-medium text-gray-800 text-sm">{opt.name}</p><p className="text-xs text-gray-400 font-mono">{opt.code}</p></div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="bg-blue-50 text-blue-700 badge text-xs">{opt.credits} cr</span>
                              <button onClick={() => handleDeleteOption(g._id, opt._id)} disabled={deletingId === opt._id} className="text-red-400 hover:text-red-600 text-xs font-semibold disabled:opacity-50">{deletingId === opt._id ? "..." : "Remove"}</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Add Subject Option</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input type="text" placeholder="Subject Code" value={of.code} onChange={(e) => setOptionForm(g._id, { ...of, code: e.target.value })} className="input-field uppercase text-xs" />
                      <input type="text" placeholder="Subject Name" value={of.name} onChange={(e) => setOptionForm(g._id, { ...of, name: e.target.value })} className="input-field text-xs" />
                      <div className="flex gap-2">
                        <select value={of.credits} onChange={(e) => setOptionForm(g._id, { ...of, credits: e.target.value })} className="input-field w-24 text-xs">
                          {[1,1.5,2,3,4].map((c) => <option key={c} value={c}>{c} cr</option>)}
                        </select>
                        <button onClick={() => handleAddOption(g._id)} className="btn-primary text-xs px-3 whitespace-nowrap">+ Add</button>
                      </div>
                    </div>
                    <AlertMsg msg={om} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: STUDENTS — READ ONLY (no status toggle; SuperAdmin owns detention)
// ─────────────────────────────────────────────────────────────────────────────
function StudentsTab({ dept }) {
  const [students, setStudents]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterYear, setFilterYear] = useState("");
  const [search, setSearch]       = useState("");

  const STATUS_CFG = {
    active:    { label: "Active",    cls: "badge-active" },
    detained:  { label: "Detained",  cls: "badge-detained" },
    graduated: { label: "Graduated", cls: "badge-graduated" },
  };

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = filterYear ? `?year=${filterYear}` : "";
      const r = await API.get(`/hod/students${params}`);
      setStudents(r.data.students);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterYear]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const filtered = students.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.rollNumber || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Info banner — explains read-only */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <span className="text-amber-500 text-lg mt-0.5">ℹ️</span>
        <div className="text-sm text-amber-700">
          <strong>Read-only view.</strong> Student status (Active / Detained / Graduated) is managed by the <strong>SuperAdmin</strong>.
          To request a detention or reinstatement, contact the SuperAdmin.
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Search name, email, roll number..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="input-field flex-1" />
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="input-field sm:w-40">
          <option value="">All Years</option>
          {YEARS.map((y) => <option key={y} value={y}>E{y} — Year {y}</option>)}
        </select>
      </div>

      <p className="text-sm text-gray-500">Showing <strong>{filtered.length}</strong> students from {dept}</p>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brick-500 text-white text-xs uppercase tracking-wide">
                  <th className="px-4 py-3.5 text-left">#</th>
                  <th className="px-4 py-3.5 text-left">Student</th>
                  <th className="px-4 py-3.5 text-left hidden sm:table-cell">Roll No</th>
                  <th className="px-4 py-3.5 text-left hidden md:table-cell">Year · Sem</th>
                  <th className="px-4 py-3.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">No students found</td></tr>
                ) : filtered.map((s, i) => {
                  const sc = STATUS_CFG[s.academicStatus] || STATUS_CFG.active;
                  return (
                    <tr key={s._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3.5 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-800">{s.name || s.email}</p>
                        {s.name && <p className="text-xs text-gray-400">{s.email}</p>}
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{s.rollNumber || "—"}</span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 hidden md:table-cell">
                        {s.year ? `E${s.year} · S${s.semester}` : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge ${sc.cls}`}>{sc.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: UPLOAD ATTENDANCE (NEW)
// HOD uploads one Excel per dept+year+sem+academicYear
// Backend auto-groups by section
// ─────────────────────────────────────────────────────────────────────────────
function UploadAttendanceTab({ dept }) {
  const [form, setForm] = useState({
    year: "3", semester: "1", academicYear: ACADEMIC_YEARS[0],
  });
  const [file, setFile]         = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]           = useState({ text: "", type: "" });

  // Past uploads for this dept
  const [records, setRecords]   = useState([]);
  const [loadingRec, setLoadingRec] = useState(false);
  const [filterYear, setFilterYear] = useState("");
  const [filterSem, setFilterSem]   = useState("");
  const [filterAY, setFilterAY]     = useState("");

  const flash = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 6000);
  };

  const fetchRecords = useCallback(async () => {
    try {
      setLoadingRec(true);
      const params = new URLSearchParams();
      if (filterYear) params.append("year",         filterYear);
      if (filterSem)  params.append("semester",     filterSem);
      if (filterAY)   params.append("academicYear", filterAY);
      const r = await API.get(`/hod/attendance?${params}`);
      setRecords(r.data.records || []);
    } catch (e) { console.error(e); }
    finally { setLoadingRec(false); }
  }, [filterYear, filterSem, filterAY]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleUpload = async () => {
    if (!file) { flash("Please select an Excel file (.xlsx)", "error"); return; }
    if (!form.year || !form.semester || !form.academicYear) {
      flash("Year, semester and academic year are required", "error"); return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file",         file);
      fd.append("year",         form.year);
      fd.append("semester",     form.semester);
      fd.append("academicYear", form.academicYear);
      const r = await API.post("/hod/attendance/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      flash(`${r.data.message} · ${r.data.totalStudents} student rows processed`);
      setFile(null);
      // reset file input
      document.getElementById("att-file-input").value = "";
      fetchRecords();
    } catch (e) {
      flash(e.response?.data?.message || "Upload failed", "error");
    } finally { setUploading(false); }
  };

  const pctColor = (pct) => {
    if (pct >= 75) return "text-green-600 font-semibold";
    if (pct >= 60) return "text-amber-600 font-semibold";
    return "text-red-600 font-bold";
  };

  const pctBg = (pct) => {
    if (pct >= 75) return "bg-green-50";
    return "bg-red-50";
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className="card p-6 space-y-5">
        <div>
          <h3 className="font-semibold text-gray-800 text-base">Upload Attendance Excel</h3>
          <p className="text-xs text-gray-500 mt-1">
            Upload the consolidated attendance sheet for your department.
            The file must contain columns: <strong>ID. NO., Student Name, Sec Name, consolidated</strong>.
            One file covers all sections — backend groups by section automatically.
            Re-uploading the same year/semester/academic year will <strong>replace</strong> previous data.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Year *</label>
            <select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="input-field">
              {YEARS.map((y) => <option key={y} value={y}>E{y} — Year {y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Semester *</label>
            <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="input-field">
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Academic Year *</label>
            <select value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} className="input-field">
              {ACADEMIC_YEARS.map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Excel File (.xlsx) *</label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-brick-400 transition">
            <input
              id="att-file-input"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
            <label htmlFor="att-file-input" className="cursor-pointer">
              {file ? (
                <div>
                  <p className="text-2xl mb-2">📊</p>
                  <p className="font-semibold text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                </div>
              ) : (
                <div>
                  <p className="text-3xl mb-2">📂</p>
                  <p className="font-medium text-gray-600">Click to select Excel file</p>
                  <p className="text-xs text-gray-400 mt-1">.xlsx or .xls · Max 5 MB</p>
                </div>
              )}
            </label>
          </div>
        </div>

        <AlertMsg msg={msg} />

        <button onClick={handleUpload} disabled={uploading || !file} className="btn-primary disabled:opacity-40 flex items-center gap-2">
          {uploading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Uploading & Processing...</>
          ) : (
            <><span>📤</span> Upload Attendance</>
          )}
        </button>
      </div>

      {/* Past Uploads */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <h3 className="font-semibold text-gray-700 flex-1">Previous Uploads for {dept}</h3>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="input-field w-36">
            <option value="">All Years</option>
            {YEARS.map((y) => <option key={y} value={y}>E{y}</option>)}
          </select>
          <select value={filterSem} onChange={(e) => setFilterSem(e.target.value)} className="input-field w-36">
            <option value="">All Sems</option>
            <option value="1">Sem 1</option>
            <option value="2">Sem 2</option>
          </select>
          <select value={filterAY} onChange={(e) => setFilterAY(e.target.value)} className="input-field w-36">
            <option value="">All Acad Years</option>
            {ACADEMIC_YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>

        {loadingRec ? <Spinner /> : records.length === 0 ? (
          <div className="card p-10 text-center text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">No attendance uploads yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((rec) => {
              const below75 = rec.students.filter((s) => s.attendancePercentage < 75).length;
              return (
                <div key={rec._id} className="card overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-brick-100 text-brick-700 badge font-bold">{rec.department}</span>
                      <span className="font-semibold text-gray-800">E{rec.year} · Sem {rec.semester} · {rec.academicYear}</span>
                      <span className="bg-blue-100 text-blue-700 badge">Section {rec.section}</span>
                      <span className="text-sm text-gray-500">{rec.students.length} students</span>
                      {below75 > 0 && (
                        <span className="bg-red-100 text-red-600 badge text-xs">⚠ {below75} below 75%</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      Uploaded: {new Date(rec.updatedAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="bg-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                          <th className="px-4 py-2.5 text-left">#</th>
                          <th className="px-4 py-2.5 text-left">Roll No.</th>
                          <th className="px-4 py-2.5 text-left">Name</th>
                          <th className="px-4 py-2.5 text-center">Attendance %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rec.students.map((s, i) => (
                          <tr key={i} className={`transition ${pctBg(s.attendancePercentage)}`}>
                            <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                            <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{s.rollNumber}</td>
                            <td className="px-4 py-2.5 font-medium text-gray-800">{s.name}</td>
                            <td className={`px-4 py-2.5 text-center ${pctColor(s.attendancePercentage)}`}>
                              {s.attendancePercentage.toFixed(2)}%
                              {s.attendancePercentage < 75 && <span className="ml-1 text-red-500 text-xs">⚠</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: ADD REGULATION
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_SUBJECT = {
  code: "", name: "", credits: "3", courseType: "PCC",
  year: "1", semester: "1", type: "core",
  electiveSlot: "", isLab: false,
  hours: { L: "3", T: "0", P: "0" },
};

function AddRegulationTab({ dept, onRegulationAdded }) {
  const { regulations, refresh: refreshRegs } = useRegulations();
  const [mode, setMode]         = useState("json");
  const [regulation, setRegulation] = useState("");
  const [msg, setMsg]           = useState({ text: "", type: "" });
  const [loading, setLoading]   = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonPreview, setJsonPreview] = useState(null);
  const [jsonError, setJsonError]     = useState("");
  const [manualSubjects, setManualSubjects] = useState([]);
  const [currentSubject, setCurrentSubject] = useState(EMPTY_SUBJECT);
  const [subjectMsg, setSubjectMsg]         = useState({ text: "", type: "" });
  const [delReg, setDelReg]     = useState("");
  const [delLoading, setDelLoading] = useState(false);
  const [delMsg, setDelMsg]     = useState({ text: "", type: "" });

  const flash = (text, type = "success") => { setMsg({ text, type }); setTimeout(() => setMsg({ text: "", type: "" }), 5000); };

  const handleParseJson = () => {
    setJsonError(""); setJsonPreview(null);
    try {
      const parsed = JSON.parse(jsonText.trim());
      const subjects = Array.isArray(parsed) ? parsed : parsed.subjects;
      if (!Array.isArray(subjects)) throw new Error("Expected an array of subjects");
      if (subjects.length === 0)   throw new Error("Array is empty");
      setJsonPreview(subjects);
    } catch (e) { setJsonError("Invalid JSON: " + e.message); }
  };

  const handleSubmitJson = async () => {
    if (!regulation.trim()) { flash("Enter a regulation name (e.g. R26)", "error"); return; }
    if (!jsonPreview)        { flash("Parse your JSON first", "error"); return; }
    try {
      setLoading(true);
      const r = await API.post("/hod/regulations", { regulation: regulation.trim().toUpperCase(), subjects: jsonPreview });
      flash(`${r.data.message}${r.data.errors?.length ? " — some errors: " + r.data.errors.join(", ") : ""}`);
      setJsonText(""); setJsonPreview(null); setRegulation(""); refreshRegs(); onRegulationAdded?.();
    } catch (e) { flash(e.response?.data?.message || "Upload failed", "error"); }
    finally { setLoading(false); }
  };

  const handleAddSubject = () => {
    setSubjectMsg({ text: "", type: "" });
    const { code, name, credits, courseType, year, semester, type: sType } = currentSubject;
    if (!code || !name || !credits || !courseType || !year || !semester) { setSubjectMsg({ text: "All required fields must be filled", type: "error" }); return; }
    if (manualSubjects.find((s) => s.code.toUpperCase() === code.toUpperCase())) { setSubjectMsg({ text: `Code "${code}" already added`, type: "error" }); return; }
    setManualSubjects((p) => [...p, { ...currentSubject, code: code.toUpperCase(), credits: Number(credits), year: Number(year), semester: Number(semester), hours: { L: Number(currentSubject.hours.L), T: Number(currentSubject.hours.T), P: Number(currentSubject.hours.P) } }]);
    setCurrentSubject(EMPTY_SUBJECT);
    setSubjectMsg({ text: `Added "${name}"`, type: "success" });
  };

  const handleSubmitManual = async () => {
    if (!regulation.trim())         { flash("Enter a regulation name", "error"); return; }
    if (manualSubjects.length === 0){ flash("Add at least one subject", "error"); return; }
    try {
      setLoading(true);
      const r = await API.post("/hod/regulations", { regulation: regulation.trim().toUpperCase(), subjects: manualSubjects });
      flash(`${r.data.message}`);
      setManualSubjects([]); setRegulation(""); refreshRegs(); onRegulationAdded?.();
    } catch (e) { flash(e.response?.data?.message || "Upload failed", "error"); }
    finally { setLoading(false); }
  };

  const handleDeleteRegulation = async () => {
    if (!delReg) { setDelMsg({ text: "Select a regulation to delete", type: "error" }); return; }
    if (!window.confirm(`Delete ALL subjects for ${dept} ${delReg}? This cannot be undone.`)) return;
    try {
      setDelLoading(true);
      const r = await API.delete(`/hod/regulations/${delReg}`);
      setDelMsg({ text: r.data.message, type: "success" }); setDelReg(""); refreshRegs();
    } catch (e) { setDelMsg({ text: e.response?.data?.message || "Delete failed", type: "error" }); }
    finally { setDelLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Regulations in DB for {dept}</h3>
        {regulations.length === 0 ? (
          <p className="text-sm text-amber-600">No regulation data yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {regulations.map((r) => <span key={r} className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-sm font-bold px-3 py-1.5 rounded-lg">✓ {r}</span>)}
          </div>
        )}
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <h3 className="font-semibold text-gray-800 text-base">Add New Regulation</h3>
          <p className="text-xs text-gray-500 mt-1">Upload subjects for a new regulation for <strong>{dept}</strong>.</p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Regulation Name *</label>
            <input type="text" placeholder="e.g. R26" value={regulation} onChange={(e) => setRegulation(e.target.value.toUpperCase())} className="input-field w-28 uppercase font-mono" maxLength={4} />
          </div>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {[{ id: "json", label: "📄 Paste JSON" }, { id: "manual", label: "✏️ Manual Entry" }].map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`px-4 py-2 rounded-md text-sm font-semibold transition ${mode === m.id ? "bg-white text-brick-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{m.label}</button>
          ))}
        </div>

        {mode === "json" && (
          <div className="space-y-4">
            <textarea value={jsonText} onChange={(e) => { setJsonText(e.target.value); setJsonPreview(null); setJsonError(""); }} placeholder="Paste subjects array JSON here..." className="w-full h-48 p-3 font-mono text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brick-400 resize-y" />
            {jsonError && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">✗ {jsonError}</div>}
            {jsonPreview && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-700 font-semibold text-sm">✓ Parsed — {jsonPreview.length} subjects found</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleParseJson} disabled={!jsonText.trim()} className="btn-outline disabled:opacity-40">Parse & Preview</button>
              <button onClick={handleSubmitJson} disabled={loading || !jsonPreview || !regulation.trim()} className="btn-primary disabled:opacity-40">{loading ? "Uploading..." : `Upload (${jsonPreview?.length ?? 0} subjects)`}</button>
            </div>
          </div>
        )}

        {mode === "manual" && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Add Subject</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <input type="text" placeholder="Code *" value={currentSubject.code} onChange={(e) => setCurrentSubject({ ...currentSubject, code: e.target.value.toUpperCase() })} className="input-field uppercase font-mono text-sm" />
                <input type="text" placeholder="Subject Name *" value={currentSubject.name} onChange={(e) => setCurrentSubject({ ...currentSubject, name: e.target.value })} className="input-field text-sm sm:col-span-1" />
                <select value={currentSubject.courseType} onChange={(e) => setCurrentSubject({ ...currentSubject, courseType: e.target.value })} className="input-field text-sm">
                  {VALID_COURSE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
                <select value={currentSubject.credits} onChange={(e) => setCurrentSubject({ ...currentSubject, credits: e.target.value })} className="input-field text-sm">
                  {[0,1,1.5,2,2.5,3,4,5,6,10].map((c) => <option key={c} value={c}>{c} cr</option>)}
                </select>
                <select value={currentSubject.type} onChange={(e) => setCurrentSubject({ ...currentSubject, type: e.target.value })} className="input-field text-sm">
                  <option value="core">Core</option>
                  <option value="elective">Elective</option>
                </select>
                <select value={currentSubject.year} onChange={(e) => setCurrentSubject({ ...currentSubject, year: e.target.value })} className="input-field text-sm">
                  {YEARS.map((y) => <option key={y} value={y}>E{y}</option>)}
                </select>
                <select value={currentSubject.semester} onChange={(e) => setCurrentSubject({ ...currentSubject, semester: e.target.value })} className="input-field text-sm">
                  <option value="1">Sem 1</option><option value="2">Sem 2</option>
                </select>
              </div>
              <AlertMsg msg={subjectMsg} />
              <button onClick={handleAddSubject} className="btn-outline text-sm">+ Add to List</button>
            </div>
            {manualSubjects.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">{manualSubjects.length} subjects staged</p>
                <button onClick={handleSubmitManual} disabled={loading || !regulation.trim()} className="btn-primary disabled:opacity-40">
                  {loading ? "Uploading..." : `Save ${manualSubjects.length} subjects as ${regulation || "??"}`}
                </button>
              </div>
            )}
          </div>
        )}
        <AlertMsg msg={msg} />
      </div>

      {regulations.length > 0 && (
        <div className="card p-5 border border-red-100">
          <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2"><span>⚠️</span> Delete Regulation Data</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <select value={delReg} onChange={(e) => setDelReg(e.target.value)} className="input-field w-32">
              <option value="">Choose...</option>
              {regulations.map((r) => <option key={r}>{r}</option>)}
            </select>
            <button onClick={handleDeleteRegulation} disabled={delLoading || !delReg} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-40">
              {delLoading ? "Deleting..." : "Delete All Subjects"}
            </button>
          </div>
          <AlertMsg msg={delMsg} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: REGISTRATIONS
// ─────────────────────────────────────────────────────────────────────────────
function RegistrationsTab({ dept }) {
  const [regs, setRegs]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError]       = useState("");
  const [expanded, setExpanded] = useState(null);
  const [year, setYear]         = useState("");
  const [semester, setSemester] = useState("");
  const [regulation, setRegulation] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  const fetchRegs = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const params = new URLSearchParams();
      if (year)         params.append("year", year);
      if (semester)     params.append("semester", semester);
      if (regulation)   params.append("regulation", regulation);
      if (academicYear) params.append("academicYear", academicYear);
      const res = await API.get(`/hod/registrations?${params}`);
      setRegs(res.data.registrations || []);
    } catch (e) { setError(e.response?.data?.message || "Failed to load registrations"); }
    finally { setLoading(false); }
  }, [year, semester, regulation, academicYear]);

  useEffect(() => { fetchRegs(); }, [fetchRegs]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (year) params.append("year", year);
      if (semester) params.append("semester", semester);
      if (regulation) params.append("regulation", regulation);
      if (academicYear) params.append("academicYear", academicYear);
      const res = await API.get(`/hod/registrations/export?${params}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Registrations_${dept}_${academicYear || "all"}_Sem${semester || "all"}.xlsx`);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { alert(e.response?.data?.message || "Export failed"); }
    finally { setExporting(false); }
  };

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="input-field w-32">
              <option value="">All Years</option>
              {YEARS.map((y) => <option key={y} value={y}>E{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Semester</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="input-field w-36">
              <option value="">All Semesters</option>
              {SEMS.map((s) => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Regulation</label>
            <input value={regulation} onChange={(e) => setRegulation(e.target.value.toUpperCase())} placeholder="e.g. R23" maxLength={4} className="input-field w-28 uppercase font-mono" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Academic Year</label>
            <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="e.g. 2025-26" className="input-field w-32" />
          </div>
          <button onClick={fetchRegs} className="btn-outline text-sm h-[42px]">🔍 Filter</button>
          <div className="ml-auto">
            <button onClick={handleExport} disabled={exporting || regs.length === 0}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition disabled:opacity-40">
              {exporting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Exporting...</> : <><span>📥</span> Download Excel</>}
            </button>
          </div>
        </div>
      </div>

      {loading && <Spinner />}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>}
      {!loading && !error && regs.length === 0 && (
        <div className="card p-10 text-center"><p className="text-4xl mb-3">📋</p><p className="font-semibold text-gray-700">No registrations found</p></div>
      )}
      {!loading && !error && regs.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brick-500 text-white text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Roll No.</th>
                  <th className="px-4 py-3 text-left">Student Name</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">Year · Sem</th>
                  <th className="px-4 py-3 text-center hidden md:table-cell">Regulation</th>
                  <th className="px-4 py-3 text-center">Credits</th>
                  <th className="px-4 py-3 text-center">Subjects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {regs.map((reg, i) => (
                  <React.Fragment key={reg._id}>
                    <tr className="hover:bg-gray-50 transition cursor-pointer" onClick={() => setExpanded(expanded === reg._id ? null : reg._id)}>
                      <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{reg.rollNumber || "—"}</td>
                      <td className="px-4 py-3"><p className="font-medium text-gray-800">{reg.studentName || "—"}</p><p className="text-xs text-gray-400">{reg.email}</p></td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell text-gray-600 text-xs">E{reg.year} · S{reg.semester}</td>
                      <td className="px-4 py-3 text-center hidden md:table-cell"><span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded font-mono">{reg.regulation}</span></td>
                      <td className="px-4 py-3 text-center"><span className="bg-brick-100 text-brick-700 text-sm font-bold px-2 py-0.5 rounded">{reg.totalCredits}</span></td>
                      <td className="px-4 py-3 text-center"><button className="text-xs text-brick-500 hover:text-brick-700 font-semibold">{expanded === reg._id ? "▲ Hide" : "▼ View"}</button></td>
                    </tr>
                    {expanded === reg._id && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-6 py-4">
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
// TAB: ELECTIVE REQUESTS
// (kept exactly as before — full implementation preserved)
// ─────────────────────────────────────────────────────────────────────────────
function ElectiveRequestsTab({ dept }) {
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setFilter]   = useState("pending");
  const [actionId, setActionId]     = useState(null);
  const [remark, setRemark]         = useState("");
  const [remarkFor, setRemarkFor]   = useState(null);
  const [msg, setMsg]               = useState({ text: "", type: "" });
  const [activeSection, setActiveSection] = useState("requests");
  const [deadlines, setDeadlines]   = useState([]);
  const [dlForm, setDlForm]         = useState({ year: "3", semester: "1", academicYear: ACADEMIC_YEARS[0], regulation: "", deadline: "", note: "", isOpen: true });
  const [dlLoading, setDlLoading]   = useState(false);
  const [dlMsg, setDlMsg]           = useState({ text: "", type: "" });

  const flash = (text, type = "success") => { setMsg({ text, type }); setTimeout(() => setMsg({ text: "", type: "" }), 5000); };

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const r = await API.get(`/elective-changes/hod?status=${statusFilter}`);
      setRequests(r.data.requests || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter]);

  const fetchDeadlines = useCallback(async () => {
    try {
      const r = await API.get("/elective-changes/deadline");
      setDeadlines(r.data.deadlines || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useEffect(() => { fetchDeadlines(); }, [fetchDeadlines]);

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this elective change request?")) return;
    try {
      setActionId(id);
      await API.patch(`/elective-changes/${id}/approve`);
      flash("Request approved — student notified via email.");
      fetchRequests();
    } catch (e) { flash(e.response?.data?.message || "Failed", "error"); }
    finally { setActionId(null); }
  };

  const handleRejectSubmit = async (id) => {
    if (!remark.trim()) { flash("Rejection reason is required", "error"); return; }
    try {
      setActionId(id);
      await API.patch(`/elective-changes/${id}/reject`, { remark });
      flash("Request rejected — student notified.");
      setRemarkFor(null); setRemark(""); fetchRequests();
    } catch (e) { flash(e.response?.data?.message || "Failed", "error"); }
    finally { setActionId(null); }
  };

  const handleSetDeadline = async () => {
    if (!dlForm.deadline || !dlForm.regulation) { setDlMsg({ text: "Deadline and regulation are required", type: "error" }); return; }
    try {
      setDlLoading(true);
      await API.post("/elective-changes/deadline", dlForm);
      setDlMsg({ text: "Deadline saved", type: "success" }); fetchDeadlines();
    } catch (e) { setDlMsg({ text: e.response?.data?.message || "Failed", type: "error" }); }
    finally { setDlLoading(false); }
  };

  const STATUS_COLORS = { pending: "bg-amber-100 text-amber-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-600" };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["requests","deadline"].map((s) => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition capitalize ${activeSection === s ? "bg-brick-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s === "requests" ? "📨 Change Requests" : "⏰ Set Deadline"}
          </button>
        ))}
      </div>

      {activeSection === "requests" && (
        <div className="space-y-4">
          <AlertMsg msg={msg} />
          <div className="flex gap-2">
            {["pending","approved","rejected"].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${statusFilter === s ? "bg-brick-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s}</button>
            ))}
          </div>
          {loading ? <Spinner /> : requests.length === 0 ? (
            <div className="card p-10 text-center text-gray-400"><p className="text-4xl mb-3">📨</p><p className="font-medium">No {statusFilter} requests</p></div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req._id} className="card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold text-gray-800">{req.studentName || req.studentEmail}</p>
                      <p className="text-xs text-gray-400">{req.studentEmail} · {req.department} · E{req.year}</p>
                    </div>
                    <span className={`badge text-xs capitalize ${STATUS_COLORS[req.status]}`}>{req.status}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                      <p className="font-semibold text-red-700 mb-1">Remove</p>
                      {(req.requestedChanges?.remove || []).map((s, i) => <p key={i} className="text-red-600">{s.code} — {s.name}</p>)}
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                      <p className="font-semibold text-green-700 mb-1">Add</p>
                      {(req.requestedChanges?.add || []).map((s, i) => <p key={i} className="text-green-600">{s.code} — {s.name}</p>)}
                    </div>
                  </div>
                  {req.studentReason && <p className="text-xs text-gray-500 italic">Reason: {req.studentReason}</p>}
                  {req.hodRemark && <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs text-gray-600"><strong>HOD Remark:</strong> {req.hodRemark}</div>}
                  {req.status === "pending" && (
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      {remarkFor === req._id ? (
                        <div className="space-y-2">
                          <textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Enter rejection reason (required)..." className="input-field h-20 resize-none text-sm" autoFocus />
                          <div className="flex gap-2">
                            <button onClick={() => handleRejectSubmit(req._id)} disabled={actionId === req._id} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-40">{actionId === req._id ? "Rejecting..." : "Confirm Reject"}</button>
                            <button onClick={() => { setRemarkFor(null); setRemark(""); }} className="btn-outline text-sm">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3 flex-wrap">
                          <button onClick={() => handleApprove(req._id)} disabled={actionId === req._id} className="btn-primary text-sm disabled:opacity-40">{actionId === req._id ? "Approving..." : "✓ Approve"}</button>
                          <button onClick={() => { setRemarkFor(req._id); setRemark(""); setMsg({ text: "", type: "" }); }} className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg transition">✕ Reject</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === "deadline" && (
        <div className="space-y-5">
          <div className="card p-6 space-y-4 max-w-lg">
            <div>
              <h3 className="font-semibold text-gray-800">Set Elective Change Deadline</h3>
              <p className="text-xs text-gray-500 mt-1">Students can only submit change requests before this deadline.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Year</label><select value={dlForm.year} onChange={(e) => setDlForm({ ...dlForm, year: e.target.value })} className="input-field">{[1,2,3,4].map((y) => <option key={y} value={y}>E{y}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Semester</label><select value={dlForm.semester} onChange={(e) => setDlForm({ ...dlForm, semester: e.target.value })} className="input-field"><option value="1">Sem 1</option><option value="2">Sem 2</option></select></div>
              <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Academic Year</label><input value={dlForm.academicYear} onChange={(e) => setDlForm({ ...dlForm, academicYear: e.target.value })} placeholder="2025-26" className="input-field" /></div>
              <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Regulation</label><input value={dlForm.regulation} onChange={(e) => setDlForm({ ...dlForm, regulation: e.target.value.toUpperCase() })} placeholder="R23" maxLength={4} className="input-field uppercase font-mono" /></div>
              <div className="col-span-2"><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Deadline Date & Time</label><input type="datetime-local" value={dlForm.deadline} onChange={(e) => setDlForm({ ...dlForm, deadline: e.target.value })} className="input-field" /></div>
              <div className="col-span-2 flex items-center gap-3">
                <input type="checkbox" id="isOpen" checked={dlForm.isOpen} onChange={(e) => setDlForm({ ...dlForm, isOpen: e.target.checked })} className="w-4 h-4 accent-brick-500" />
                <label htmlFor="isOpen" className="text-sm text-gray-700">Window is <strong>{dlForm.isOpen ? "open" : "closed"}</strong></label>
              </div>
            </div>
            {dlMsg.text && <div className={`rounded-lg px-4 py-3 text-sm ${dlMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>{dlMsg.type === "success" ? "✓" : "⚠"} {dlMsg.text}</div>}
            <button onClick={handleSetDeadline} disabled={dlLoading} className="btn-primary disabled:opacity-40">{dlLoading ? "Saving..." : "Save Deadline"}</button>
          </div>

          {deadlines.length > 0 && (
            <div className="card overflow-hidden max-w-2xl">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50"><p className="font-semibold text-gray-700 text-sm">Existing Deadlines for {dept}</p></div>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide"><th className="px-4 py-3 text-left">Year · Sem</th><th className="px-4 py-3 text-left">Acad Year</th><th className="px-4 py-3 text-left">Deadline</th><th className="px-4 py-3 text-center">Status</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {deadlines.map((d) => {
                    const passed = new Date() > new Date(d.deadline);
                    return (
                      <tr key={d._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">E{d.year} · S{d.semester}</td>
                        <td className="px-4 py-3 text-gray-600">{d.academicYear} · {d.regulation}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{new Date(d.deadline).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-center">
                          {!d.isOpen ? <span className="bg-gray-100 text-gray-500 badge text-xs">Closed</span>
                            : passed ? <span className="bg-red-100 text-red-600 badge text-xs">Expired</span>
                            : <span className="bg-green-100 text-green-700 badge text-xs">Open</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HOD DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function HodDashboard() {
  const { user } = useAuth();
  const dept = user?.department;
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats]         = useState(null);

  useEffect(() => {
    API.get("/hod/stats").then((r) => setStats(r.data)).catch(console.error);
  }, []);

  const tabs = [
    "overview",
    "subjects",
    "elective groups",
    "students",
    "upload attendance",
    "registrations",
    "elective requests",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="HOD Dashboard" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{dept} Department</h2>
          <p className="text-gray-500 text-sm mt-1">Manage subjects, elective groups, registrations and attendance</p>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-6">
          {tabs.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`tab-btn capitalize ${activeTab === t ? "tab-active" : "tab-inactive"}`}>
              {t === "registrations"      ? "📋 Registrations"
               : t === "elective requests" ? "✏️ Elective Requests"
               : t === "elective groups"   ? "Elective Groups"
               : t === "upload attendance" ? "📊 Upload Attendance"
               : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon="🎓" label="Total Students"  value={stats?.total}     color="red"    />
              <StatCard icon="✅" label="Active"          value={stats?.active}    color="green"  />
              <StatCard icon="🚫" label="Detained"        value={stats?.detained}  color="amber"  />
              <StatCard icon="🏆" label="Graduated"       value={stats?.graduated} color="purple" />
            </div>
            {stats?.yearBreakdown && (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-700 mb-4">Students by Year</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {stats.yearBreakdown.map((y) => (
                    <div key={y.year} className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                      <p className="text-2xl font-black text-brick-500">{y.count}</p>
                      <p className="text-xs text-gray-500 mt-1">Year {y.year}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-700 mb-3">Quick Actions</h3>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => setActiveTab("students")} className="btn-outline text-sm">View Students →</button>
                <button onClick={() => setActiveTab("upload attendance")} className="border border-blue-300 text-blue-600 hover:bg-blue-50 font-medium px-5 py-2.5 rounded-lg transition text-sm">📊 Upload Attendance →</button>
                <button onClick={() => setActiveTab("registrations")} className="border border-green-300 text-green-600 hover:bg-green-50 font-medium px-5 py-2.5 rounded-lg transition text-sm">View Registrations →</button>
                <button onClick={() => setActiveTab("elective requests")} className="border border-amber-300 text-amber-600 hover:bg-amber-50 font-medium px-5 py-2.5 rounded-lg transition text-sm">Elective Requests →</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "subjects"           && <RegulationTab dept={dept} />}
        {activeTab === "elective groups"    && <ElectiveGroupsTab dept={dept} />}
        {activeTab === "students"           && <StudentsTab dept={dept} />}
        {activeTab === "upload attendance"  && <UploadAttendanceTab dept={dept} />}
        {activeTab === "registrations"      && <RegistrationsTab dept={dept} />}
        {activeTab === "elective requests"  && <ElectiveRequestsTab dept={dept} />}
      </div>
    </div>
  );
}

export default HodDashboard;
