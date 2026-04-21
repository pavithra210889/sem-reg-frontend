import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import API from "../api";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const YR_LABEL  = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year" };
const SEM_LABEL = { 1: "Semester I", 2: "Semester II" };

const STATUS_CONFIG = {
  active:    { label: "Active",    cls: "badge-active" },
  detained:  { label: "Detained",  cls: "badge-detained" },
  graduated: { label: "Graduated", cls: "badge-graduated" },
};

const COURSE_TYPE_COLOR = {
  PCC:  "bg-blue-50 text-blue-700 border-blue-200",
  PEC:  "bg-purple-50 text-purple-700 border-purple-200",
  OEC:  "bg-teal-50 text-teal-700 border-teal-200",
  BSC:  "bg-green-50 text-green-700 border-green-200",
  ESC:  "bg-yellow-50 text-yellow-700 border-yellow-200",
  HSMC: "bg-pink-50 text-pink-700 border-pink-200",
  PR:   "bg-orange-50 text-orange-700 border-orange-200",
  MC:   "bg-gray-100 text-gray-700 border-gray-200",
  EAC:  "bg-indigo-50 text-indigo-700 border-indigo-200",
};

// ─────────────────────────────────────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value || "—"}</span>
    </div>
  );
}

function CourseTypeBadge({ type }) {
  const cls = COURSE_TYPE_COLOR[type] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${cls}`}>
      {type}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-brick-200 border-t-brick-500 rounded-full animate-spin" />
    </div>
  );
}

function AlertBox({ type = "info", title, children }) {
  const styles = {
    info:    "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-amber-50 border-amber-300 text-amber-800",
    error:   "bg-red-50 border-red-300 text-red-700",
    success: "bg-green-50 border-green-300 text-green-700",
  };
  const icons = { info: "ℹ️", warning: "⚠️", error: "🚫", success: "✅" };
  return (
    <div className={`border rounded-xl p-4 flex gap-3 ${styles[type]}`}>
      <span className="text-lg mt-0.5 shrink-0">{icons[type]}</span>
      <div>
        {title && <p className="font-semibold mb-1">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE SUBJECTS TABLE — read-only, auto-selected
// ─────────────────────────────────────────────────────────────────────────────

function CoreSubjectsTable({ subjects }) {
  if (!subjects || subjects.length === 0) return null;
  const totalCredits = subjects.reduce((s, c) => s + c.credits, 0);

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-gray-800">Core Subjects</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Pre-assigned by your department · cannot be changed
          </p>
        </div>
        <span className="bg-brick-100 text-brick-700 text-sm font-bold px-3 py-1 rounded-lg">
          {subjects.length} subjects · {totalCredits} credits
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left w-8">#</th>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Subject Name</th>
              <th className="px-4 py-3 text-center">Type</th>
              <th className="px-4 py-3 text-center">L-T-P</th>
              <th className="px-4 py-3 text-center">Credits</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {subjects.map((s, i) => (
              <tr key={s._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{s.code}</td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-800">{s.name}</span>
                  {s.isLab && (
                    <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                      Lab
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <CourseTypeBadge type={s.courseType} />
                </td>
                <td className="px-4 py-3 text-center text-xs text-gray-500 font-mono whitespace-nowrap">
                  {s.hours?.L ?? 0}-{s.hours?.T ?? 0}-{s.hours?.P ?? 0}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="bg-blue-50 text-blue-700 font-bold text-xs px-2 py-0.5 rounded">
                    {s.credits}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium whitespace-nowrap">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Auto-selected
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold text-sm">
              <td colSpan={5} className="px-4 py-3 text-right text-gray-600">
                Total Core Credits
              </td>
              <td className="px-4 py-3 text-center">
                <span className="bg-brick-100 text-brick-700 font-bold text-sm px-2 py-0.5 rounded">
                  {totalCredits}
                </span>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ELECTIVE GROUP CARD
// Student picks options within chooseLimit
// ─────────────────────────────────────────────────────────────────────────────

function ElectiveGroupCard({ group, selections, onSelect, disabled }) {
  const { electiveSlot, groupName, chooseLimit, options, configured } = group;
  const selected = selections[electiveSlot] || [];
  const count    = selected.length;
  const isFull   = count >= chooseLimit;
  const isValid  = count === chooseLimit;

  if (!configured) {
    return (
      <div className="card p-5 border-l-4 border-amber-400">
        <div className="flex items-start gap-3">
          <span className="text-amber-500 text-xl mt-0.5">⏳</span>
          <div>
            <p className="font-semibold text-gray-800">{electiveSlot}</p>
            <p className="text-sm text-amber-700 mt-1">
              Your HOD has not configured the options for this elective slot yet.
              Please check back later or contact your HOD.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card overflow-hidden border-l-4 ${isValid ? "border-green-400" : "border-brick-300"}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="font-semibold text-gray-800">{groupName}</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Slot: <span className="font-mono">{electiveSlot}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${
            isValid
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {count} / {chooseLimit} selected
          </span>
          {isValid && <span className="text-green-500 text-xl">✓</span>}
        </div>
      </div>

      {/* Options */}
      <div className="divide-y divide-gray-50">
        {options.map((opt) => {
          const isSelected  = selected.some((s) => s.code.toUpperCase() === opt.code.toUpperCase());
          const isDisabled  = disabled || (!isSelected && isFull);

          return (
            <label
              key={opt.code}
              className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                isSelected
                  ? "bg-green-50 cursor-pointer"
                  : isDisabled
                  ? "opacity-50 cursor-not-allowed bg-gray-50"
                  : "hover:bg-gray-50 cursor-pointer"
              }`}
            >
              <input
                type="checkbox"
                disabled={isDisabled}
                checked={isSelected}
                onChange={() => onSelect(electiveSlot, opt, chooseLimit)}
                className="w-4 h-4 accent-brick-500 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-800 text-sm">{opt.name}</span>
                <span className="ml-2 font-mono text-xs text-gray-400">{opt.code}</span>
              </div>
              <span className="bg-blue-50 text-blue-700 font-bold text-xs px-2 py-0.5 rounded shrink-0">
                {opt.credits} cr
              </span>
            </label>
          );
        })}
      </div>

      {/* Hint when incomplete */}
      {!disabled && !isValid && (
        <div className="px-5 py-2.5 bg-amber-50 border-t border-amber-100">
          <p className="text-xs text-amber-700">
            Select {chooseLimit - count} more subject{chooseLimit - count !== 1 ? "s" : ""} from this group
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREDITS SUMMARY SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

function CreditsSummary({ coreSubjects, electiveGroups, selections }) {
  const coreCredits = coreSubjects.reduce((s, c) => s + c.credits, 0);
  const electiveCredits = electiveGroups.reduce((total, grp) => {
    const sel = selections[grp.electiveSlot] || [];
    return total + sel.reduce((s, o) => s + o.credits, 0);
  }, 0);
  const totalCredits = coreCredits + electiveCredits;

  const allGroupsValid = electiveGroups.every((grp) => {
    if (!grp.configured) return false;
    const sel = selections[grp.electiveSlot] || [];
    return sel.length === grp.chooseLimit;
  });
  const hasUnconfigured = electiveGroups.some((g) => !g.configured);

  return (
    <div className="card p-5 space-y-4 sticky top-4">
      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
        <span>📊</span> Credits Summary
      </h3>

      <div className="space-y-2">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Core subjects</span>
          <span className="font-bold text-gray-800">{coreCredits} cr</span>
        </div>

        {electiveGroups.map((grp) => {
          const sel   = selections[grp.electiveSlot] || [];
          const selCr = sel.reduce((s, o) => s + o.credits, 0);
          const valid = grp.configured && sel.length === grp.chooseLimit;
          return (
            <div key={grp.electiveSlot} className="flex justify-between items-center py-1.5">
              <span className="text-sm text-gray-600 truncate max-w-[60%]" title={grp.electiveSlot}>
                {grp.electiveSlot}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                valid           ? "bg-green-100 text-green-700"
                : grp.configured ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-500"
              }`}>
                {grp.configured ? `${selCr} cr` : "Pending"}
              </span>
            </div>
          );
        })}

        <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
          <span className="font-bold text-gray-800">Total Credits</span>
          <span className="text-2xl font-black text-brick-600">{totalCredits}</span>
        </div>
      </div>

      {electiveGroups.length > 0 && (
        <div className={`rounded-xl p-3 text-sm ${
          hasUnconfigured   ? "bg-amber-50 text-amber-700"
          : allGroupsValid  ? "bg-green-50 text-green-700"
          : "bg-amber-50 text-amber-700"
        }`}>
          {hasUnconfigured
            ? "⏳ Some elective slots are not configured yet"
            : allGroupsValid
            ? "✅ All elective selections complete"
            : "⚠️ Complete all elective selections to submit"}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOAD PDF BUTTON — uses fetch (not Axios) to avoid blob interception
// ─────────────────────────────────────────────────────────────────────────────

function DownloadPdfButton({ registrationId }) {
  const [downloading, setDownloading] = useState(false);
  const [pdfError,    setPdfError]    = useState("");

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setPdfError("");

      // Use native fetch — Axios interceptors can mangle blob responses
      const token = localStorage.getItem("token");
      const base  = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL)
        ? import.meta.env.VITE_API_URL
        : "http://localhost:5000/api";

      const res = await fetch(`${base}/registration/download-pdf/${registrationId}`, {
        method:  "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok || !contentType.includes("application/pdf")) {
        const json = await res.json().catch(() => ({ message: "Failed to generate PDF" }));
        setPdfError(json.message || "Failed to generate PDF");
        return;
      }

      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `SemReg_${registrationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setPdfError("Failed to generate PDF. Check your connection and try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-brick-500 hover:bg-brick-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
      >
        {downloading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </>
        )}
      </button>
      {pdfError && <p className="text-xs text-red-500 max-w-[200px] text-right">{pdfError}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMITTED REGISTRATION VIEW — read-only table
// ─────────────────────────────────────────────────────────────────────────────

function SubmittedView({ registration, deadlineInfo, electiveGroups: passedGroups = [], onRequestSubmitted }) {
  if (!registration) return null;
  const core      = registration.subjects.filter((s) => s.type === "core");
  const electives = registration.subjects.filter((s) => s.type === "elective");

  // Fetch elective groups independently — passedGroups may be empty when reg window is closed
  const [electiveGroups, setElectiveGroups] = useState(passedGroups);
  const [groupsLoading,  setGroupsLoading]  = useState(false);

  useEffect(() => {
    // If we already have groups passed in, use them
    if (passedGroups.length > 0) { setElectiveGroups(passedGroups); return; }
    // Otherwise fetch directly using the student's registration details
    if (!registration.year || !registration.semester || !registration.regulation || !registration.department) return;
    setGroupsLoading(true);
    API.get("/elective-requests/my-elective-groups")
      .then((r) => {
        const normalized = (r.data.groups || []).map((g) => ({
          ...g,
          options:    g.electiveOptions || [],
          configured: (g.electiveOptions || []).length > 0,
        }));
        setElectiveGroups(normalized);
      })
      .catch(() => setElectiveGroups([]))
      .finally(() => setGroupsLoading(false));
  }, [registration._id, passedGroups.length]);

  return (
    <div className="space-y-4">
      <AlertBox type="success" title="Registration Submitted Successfully">
        Submitted on{" "}
        <strong>
          {new Date(registration.submittedAt).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </strong>
        {" — "}A confirmation email has been sent to your registered email address.
      </AlertBox>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-gray-800">Registered Subjects</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {registration.department} · E{registration.year}{" "}
              {SEM_LABEL[registration.semester]} · {registration.regulation} ·{" "}
              {registration.academicYear}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-brick-100 text-brick-700 font-bold text-sm px-3 py-1.5 rounded-lg">
              Total: {registration.totalCredits} credits
            </span>
            {registration._id && (
              <DownloadPdfButton registrationId={registration._id} />
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left w-8">#</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Subject Name</th>
                <th className="px-4 py-3 text-center">Category</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-center">Credits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {core.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{s.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-brick-100 text-brick-700 text-xs px-2 py-0.5 rounded">Core</span>
                  </td>
                  <td className="px-4 py-3 text-center"><CourseTypeBadge type={s.courseType} /></td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-blue-50 text-blue-700 font-bold text-xs px-2 py-0.5 rounded">{s.credits}</span>
                  </td>
                </tr>
              ))}
              {electives.map((s, i) => (
                <tr key={`e${i}`} className="hover:bg-purple-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{core.length + i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{s.code}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-800">{s.name}</span>
                    <span className="ml-2 text-xs text-purple-500">({s.electiveSlot})</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded">Elective</span>
                  </td>
                  <td className="px-4 py-3 text-center"><CourseTypeBadge type={s.courseType} /></td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-blue-50 text-blue-700 font-bold text-xs px-2 py-0.5 rounded">{s.credits}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={5} className="px-4 py-3 text-right text-gray-600">Total</td>
                <td className="px-4 py-3 text-center">
                  <span className="bg-brick-100 text-brick-700 font-bold px-2 py-0.5 rounded">
                    {registration.totalCredits}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    {/* Elective change panel — always shown when student has electives */}
    {electives.length > 0 && (groupsLoading || electiveGroups?.length > 0) && (
      <div className="card p-5 mt-2">
        <div className="mb-3 flex items-start justify-between flex-wrap gap-2">
          <div>
            <h4 className="font-semibold text-gray-800">✏️ Request Elective Change</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              {deadlineInfo === undefined
                ? "Checking change window status..."
                : deadlineInfo?.isOpen
                ? <>
                    Change window open until{" "}
                    <strong className="text-brick-600">
                      {new Date(deadlineInfo?.deadline?.deadline).toLocaleDateString("en-IN",
                        { day: "2-digit", month: "short", year: "numeric" })}
                    </strong>
                    {deadlineInfo?.deadline?.note && ` — ${deadlineInfo.deadline.note}`}
                  </>
                : ""}
            </p>
          </div>
          {deadlineInfo !== undefined && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
              deadlineInfo?.isOpen
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-gray-100 text-gray-500 border-gray-200"
            }`}>
              {deadlineInfo?.isOpen ? "🟢 Window Open" : "🔴 Window Closed"}
            </span>
          )}
        </div>

        {groupsLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
            <div className="w-4 h-4 border-2 border-brick-200 border-t-brick-500 rounded-full animate-spin" />
            Loading elective options...
          </div>
        ) : deadlineInfo?.isOpen ? (
          <ElectiveChangePanel
            registration={registration}
            electiveGroups={electiveGroups}
            onRequestSubmitted={onRequestSubmitted}
          />
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-500">
            ℹ️ The elective change window is closed. 
          </div>
        )}
      </div>
    )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRATION FORM — shown when window is open and student hasn't registered
// ─────────────────────────────────────────────────────────────────────────────

function RegistrationForm({ coreSubjects, electiveGroups, window: regWindow, onSuccess }) {
  const [selections,  setSelections]  = useState({});
  const [submitting,  setSubmitting]  = useState(false);
  const [errors,      setErrors]      = useState([]);
  const [submitError, setSubmitError] = useState("");

  const handleSelect = useCallback((slot, option, chooseLimit) => {
    setErrors([]);
    setSelections((prev) => {
      const current = prev[slot] || [];
      const already = current.some((s) => s.code.toUpperCase() === option.code.toUpperCase());

      if (already) {
        return { ...prev, [slot]: current.filter((s) => s.code.toUpperCase() !== option.code.toUpperCase()) };
      }
      if (current.length >= chooseLimit) {
        // If limit is 1, swap; otherwise do nothing (checkbox disabled)
        if (chooseLimit === 1) return { ...prev, [slot]: [option] };
        return prev;
      }
      return { ...prev, [slot]: [...current, option] };
    });
  }, []);

  const validate = () => {
    const errs = [];
    for (const grp of electiveGroups) {
      if (!grp.configured) {
        errs.push(`Elective slot "${grp.electiveSlot}" is not configured by your HOD yet.`);
        continue;
      }
      const sel = selections[grp.electiveSlot] || [];
      if (sel.length !== grp.chooseLimit) {
        errs.push(
          `"${grp.electiveSlot}": select exactly ${grp.chooseLimit} subject${grp.chooseLimit > 1 ? "s" : ""} (${sel.length} selected)`
        );
      }
    }
    return errs;
  };

  const handleSubmit = async () => {
    setSubmitError("");
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    try {
      setSubmitting(true);
      const res = await API.post("/registration/submit", { selectedElectives: selections });
      onSuccess(res.data.registration);
    } catch (err) {
      const msg         = err.response?.data?.message || "Submission failed. Please try again.";
      const backendErrs = err.response?.data?.errors  || [];
      setSubmitError(msg);
      if (backendErrs.length) setErrors(backendErrs);
    } finally {
      setSubmitting(false);
    }
  };

  const coreCredits = coreSubjects.reduce((s, c) => s + c.credits, 0);
  const electiveCreditsSelected = electiveGroups.reduce((total, grp) => {
    const sel = selections[grp.electiveSlot] || [];
    return total + sel.reduce((s, o) => s + o.credits, 0);
  }, 0);
  const totalSelected = coreCredits + electiveCreditsSelected;

  const allValid =
    electiveGroups.length === 0 ||
    electiveGroups.every((grp) => {
      if (!grp.configured) return false;
      const sel = selections[grp.electiveSlot] || [];
      return sel.length === grp.chooseLimit;
    });

  return (
    <div className="space-y-6">

      {/* Window open banner */}
      <div className="bg-green-50 border border-green-300 rounded-xl p-4 flex items-start gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse mt-1.5 shrink-0" />
        <div>
          <p className="font-semibold text-green-800">Registration Window is Open</p>
          <p className="text-green-700 text-sm mt-0.5">
            Academic Year: <strong>{regWindow?.academicYear}</strong>
            {regWindow?.deadline && (
              <>
                {" · "}Deadline:{" "}
                <strong>
                  {new Date(regWindow.deadline).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </strong>
              </>
            )}
          </p>
          {regWindow?.note && (
            <p className="text-green-600 text-xs mt-1">{regWindow.note}</p>
          )}
        </div>
      </div>

      {/* Validation errors */}
      {(errors.length > 0 || submitError) && (
        <AlertBox type="error" title={submitError || "Please fix the following before submitting:"}>
          {errors.length > 0 && (
            <ul className="list-disc list-inside space-y-1 mt-1">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </AlertBox>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Subject selection — takes 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-6">

          <CoreSubjectsTable subjects={coreSubjects} />

          {electiveGroups.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800">Elective Subjects</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select the required number of subjects from each group below.
                </p>
              </div>
              {electiveGroups.map((grp) => (
                <ElectiveGroupCard
                  key={grp.electiveSlot}
                  group={grp}
                  selections={selections}
                  onSelect={handleSelect}
                  disabled={submitting}
                />
              ))}
            </div>
          )}

          {/* Submit bar */}
          <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-800">Ready to submit?</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Total credits:{" "}
                <strong className="text-brick-600">{totalSelected}</strong>
                {!allValid && electiveGroups.length > 0 && (
                  <span className="text-amber-600 ml-2">— complete all elective selections first</span>
                )}
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || !allValid}
              className="btn-primary shrink-0 text-base px-8 py-3 disabled:opacity-40"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit Registration"
              )}
            </button>
          </div>
        </div>

        {/* Credits summary sidebar */}
        <div className="lg:col-span-1">
          <CreditsSummary
            coreSubjects={coreSubjects}
            electiveGroups={electiveGroups}
            selections={selections}
          />
        </div>
      </div>

    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// ELECTIVE CHANGE REQUEST PANEL
// Shown inside SubmittedView when the change window is open.
// Student picks new electives per slot and submits a request to HOD.
// ─────────────────────────────────────────────────────────────────────────────

function ElectiveChangePanel({ registration, electiveGroups, onRequestSubmitted }) {
  const [open,       setOpen]       = useState(false);
  const [selections, setSelections] = useState({});
  const [reason,     setReason]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg,        setMsg]        = useState({ text: "", type: "" });

  // Pre-populate with current electives when panel opens
  const handleOpen = () => {
    const pre = {};
    registration.subjects
      .filter((s) => s.type === "elective")
      .forEach((s) => {
        if (!pre[s.electiveSlot]) pre[s.electiveSlot] = [];
        pre[s.electiveSlot].push({ code: s.code, name: s.name, credits: s.credits });
      });
    setSelections(pre);
    setOpen(true);
    setMsg({ text: "", type: "" });
  };

  const handleSelect = (slot, option, chooseLimit) => {
    setSelections((prev) => {
      const current = prev[slot] || [];
      const already = current.some((s) => s.code.toUpperCase() === option.code.toUpperCase());
      if (already) return { ...prev, [slot]: current.filter((s) => s.code.toUpperCase() !== option.code.toUpperCase()) };
      if (current.length >= chooseLimit) {
        if (chooseLimit === 1) return { ...prev, [slot]: [option] };
        return prev;
      }
      return { ...prev, [slot]: [...current, option] };
    });
  };

  const handleSubmit = async () => {
    setMsg({ text: "", type: "" });

    // Build flat array of requested electives
    const requestedElectives = [];
    for (const grp of electiveGroups) {
      if (!grp.configured) {
        setMsg({ text: `Elective slot "${grp.electiveSlot}" is not configured. Contact HOD.`, type: "error" });
        return;
      }
      const sel = selections[grp.electiveSlot] || [];
      if (sel.length !== grp.chooseLimit) {
        setMsg({ text: `"${grp.electiveSlot}": select exactly ${grp.chooseLimit} subject(s)`, type: "error" });
        return;
      }
      sel.forEach((s) => requestedElectives.push({
        electiveSlot: grp.electiveSlot,
        code:         s.code,
        name:         s.name,
        credits:      s.credits,
        courseType:   grp.courseType || "PEC",
      }));
    }

    try {
      setSubmitting(true);
      await API.post("/elective-requests/submit", {
        registrationId:    registration._id,
        requestedElectives,
        reason,
      });
      setMsg({ text: "Request submitted! Your HOD will review it and you will receive an email.", type: "success" });
      setOpen(false);
      onRequestSubmitted?.();
    } catch (e) {
      setMsg({ text: e.response?.data?.message || "Submission failed", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (electiveGroups.length === 0) return null;

  return (
    <div className="mt-4">
      {!open ? (
        <button
          onClick={handleOpen}
          className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-brick-400
                     text-brick-600 hover:bg-brick-50 text-sm font-semibold rounded-lg transition"
        >
          ✏️ Request Elective Change
        </button>
      ) : (
        <div className="card border-2 border-brick-300 p-5 space-y-5 mt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">Request Elective Change</h4>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
          </div>

          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            ⚠️ Only elective subjects can be changed. Core subjects are fixed.
            Your request will be reviewed by your HOD.
          </p>

          {/* Elective group selectors */}
          <div className="space-y-4">
            {electiveGroups.map((grp) => {
              const sel   = selections[grp.electiveSlot] || [];
              const count = sel.length;
              const valid = count === grp.chooseLimit;

              if (!grp.configured) {
                return (
                  <div key={grp.electiveSlot} className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                    ⏳ Slot "{grp.electiveSlot}" not configured by HOD yet.
                  </div>
                );
              }

              return (
                <div key={grp.electiveSlot}
                  className={`card overflow-hidden border-l-4 ${valid ? "border-green-400" : "border-amber-400"}`}>
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{grp.groupName}</p>
                      <p className="text-xs text-gray-500 mt-0.5 font-mono">{grp.electiveSlot}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                      valid ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {count}/{grp.chooseLimit} selected {valid ? "✓" : ""}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {grp.options.map((opt) => {
                      const isSelected = sel.some((s) => s.code.toUpperCase() === opt.code.toUpperCase());
                      const isFull     = count >= grp.chooseLimit;
                      const isDisabled = !isSelected && isFull;
                      return (
                        <label key={opt.code}
                          className={`flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition-colors ${
                            isSelected ? "bg-green-50" : isDisabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:bg-gray-50"
                          }`}>
                          <input type="checkbox" checked={isSelected} disabled={isDisabled}
                            onChange={() => handleSelect(grp.electiveSlot, opt, grp.chooseLimit)}
                            className="w-4 h-4 accent-brick-500 shrink-0" />
                          <span className="flex-1">
                            <span className="font-medium text-gray-800">{opt.name}</span>
                            <span className="ml-2 font-mono text-xs text-gray-400">{opt.code}</span>
                          </span>
                          <span className="bg-blue-50 text-blue-700 font-bold text-xs px-2 py-0.5 rounded shrink-0">
                            {opt.credits} cr
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly explain why you want to change..."
              className="input-field h-20 resize-none text-sm"
            />
          </div>

          {/* Message */}
          {msg.text && (
            <div className={`rounded-lg px-4 py-3 text-sm flex items-start gap-2 ${
              msg.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}>
              <span>{msg.type === "success" ? "✓" : "⚠"}</span>
              <span>{msg.text}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary disabled:opacity-40"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : "Submit Request to HOD"}
            </button>
            <button onClick={() => setOpen(false)} className="btn-outline">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MY CHANGE REQUESTS — shown in history tab
// ─────────────────────────────────────────────────────────────────────────────

function MyChangeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    API.get("/elective-requests/my-requests")
      .then((r) => setRequests(r.data.requests || []))
      .catch((e) => setError(e.response?.data?.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const STATUS_STYLE = {
    pending:  "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-brick-200 border-t-brick-500 rounded-full animate-spin" /></div>;
  if (error)   return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>;
  if (requests.length === 0) return <p className="text-sm text-gray-400 italic">No elective change requests yet.</p>;

  return (
    <div className="space-y-3 mt-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">My Elective Change Requests</p>
      {requests.map((req) => (
        <div key={req._id} className="card p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {req.department} · E{req.year} {SEM_LABEL[req.semester]} · {req.academicYear}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Submitted {new Date(req.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
            <span className={`badge text-xs px-3 py-1 font-semibold capitalize ${STATUS_STYLE[req.status]}`}>
              {req.status}
            </span>
          </div>

          {/* Before / After */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-semibold text-gray-500 mb-2 uppercase tracking-wide text-xs">Previous</p>
              {req.currentElectives.map((e, i) => (
                <p key={i} className="text-gray-700">
                  <span className="font-mono text-gray-400 mr-1">{e.code}</span>{e.name}
                </p>
              ))}
            </div>
            <div className={`rounded-lg p-3 ${req.status === "approved" ? "bg-green-50" : req.status === "rejected" ? "bg-red-50" : "bg-blue-50"}`}>
              <p className="font-semibold mb-2 uppercase tracking-wide text-xs text-gray-500">Requested</p>
              {req.requestedElectives.map((e, i) => (
                <p key={i} className={req.status === "approved" ? "text-green-700" : req.status === "rejected" ? "text-red-600" : "text-blue-700"}>
                  <span className="font-mono opacity-70 mr-1">{e.code}</span>{e.name}
                </p>
              ))}
            </div>
          </div>

          {/* HOD remark if rejected */}
          {req.status === "rejected" && req.hodRemark && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
              <strong>HOD Remark:</strong> {req.hodRemark}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAST REGISTRATIONS — history tab
// ─────────────────────────────────────────────────────────────────────────────

function PastRegistrations() {
  const [regs,     setRegs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    API.get("/registration/my-registrations")
      .then((r) => setRegs(r.data.registrations))
      .catch((e) => setError(e.response?.data?.message || "Failed to load history"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error)   return <AlertBox type="error">{error}</AlertBox>;
  if (regs.length === 0) {
    return (
      <AlertBox type="info" title="No past registrations">
        You have no submitted registrations on record yet.
      </AlertBox>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">{regs.length} registration(s) found</p>
      {regs.map((reg) => (
        <div key={reg._id} className="card overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === reg._id ? null : reg._id)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition text-left"
          >
            <div>
              <p className="font-semibold text-gray-800">
                E{reg.year} {SEM_LABEL[reg.semester]} — {reg.academicYear}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {reg.department} · {reg.regulation} · {reg.subjects.length} subjects ·{" "}
                {reg.totalCredits} credits
                {reg.repeat && (
                  <span className="ml-2 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs">
                    Repeat
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-gray-400">
                {new Date(reg.submittedAt).toLocaleDateString("en-IN")}
              </span>
              <span className="text-gray-400">{expanded === reg._id ? "▲" : "▼"}</span>
            </div>
          </button>
          {expanded === reg._id && (
            <div className="border-t border-gray-100 p-5">
              <SubmittedView registration={reg} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE REQUEST TAB — dedicated tab for elective change requests
// ─────────────────────────────────────────────────────────────────────────────

function ChangeRequestTab({ registration, deadlineInfo, onRequestSubmitted }) {
  const [electiveGroups, setElectiveGroups] = useState([]);
  const [groupsLoading,  setGroupsLoading]  = useState(true);
  const [hasUsedChange,  setHasUsedChange]  = useState(false);
  const [usedChangeReq,  setUsedChangeReq]  = useState(null);
  const [myRequests,     setMyRequests]     = useState([]);
  const [reqLoading,     setReqLoading]     = useState(true);

  const STATUS_STYLE = {
    pending:  "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-green-100 text-green-700 border-green-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };

  // Fetch elective groups — also returns one-chance status
  const fetchGroups = () => {
    setGroupsLoading(true);
    API.get("/elective-requests/my-elective-groups")
      .then((r) => {
        const normalized = (r.data.groups || []).map((g) => ({
          ...g,
          options:    g.electiveOptions || [],
          configured: (g.electiveOptions || []).length > 0,
        }));
        setElectiveGroups(normalized);
        setHasUsedChange(r.data.hasUsedChange || false);
        setUsedChangeReq(r.data.changeRequest || null);
      })
      .catch(() => setElectiveGroups([]))
      .finally(() => setGroupsLoading(false));
  };

  useEffect(() => { fetchGroups(); }, [registration?._id]);

  // Fetch my past change requests
  const fetchMyRequests = () => {
    setReqLoading(true);
    API.get("/elective-requests/my-requests")
      .then((r) => setMyRequests(r.data.requests || []))
      .catch(() => setMyRequests([]))
      .finally(() => setReqLoading(false));
  };
  useEffect(() => { fetchMyRequests(); }, []);

  const handleRequestSubmitted = () => {
    fetchMyRequests();
    fetchGroups();       // re-check one-chance status
    onRequestSubmitted?.();
  };

  const isOpen   = deadlineInfo?.isOpen;
  const deadline = deadlineInfo?.deadline?.deadline;
  const note     = deadlineInfo?.deadline?.note;

  return (
    <div className="space-y-5">

      {/* Window status banner */}
      <div className={`rounded-xl p-4 border flex items-start gap-3 ${
        deadlineInfo === undefined ? "bg-gray-50 border-gray-200"
        : isOpen ? "bg-green-50 border-green-300"
        : "bg-amber-50 border-amber-300"
      }`}>
        <span className="text-xl mt-0.5 shrink-0">
          {deadlineInfo === undefined ? "⏳" : isOpen ? "🟢" : "🔴"}
        </span>
        <div>
          <p className={`font-semibold text-sm ${
            deadlineInfo === undefined ? "text-gray-600"
            : isOpen ? "text-green-800"
            : "text-amber-800"
          }`}>
            {deadlineInfo === undefined
              ? "Checking window status..."
              : isOpen
              ? "Elective Change Window is Open"
              : "Elective Change Window is Closed"}
          </p>
          {isOpen && deadline && (
            <p className="text-xs text-green-700 mt-0.5">
              Deadline:{" "}
              <strong>
                {new Date(deadline).toLocaleDateString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </strong>
              {note && ` — ${note}`}
            </p>
          )}
          {!isOpen && deadlineInfo !== undefined && (
            <p className="text-xs text-amber-700 mt-0.5">
              Contact your HOD to open the change window.
            </p>
          )}
        </div>
      </div>

      {/* Current electives summary */}
      {(() => {
        const electives = registration.subjects.filter((s) => s.type === "elective");
        if (electives.length === 0) return (
          <AlertBox type="info" title="No Electives">
            Your registration has no elective subjects. Only electives can be changed.
          </AlertBox>
        );
        return (
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">Your Current Electives</p>
              <p className="text-xs text-gray-400 mt-0.5">These are the electives in your submitted registration</p>
            </div>
            <div className="divide-y divide-gray-50">
              {electives.map((s, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-medium text-gray-800 text-sm">{s.name}</span>
                    <span className="ml-2 font-mono text-xs text-gray-400">{s.code}</span>
                    <span className="ml-2 text-xs text-purple-500">({s.electiveSlot})</span>
                  </div>
                  <span className="bg-blue-50 text-blue-700 font-bold text-xs px-2 py-0.5 rounded shrink-0">
                    {s.credits} cr
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Change request panel */}
      {groupsLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
          <div className="w-4 h-4 border-2 border-brick-200 border-t-brick-500 rounded-full animate-spin" />
          Loading elective options...
        </div>
      ) : electiveGroups.length === 0 ? (
        <AlertBox type="warning" title="No Elective Groups Configured">
          Your HOD has not configured elective groups for your batch yet. Contact your HOD.
        </AlertBox>
      ) : hasUsedChange ? (
        <div className={`rounded-xl border p-5 ${
          usedChangeReq?.status === "pending"  ? "bg-amber-50 border-amber-300"
          : usedChangeReq?.status === "approved" ? "bg-green-50 border-green-300"
          : "bg-red-50 border-red-300"
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">
              {usedChangeReq?.status === "pending" ? "⏳"
               : usedChangeReq?.status === "approved" ? "✅" : "❌"}
            </span>
            <div>
              <p className={`font-semibold text-sm ${
                usedChangeReq?.status === "pending"  ? "text-amber-800"
                : usedChangeReq?.status === "approved" ? "text-green-800"
                : "text-red-800"
              }`}>
                {usedChangeReq?.status === "pending"
                  ? "Change Request Submitted — Awaiting HOD Review"
                  : usedChangeReq?.status === "approved"
                  ? "Change Request Approved"
                  : "Change Request Rejected"}
              </p>
              <p className={`text-xs mt-1.5 leading-relaxed ${
                usedChangeReq?.status === "pending"  ? "text-amber-700"
                : usedChangeReq?.status === "approved" ? "text-green-700"
                : "text-red-700"
              }`}>
                {usedChangeReq?.status === "pending"
                  ? "You have already submitted your one allowed change request. Please wait for your HOD to approve or reject it."
                  : usedChangeReq?.status === "approved"
                  ? "Your elective change has been approved and your registration has been updated. You have used your one allowed change."
                  : "Your change request was rejected by your HOD. You have used your one allowed change request for this semester."}
              </p>
              {usedChangeReq?.createdAt && (
                <p className="text-xs text-gray-500 mt-2">
                  Submitted on {new Date(usedChangeReq.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : isOpen ? (
        <div className="card p-5">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
            <span className="text-amber-500 text-lg shrink-0">⚠️</span>
            <p className="text-sm text-amber-800">
              <strong>One chance only.</strong> You are allowed to submit only one elective change
              request per semester. Choose carefully before submitting.
            </p>
          </div>
          <ElectiveChangePanel
            registration={registration}
            electiveGroups={electiveGroups}
            onRequestSubmitted={handleRequestSubmitted}
          />
        </div>
      ) : null}

      {/* My past requests */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          My Change Request History
        </p>
        {reqLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-4 border-brick-200 border-t-brick-500 rounded-full animate-spin" />
          </div>
        ) : myRequests.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No change requests submitted yet.</p>
        ) : (
          myRequests.map((req) => (
            <div key={req._id} className="card p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {req.department} · E{req.year} {SEM_LABEL[req.semester]} · {req.academicYear}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Submitted {new Date(req.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-lg border capitalize ${STATUS_STYLE[req.status]}`}>
                  {req.status}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-semibold text-gray-500 mb-2 uppercase tracking-wide">Previous</p>
                  {req.currentElectives.map((e, i) => (
                    <p key={i} className="text-gray-700 py-0.5">
                      <span className="font-mono text-gray-400 mr-1">{e.code}</span>{e.name}
                    </p>
                  ))}
                </div>
                <div className={`rounded-lg p-3 ${
                  req.status === "approved" ? "bg-green-50"
                  : req.status === "rejected" ? "bg-red-50"
                  : "bg-blue-50"
                }`}>
                  <p className="font-semibold mb-2 uppercase tracking-wide text-gray-500">Requested</p>
                  {req.requestedElectives.map((e, i) => (
                    <p key={i} className={`py-0.5 ${
                      req.status === "approved" ? "text-green-700"
                      : req.status === "rejected" ? "text-red-600"
                      : "text-blue-700"
                    }`}>
                      <span className="font-mono opacity-70 mr-1">{e.code}</span>{e.name}
                    </p>
                  ))}
                </div>
              </div>
              {req.status === "rejected" && req.hodRemark && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
                  <strong>HOD Remark:</strong> {req.hodRemark}
                </div>
              )}
              {req.status === "approved" && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
                  ✅ Approved — your registration has been updated with the new electives.
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT: STUDENT DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { user } = useAuth();

  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState("");
  const [data,         setData]         = useState(null);
  const [submitted,    setSubmitted]    = useState(null);
  const [activeTab,    setActiveTab]    = useState("registration");
  const [deadlineInfo, setDeadlineInfo] = useState(undefined); // undefined=not fetched, null=none

  const status     = STATUS_CONFIG[user?.academicStatus] || STATUS_CONFIG.active;
  const isDetained = user?.academicStatus === "detained";
  const profileOk  = !!(user?.year && user?.semester && user?.regulation && user?.department);

  // Change Request tab visible only: after submission + HOD window open + deadline not passed
  const changeWindowOpen =
    !!submitted &&
    deadlineInfo?.isOpen === true &&
    !!deadlineInfo?.deadline?.deadline &&
    new Date() < new Date(deadlineInfo.deadline.deadline);

  const loadSubjects = useCallback(async () => {
    if (!profileOk) { setLoading(false); return; }
    try {
      setLoading(true);
      setLoadError("");
      const [subRes, dlRes] = await Promise.allSettled([
        API.get("/registration/my-subjects"),
        API.get("/elective-requests/deadline"),
      ]);
      if (subRes.status === "fulfilled") {
        setData(subRes.value.data);
        if (subRes.value.data.existingReg) {
          setSubmitted(subRes.value.data.existingReg);
          setActiveTab("submitted");
        }
      } else {
        throw new Error(subRes.reason?.response?.data?.message || "Failed to load data");
      }
      if (dlRes.status === "fulfilled") {
        setDeadlineInfo(dlRes.value.data);
      } else {
        setDeadlineInfo(null);
      }
    } catch (err) {
      setLoadError(err.message || "Failed to load registration data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [profileOk]);

  useEffect(() => { loadSubjects(); }, [loadSubjects]);

  const handleSuccess = (registration) => {
    setSubmitted(registration);
    setActiveTab("submitted");
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Called when a change request is submitted — re-fetch registration + deadline
  const handleChangeRequestSubmitted = useCallback(async () => {
    try {
      const [subRes, dlRes] = await Promise.allSettled([
        API.get("/registration/my-subjects"),
        API.get("/elective-requests/deadline"),
      ]);
      if (subRes.status === "fulfilled") {
        setData(subRes.value.data);
        if (subRes.value.data.existingReg) {
          setSubmitted(subRes.value.data.existingReg);
        }
      }
      if (dlRes.status === "fulfilled") {
        setDeadlineInfo(dlRes.value.data);
      }
    } catch { /* ignore */ }
  }, []);

  const semLabel = user?.year && user?.semester
    ? `${YR_LABEL[user.year]} · ${SEM_LABEL[user.semester]}`
    : "—";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Student Portal" />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Welcome banner */}
        <div className="bg-brick-500 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-brick-100 text-sm font-medium mb-1">Welcome back 👋</p>
            <h2 className="text-2xl font-bold">{user?.name || user?.email}</h2>
            <p className="text-brick-100 text-sm mt-1">
              {user?.rollNumber && <span>{user.rollNumber} · </span>}
              {user?.department} · {user?.regulation || "—"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`badge ${status.cls} text-sm px-3 py-1`}>{status.label}</span>
            <span className="text-brick-200 text-sm">{semLabel}</span>
          </div>
        </div>

        {/* Detained warning */}
        {isDetained && (
          <AlertBox type="error" title="Registration Blocked — Detained">
            Your account has been marked as <strong>detained</strong>. You cannot register
            for this semester. Contact your HOD or the academic section.
          </AlertBox>
        )}

        {/* Profile incomplete */}
        {!profileOk && (
          <AlertBox type="warning" title="Profile Incomplete">
            Your academic profile is missing required fields (year / semester / regulation).
            Contact your HOD or the academic section to update your profile before registering.
          </AlertBox>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* Profile sidebar */}
          <div className="md:col-span-1">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brick-100 flex items-center justify-center shrink-0">
                  <span className="text-brick-500 font-bold text-lg">
                    {(user?.name || user?.email || "?")[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">My Profile</h3>
                  <p className="text-xs text-gray-500">Academic info</p>
                </div>
              </div>
              <InfoRow label="Roll No."   value={user?.rollNumber} />
              <InfoRow label="Department" value={user?.department} />
              <InfoRow label="Year"       value={user?.year ? YR_LABEL[user.year] : null} />
              <InfoRow label="Semester"   value={user?.semester ? SEM_LABEL[user.semester] : null} />
              <InfoRow label="Regulation" value={user?.regulation} />
              <InfoRow
                label="Status"
                value={<span className={`badge ${status.cls}`}>{status.label}</span>}
              />
            </div>
          </div>

          {/* Main content */}
          <div className="md:col-span-3 space-y-4">

            {/* Tab nav */}
            <div className="flex border-b border-gray-200 gap-1 flex-wrap">
              {[
                { id: "registration", label: "📋 Registration" },
                { id: "history",      label: "📜 History" },
              ].map((t) => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`tab-btn ${activeTab === t.id ? "tab-active" : "tab-inactive"}`}>
                  {t.label}
                </button>
              ))}
              {submitted && (
                <button onClick={() => setActiveTab("submitted")}
                  className={`tab-btn ${activeTab === "submitted" ? "tab-active" : "tab-inactive"}`}>
                  ✅ Submitted
                </button>
              )}
              {changeWindowOpen && (
                <button onClick={() => setActiveTab("change-request")}
                  className={`tab-btn ${activeTab === "change-request" ? "tab-active" : "tab-inactive"}`}>
                  ✏️ Change Request
                  <span className="ml-1.5 w-2 h-2 rounded-full bg-green-500 inline-block" />
                </button>
              )}
            </div>

            {/* Registration tab */}
            {activeTab === "registration" && (
              <>
                {!profileOk && (
                  <AlertBox type="warning" title="Complete your profile first">
                    Your year, semester, or regulation is not set. Contact your HOD.
                  </AlertBox>
                )}

                {profileOk && loading && <Spinner />}

                {profileOk && !loading && loadError && (
                  <AlertBox type="error" title="Failed to load">
                    {loadError}
                    <button onClick={loadSubjects} className="mt-2 btn-outline text-xs px-3 py-1.5 block">
                      Retry
                    </button>
                  </AlertBox>
                )}

                {profileOk && !loading && !loadError && data && (
                  <>
                    {/* Window not opened at all */}
                    {data.windowStatus === "not_configured" && !submitted && (
                      <AlertBox type="info" title="Registration Not Yet Opened">
                        The Super Admin has not opened a registration window for your
                        batch ({user?.regulation} · E{user?.year} Sem {user?.semester}) yet.
                        You will be notified when registration opens.
                      </AlertBox>
                    )}

                    {/* Window exists but closed */}
                    {data.windowStatus === "closed" && !submitted && (
                      <AlertBox type="warning" title="Registration Window is Closed">
                        The registration window for your batch has been closed by the academic section.
                        {data.existingReg
                          ? " You have already submitted your registration (see the ✅ Submitted tab)."
                          : " Please wait for it to reopen."}
                      </AlertBox>
                    )}

                    {/* Already submitted */}
                    {submitted && <SubmittedView registration={submitted} />}

                    {/* Window open + not detained + not submitted */}
                    {data.windowStatus === "open" && !isDetained && !submitted && (
                      <>
                        {data.coreSubjects.length === 0 && data.electiveGroups.length === 0 ? (
                          <AlertBox type="warning" title="No Subjects Found">
                            No subjects are configured for {user?.department} ·{" "}
                            {user?.regulation} · E{user?.year} Sem {user?.semester}.
                            Ask your HOD to seed the regulation data.
                          </AlertBox>
                        ) : (
                          <RegistrationForm
                            coreSubjects={data.coreSubjects}
                            electiveGroups={data.electiveGroups}
                            window={data.window}
                            onSuccess={handleSuccess}
                          />
                        )}
                      </>
                    )}

                    {/* Window open but detained */}
                    {data.windowStatus === "open" && isDetained && (
                      <AlertBox type="error" title="Cannot Register — Detained">
                        The registration window is open, but your account is detained.
                        Contact your HOD to resolve this before the window closes.
                      </AlertBox>
                    )}
                  </>
                )}
              </>
            )}

            {/* Submitted tab */}
            {activeTab === "submitted" && (
              submitted
                ? <SubmittedView registration={submitted} deadlineInfo={deadlineInfo} electiveGroups={data?.electiveGroups ?? []} onRequestSubmitted={handleChangeRequestSubmitted} />
                : <AlertBox type="info" title="No submission yet">
                    You have not submitted your registration for this semester.
                  </AlertBox>
            )}

            {/* History tab */}
            {activeTab === "history" && (
              <div className="space-y-6">
                <PastRegistrations />
                <MyChangeRequests />
              </div>
            )}

            {/* Change Request tab */}
            {activeTab === "change-request" && (
              changeWindowOpen
                ? <ChangeRequestTab
                    registration={submitted}
                    deadlineInfo={deadlineInfo}
                    onRequestSubmitted={handleChangeRequestSubmitted}
                  />
                : <AlertBox type="warning" title="Change Request Window is Closed">
                    The elective change window is currently closed or the deadline has passed.
                    Contact your HOD if you need to make changes.
                  </AlertBox>
            )}

          </div>
        </div>

        {/* Info notice */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>📌</span> Important Information
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              "Semester registration is opened by the Academic Section. Watch for announcements.",
              "Core subjects are automatically assigned based on your department, year, and regulation.",
              "Elective options are configured by your HOD before registration opens.",
              "Once submitted, your registration is final for this semester.",
              "For profile updates or issues, contact your HOD or websupport@rguktrkv.ac.in",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-brick-400 mt-0.5 shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}