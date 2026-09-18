"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FilePlus2,
  FolderOpen,
  LogOut,
  Menu,
  Plus,
  Search,
  Shield,
  Users,
  UserCog,
  X,
} from "lucide-react";
import {
  canManageArchive,
  canManageAttendance,
  isConfiguredSuperAdmin,
  roleLabels,
  roleOptions,
} from "@/lib/permissions";

type User = { id: string; name: string; email: string; role: string };
type Member = {
  id: string;
  fullName: string;
  studentId: string;
  department?: string | null;
  level?: string | null;
  clubRole?: string | null;
  attendance: { status: string }[];
};
type Session = {
  id: string;
  name: string;
  date: string;
  meetingType: string;
  location?: string | null;
  attendance: { memberId: string; status: string }[];
};
type ArchiveItem = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  category: string;
  year: number;
  semester?: string | null;
  production?: string | null;
  confidentiality: string;
  uploadedBy: { name: string };
  createdAt: string;
};

const attendanceLabels: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EXCUSED: "Excused",
};

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [signingUp, setSigningUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [birthday, setBirthday] = useState("");
  const [course, setCourse] = useState("");
  const [level, setLevel] = useState("");
  const [hostel, setHostel] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    if (signingUp && password !== confirmPassword) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      const endpoint = signingUp ? "/api/auth/signup" : "/api/auth/login";
      const body = signingUp
        ? { fullName: name, email, department, birthday, course, level, hostel, pronouns, gender, password, confirmPassword }
        : { email, password };
      const data = await requestJson(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onLogin(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue.");
    } finally {
      setBusy(false);
    }
  }
  const signingUpAsAdmin = signingUp && isConfiguredSuperAdmin(email);
  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand-mark">PAU Drama Club</div>
        <p className="eyebrow">Attendance and archive workspace</p>
        <h1>{signingUp ? "Join the club." : "Welcome back."}</h1>
        <p className="muted">
          {signingUp
            ? "Create your member account to access attendance and club updates."
            : "Sign in to work with the club's attendance and digital archive."}
        </p>
        <form onSubmit={submit} className="stack">
          {signingUp && !signingUpAsAdmin && (
            <label>
              Full name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
              />
            </label>
          )}
          {signingUp && !signingUpAsAdmin && (
            <>
              <label>
                Department
                <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Your department" required />
              </label>
              <div className="form-row">
                <label>
                  Birthday
                  <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Course
                  <input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Your course" required />
                </label>
                <label>
                  Level
                  <input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="e.g. 300 level" required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Hostel
                  <input value={hostel} onChange={(e) => setHostel(e.target.value)} placeholder="Hostel" required />
                </label>
                <label>
                  Gender
                  <input value={gender} onChange={(e) => setGender(e.target.value)} placeholder="Gender" required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Pronouns
                  <input value={pronouns} onChange={(e) => setPronouns(e.target.value)} placeholder="e.g. she/her" required />
                </label>
              </div>
            </>
          )}
          <label>
            PAU email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@pau.edu.ng"
              required
            />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={signingUp ? "At least 12 characters" : "Your password"}
                minLength={signingUp ? 12 : undefined}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
          {signingUp && (
            <label>
              Confirm password
              <div className="password-field">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  minLength={12}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
          )}
          {error && <p className="error-text">{error}</p>}
          <button
            className="button primary full"
            disabled={busy}
          >
            {busy
              ? "Please wait..."
              : signingUp
                ? signingUpAsAdmin ? "Create Super Admin account" : "Create member account"
                : "Sign in"}
          </button>
          {!signingUp && (
            <button type="button" className="text-button auth-switch" onClick={() => { setSigningUp(true); setError(""); }}>
              New club member? Create an account
            </button>
          )}
          {signingUp && (
            <button type="button" className="text-button auth-switch" onClick={() => { setSigningUp(false); setError(""); }}>
              Already have an account? Sign in
            </button>
          )}
        </form>
      </section>
      <aside className="login-aside">
        <div>
          <Shield size={22} />
          <p>Private by design</p>
          <span>
            Role-based access keeps attendance and archive records in the right
            hands.
          </span>
        </div>
        <div>
          <FolderOpen size={22} />
          <p>Built for handover</p>
          <span>
            Structured records make the next executive team's first week much
            easier.
          </span>
        </div>
      </aside>
    </main>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  async function refreshUser() {
    try {
      const data = await requestJson("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }
  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    function handleFocus() {
      if (document.visibilityState === "visible") void refreshUser();
    }
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);
  if (loading)
    return <div className="loading-screen">Loading workspace...</div>;
  if (!user) return <Login onLogin={setUser} />;
  return (
    <Workspace
      user={user}
      onUserUpdate={setUser}
      onLogout={() => {
        fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
      }}
    />
  );
}

function Workspace({ user, onLogout, onUserUpdate }: { user: User; onLogout: () => void; onUserUpdate: (user: User) => void }) {
  const [view, setView] = useState<
    "attendance" | "archive" | "members" | "access"
  >("attendance");
  const [overview, setOverview] = useState<any>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const canEditAttendance = canManageAttendance(user.role);
  const canEditArchive = canManageArchive(user.role);
  useEffect(() => {
    if (user.role !== "SUPER_ADMIN" && view === "access") setView("attendance");
  }, [user.role, view]);
  async function refresh() {
    try {
      setOverview(await requestJson("/api/overview"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load workspace.",
      );
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  async function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(""), 3500);
    await refresh();
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">PAU Drama Club</div>
        <div className="side-copy">
          <p className="eyebrow">Drama Club</p>
          <h2>Workspace</h2>
        </div>
        <nav>
          <button
            className={
              view === "attendance"
                ? "nav-item active attendance-nav"
                : "nav-item"
            }
            onClick={() => setView("attendance")}
          >
            <CalendarDays size={18} />
            Attendance
          </button>
          <button
            className={
              view === "archive" ? "nav-item active archive-nav" : "nav-item"
            }
            onClick={() => setView("archive")}
          >
            <Archive size={18} />
            Digital archive
          </button>
          {user.role !== "MEMBER" && (
            <button
              className={view === "members" ? "nav-item active" : "nav-item"}
              onClick={() => setView("members")}
            >
              <Users size={18} />
              Members
            </button>
          )}
          {user.role === "SUPER_ADMIN" && (
            <button
              className={view === "access" ? "nav-item active" : "nav-item"}
              onClick={() => setView("access")}
            >
              <UserCog size={18} />
              Access
            </button>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{user.name.slice(0, 1)}</div>
            <div>
              <strong>{user.name}</strong>
              <small>{user.role.replace("_", " ")}</small>
            </div>
          </div>
          <button className="nav-item logout" onClick={onLogout}>
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <button className="icon-button menu-button" title="Open navigation">
            <Menu size={20} />
          </button>
          <div>
            <p className="eyebrow">
              {view === "attendance"
                ? "Attendance management"
                : view === "archive"
                  ? "Digital archive"
                  : view === "members"
                    ? "Member directory"
                    : "Role-based access"}
            </p>
            <h1>
              {view === "attendance"
                ? "A clear view of participation."
                : view === "archive"
                  ? "The club's memory, findable."
                  : view === "members"
                    ? "People make the club."
                    : "Choose who can access what."}
            </h1>
          </div>
          <div className="top-actions">
            <span className="role-label">{user.email}</span>
          </div>
        </header>
        {notice && (
          <div className="notice">
            <Check size={16} />
            {notice}
          </div>
        )}
        {error && (
          <div className="error-banner">
            <X size={16} />
            {error}
          </div>
        )}
        {view === "attendance" && (
          <AttendanceView
            data={overview}
            canEdit={canEditAttendance}
            onRefresh={refresh}
            onFlash={flash}
          />
        )}
        {view === "archive" && (
          <ArchiveView
            data={overview}
            canEdit={canEditArchive}
            onFlash={flash}
          />
        )}
        {view === "members" && user.role !== "MEMBER" && (
          <MembersView canEdit={canEditAttendance} onFlash={flash} />
        )}
        {view === "access" && <AccessView user={user} onUserUpdate={onUserUpdate} onFlash={flash} />}
      </main>
    </div>
  );
}

function AttendanceView({
  data,
  canEdit,
  onRefresh,
  onFlash,
}: {
  data: any;
  canEdit: boolean;
  onRefresh: () => Promise<void>;
  onFlash: (message: string) => Promise<void>;
}) {
  const [sessionOpen, setSessionOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  if (!data) return <div className="loading-panel">Loading attendance...</div>;
  const stats = data.stats;
  if (data.memberOnly)
    return (
      <div className="workspace attendance-workspace">
        <div className="section-head">
          <div>
            <h2>My attendance</h2>
            <p className="muted">
              Only your own attendance record is shown here.
            </p>
          </div>
        </div>
        <div className="stat-grid">
          <Stat
            label="Meetings recorded"
            value={stats.sessions}
            icon={<CalendarDays size={18} />}
          />
          <Stat
            label="Attendance rate"
            value={`${Math.round(stats.averageAttendance)}%`}
            icon={<BarChart3 size={18} />}
            accent
          />
        </div>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Attendance history</h3>
              <p className="muted">
                Your personal record from the club database.
              </p>
            </div>
          </div>
          {data.memberAttendance.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Recorded</th>
                  </tr>
                </thead>
                <tbody>
                  {data.memberAttendance.map((record: any) => (
                    <tr key={record.id}>
                      <td>
                        <span className="rate">
                          {attendanceLabels[record.status] || record.status}
                        </span>
                      </td>
                      <td>{new Date(record.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No attendance yet"
              copy="Your attendance history will appear after a session is recorded."
            />
          )}
        </section>
      </div>
    );
  return (
    <div className="workspace attendance-workspace">
      <div className="section-head">
        <div>
          <h2>Attendance overview</h2>
          <p className="muted">The latest records from the club database.</p>
        </div>
        {canEdit && (
          <button
            className="button primary"
            onClick={() => setSessionOpen(true)}
          >
            <Plus size={17} />
            New session
          </button>
        )}
      </div>
      <div className="stat-grid">
        <Stat
          label="Active members"
          value={stats.members}
          icon={<Users size={18} />}
        />
        <Stat
          label="Sessions recorded"
          value={stats.sessions}
          icon={<CalendarDays size={18} />}
        />
        <Stat
          label="Average attendance"
          value={`${Math.round(stats.averageAttendance)}%`}
          icon={<BarChart3 size={18} />}
          accent
        />
      </div>
      {canEdit && <MonthlyAttendanceReport />}
      <AttendanceCharts data={data} />
      <div className="content-grid">
        <section className="panel ranking-panel">
          <div className="panel-head">
            <div>
              <h3>Attendance ranking</h3>
              <p className="muted">Members with recorded attendance</p>
            </div>
            <button className="text-button" onClick={() => onRefresh()}>
              Refresh <ChevronRight size={15} />
            </button>
          </div>
          {data.ranking.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Attended</th>
                    <th>Held</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ranking.map((member: any) => (
                    <tr key={member.id}>
                      <td>
                        <strong>{member.name}</strong>
                      </td>
                      <td>{member.attended}</td>
                      <td>{member.held}</td>
                      <td>
                        <span className="rate">{Math.round(member.rate)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No attendance yet"
              copy="Create your first session to start building the record."
            />
          )}
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>All sessions</h3>
              <p className="muted">Open a session to update statuses or delete it.</p>
            </div>
          </div>
          {data.sessions.length ? (
            <div className="session-list">
              {data.sessions.map((session: Session) => (
                <button
                  className="session-row"
                  key={session.id}
                  onClick={() => setActiveSession(session)}
                >
                  <span className="date-block">
                    <b>{new Date(session.date).getDate()}</b>
                    <small>
                      {new Date(session.date).toLocaleString("en", {
                        month: "short",
                      })}
                    </small>
                  </span>
                  <span>
                    <strong>{session.name}</strong>
                    <small>
                      {session.meetingType}{" "}
                      {session.location ? `· ${session.location}` : ""}
                    </small>
                  </span>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No sessions yet"
              copy="Your next meeting will appear here."
            />
          )}
        </section>
      </div>
      {sessionOpen && (
        <SessionModal
          onClose={() => setSessionOpen(false)}
          onCreated={async () => {
            setSessionOpen(false);
            await onFlash("Session created. You can now take attendance.");
          }}
        />
      )}
      {activeSession && (
        <AttendanceModal
          session={activeSession}
          onClose={() => setActiveSession(null)}
          canEdit={canEdit}
          onUpdated={async () => {
            setActiveSession(null);
            await onFlash("Attendance updated.");
          }}
          onDeleted={async () => {
            setActiveSession(null);
            await onFlash("Session deleted.");
          }}
        />
      )}
    </div>
  );
}

function MonthlyAttendanceReport() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    requestJson(`/api/sessions/report?month=${month}`)
      .then(setReport)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load the monthly report."));
  }, [month]);

  function exportCsv() {
    if (!report) return;
    const headers = ["Member", "Sessions", "Present", "Late", "Absent", "Excused", "Attendance rate"];
    const values = report.rows.map((row: any) => [row.name, row.sessions, row.PRESENT, row.LATE, row.ABSENT, row.EXCUSED, `${row.rate}%`]);
    const csvRows: Array<Array<string | number>> = [headers, ...values];
    const csv = csvRows.map((row) => row.map((value: string | number) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `attendance-${month}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <section className="panel monthly-report">
      <div className="panel-head">
        <div>
          <h3>Monthly attendance</h3>
          <p className="muted">Each member's attendance status for the selected month.</p>
        </div>
        <div className="report-actions">
          <label className="month-picker">
            Month
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </label>
          <button className="button quiet" disabled={!report} onClick={exportCsv} title="Export monthly attendance CSV">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>
      {error ? <p className="error-text">{error}</p> : report?.rows.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Sessions</th>
                <th>Present</th>
                <th>Late</th>
                <th>Absent</th>
                <th>Excused</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row: any) => (
                <tr key={row.id}>
                  <td><strong>{row.name}</strong></td>
                  <td>{row.sessions}</td>
                  <td>{row.PRESENT}</td>
                  <td>{row.LATE}</td>
                  <td>{row.ABSENT}</td>
                  <td>{row.EXCUSED}</td>
                  <td><span className="rate">{row.rate}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : report ? (
        <EmptyState title="No sessions this month" copy="Create a session in this month to build its attendance report." />
      ) : (
        <div className="loading-panel">Loading monthly report...</div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={accent ? "stat-card accent" : "stat-card"}>
      <span className="stat-icon">{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="empty-state">
      <FolderOpen size={22} />
      <strong>{title}</strong>
      <p>{copy}</p>
    </div>
  );
}

function AttendanceCharts({ data }: { data: any }) {
  const trends = data?.stats?.trends || [];
  const meetingTypes = Object.entries(data?.stats?.byMeetingType || {}) as [
    string,
    number,
  ][];
  const maxType = Math.max(...meetingTypes.map(([, value]) => value), 1);
  return (
    <div className="chart-grid">
      <section className="panel chart-panel">
        <div className="panel-head">
          <div>
            <h3>Attendance over time</h3>
            <p className="muted">Recent session rates from the database.</p>
          </div>
          <BarChart3 size={18} />
        </div>
        {trends.length ? (
          <div className="line-chart" aria-label="Attendance over time chart">
            <div className="chart-y-axis">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>
            <div className="chart-area">
              <div className="chart-gridline top" />
              <div className="chart-gridline middle" />
              <div className="chart-gridline bottom" />
              <svg viewBox="0 0 500 180" preserveAspectRatio="none" role="img">
                <polyline
                  points={trends
                    .map(
                      (point: any, index: number) =>
                        `${trends.length === 1 ? 250 : (index / (trends.length - 1)) * 500},${180 - (point.rate / 100) * 160}`,
                    )
                    .join(" ")}
                  fill="none"
                  stroke="var(--blue-700)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {trends.map((point: any, index: number) => (
                  <circle
                    key={`${point.label}-${index}`}
                    cx={
                      trends.length === 1
                        ? 250
                        : (index / (trends.length - 1)) * 500
                    }
                    cy={180 - (point.rate / 100) * 160}
                    r="5"
                    fill="var(--gold)"
                    stroke="white"
                    strokeWidth="3"
                  />
                ))}
              </svg>
              <div className="chart-labels">
                {trends.map((point: any) => (
                  <span key={point.label}>{point.label}</span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No trend data yet"
            copy="Record a few sessions to see attendance over time."
          />
        )}
      </section>
      <section className="panel chart-panel">
        <div className="panel-head">
          <div>
            <h3>By meeting type</h3>
            <p className="muted">Average rate across recent sessions.</p>
          </div>
          <CalendarDays size={18} />
        </div>
        {meetingTypes.length ? (
          <div className="bar-chart">
            {meetingTypes.map(([label, value]) => (
              <div className="bar-row" key={label}>
                <div className="bar-label">
                  <span>{label}</span>
                  <strong>{value}%</strong>
                </div>
                <div className="bar-track">
                  <span
                    style={{
                      width: `${Math.min(100, (value / maxType) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No meeting data yet"
            copy="Create sessions with meeting types to compare them."
          />
        )}
      </section>
    </div>
  );
}

function SessionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "",
    date: new Date().toISOString().slice(0, 10),
    time: "",
    location: "",
    meetingType: "General Meeting",
    notes: "",
  });
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await requestJson("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await onCreated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create session.",
      );
    }
  }
  return (
    <Modal title="Create attendance session" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <label>
          Event name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Weekly rehearsal"
            required
          />
        </label>
        <div className="form-row">
          <label>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </label>
          <label>
            Time
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Meeting type
            <select
              value={form.meetingType}
              onChange={(e) =>
                setForm({ ...form, meetingType: e.target.value })
              }
            >
              <option>General Meeting</option>
              <option>Rehearsal</option>
              <option>Production Meeting</option>
              <option>Audition</option>
              <option>Workshop</option>
              <option>Executive Meeting</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            Location
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Drama Club Room"
            />
          </label>
        </div>
        <label>
          Notes
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="button quiet" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary">Create session</button>
        </div>
      </form>
    </Modal>
  );
}

function AttendanceModal({
  session,
  onClose,
  onUpdated,
  onDeleted,
  canEdit,
}: {
  session: Session;
  onClose: () => void;
  onUpdated: () => Promise<void>;
  onDeleted: () => Promise<void>;
  canEdit: boolean;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    requestJson(`/api/members?search=${encodeURIComponent(search)}`).then(
      (data) => setMembers(data.members.sort((a: Member, b: Member) => a.fullName.localeCompare(b.fullName))),
    );
  }, [search]);
  async function update(memberId: string, status: string) {
    await requestJson(`/api/sessions/${session.id}/attendance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, status }),
    });
    setMembers((current) =>
      current.map((member) =>
        member.id === memberId
          ? {
              ...member,
              attendance: [...member.attendance.slice(0, -1), { status }],
            }
          : member,
      ),
    );
  }
  async function removeSession() {
    if (!window.confirm(`Delete the session "${session.name}"? Its attendance records will also be deleted.`)) return;
    await requestJson(`/api/sessions/${session.id}`, { method: "DELETE" });
    await onDeleted();
  }
  return (
    <Modal
      title={session.name}
      subtitle={`${session.meetingType} · ${new Date(session.date).toLocaleDateString()}`}
      onClose={onClose}
    >
      <div className="search-field">
        <Search size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members"
        />
      </div>
      <div className="attendance-list">
        {members.map((member) => (
          <div className="attendance-row" key={member.id}>
            <div>
              <strong>{member.fullName}</strong>
              <small>{member.studentId}</small>
            </div>
            <div className="status-actions">
              {Object.entries(attendanceLabels).map(([key, label]) => (
                <button
                  disabled={!canEdit}
                  key={key}
                  className={`status-button ${(member.attendance.at(-1)?.status || "ABSENT") === key ? `selected ${key.toLowerCase()}` : ""}`}
                  onClick={() => update(member.id, key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="modal-actions">
        {canEdit && (
          <button className="button quiet danger-button" onClick={removeSession}>
            Delete session
          </button>
        )}
        <button className="button primary" onClick={onUpdated}>
          Done
        </button>
      </div>
    </Modal>
  );
}

function ArchiveView({
  data,
  canEdit,
  onFlash,
}: {
  data: any;
  canEdit: boolean;
  onFlash: (message: string) => Promise<void>;
}) {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [uploadOpen, setUploadOpen] = useState(false);
  useEffect(() => {
    requestJson(`/api/archive?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`).then(
      (result) => setItems(result.items),
    );
  }, [search, category]);
  const kinds = data?.stats?.byKind || {};
  const groupedItems = items.reduce<Record<string, ArchiveItem[]>>((groups, item) => {
    (groups[item.category] ||= []).push(item);
    return groups;
  }, {});
  const categories = ["All", "Productions", "Administration", "Finance", "Marketing", "Creative", "Media", "Other"];
  return (
    <div className="workspace archive-workspace">
      <div className="section-head">
        <div>
          <h2>Archive overview</h2>
          <p className="muted">
            Search the records that carry the club's history.
          </p>
        </div>
        {canEdit && (
          <button
            className="button archive-button"
            onClick={() => setUploadOpen(true)}
          >
            <FilePlus2 size={17} />
            Upload file
          </button>
        )}
      </div>
      <div className="stat-grid archive-stats">
        <Stat
          label="Archive items"
          value={data?.stats?.archiveItems ?? "..."}
          icon={<Archive size={18} />}
        />
        <Stat
          label="Documents"
          value={kinds.Documents || 0}
          icon={<FilePlus2 size={18} />}
        />
        <Stat
          label="Images"
          value={kinds.Images || 0}
          icon={<FolderOpen size={18} />}
          accent
        />
      </div>
      <section className="panel archive-panel">
        <div className="archive-toolbar">
          <div>
            <h3>All archive items</h3>
            <p className="muted">
              Files stay protected behind your signed-in session.
            </p>
          </div>
          <div className="archive-filters">
            <label className="category-filter">
              Folder
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <div className="search-field">
              <Search size={16} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, production, category" />
            </div>
          </div>
        </div>
        {items.length ? (
          <div className="archive-folders">
            {Object.entries(groupedItems).map(([folder, folderItems]) => <section className="archive-folder" key={folder}>
              <div className="folder-heading"><div><FolderOpen size={18} /><h4>{folder}</h4></div><span>{folderItems.length} {folderItems.length === 1 ? "file" : "files"}</span></div>
              <div className="archive-grid">{folderItems.map((item) => <div className="archive-item" key={item.id}>
                <div className="file-icon"><Archive size={20} /></div>
                <div className="archive-item-copy"><strong>{item.fileName}</strong><small>{item.year} · {item.category} · {item.confidentiality}</small><small>{item.uploadedBy.name} · {formatSize(item.size)}</small></div>
                <div className="item-actions"><a className="icon-button" title="Preview or download" href={`/api/archive/${item.id}/download`} target="_blank"><ChevronRight size={17} /></a></div>
              </div>)}</div>
            </section>)}
          </div>
        ) : (
          <EmptyState
            title="Nothing matches yet"
            copy="Upload the first script, poster, report, or production file."
          />
        )}
      </section>
      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onUploaded={async () => {
            setUploadOpen(false);
            await onFlash("Archive item uploaded.");
            requestJson(
              `/api/archive?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`,
            ).then((result) => setItems(result.items));
          }}
        />
      )}
    </div>
  );
}
function formatSize(size: number) {
  if (!size) return "Metadata record";
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
function UploadModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: () => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    category: "Other",
    year: String(new Date().getFullYear()),
    semester: "",
    production: "",
    confidentiality: "INTERNAL",
    description: "",
    tags: "",
    version: "Final",
  });
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setError("Choose a file first.");
    const body = new FormData();
    body.append("file", file);
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    try {
      await requestJson("/api/archive", { method: "POST", body });
      await onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload file.");
    }
  }
  return (
    <Modal title="Add to the archive" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <label>
          File
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </label>
        <div className="form-row">
          <label>
            Category
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option>Productions</option>
              <option>Administration</option>
              <option>Finance</option>
              <option>Marketing</option>
              <option>Creative</option>
              <option>Media</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            Year
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Semester
            <input
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              placeholder="Second Semester"
            />
          </label>
          <label>
            Production
            <input
              value={form.production}
              onChange={(e) => setForm({ ...form, production: e.target.value })}
              placeholder="Optional"
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Confidentiality
            <select
              value={form.confidentiality}
              onChange={(e) =>
                setForm({ ...form, confidentiality: e.target.value })
              }
            >
              <option>PUBLIC</option>
              <option>INTERNAL</option>
              <option>EXECUTIVE</option>
              <option>RESTRICTED</option>
            </select>
          </label>
          <label>
            Version
            <input
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
            />
          </label>
        </div>
        <label>
          Description
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </label>
        <label>
          Tags
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="script, fatherland, final"
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="button quiet" onClick={onClose}>
            Cancel
          </button>
          <button className="button archive-button">Upload item</button>
        </div>
      </form>
    </Modal>
  );
}

function AccessView({
  user,
  onUserUpdate,
  onFlash,
}: {
  user: User;
  onUserUpdate: (user: User) => void;
  onFlash: (message: string) => Promise<void>;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  async function load() {
    try {
      setUsers((await requestJson("/api/users")).users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load accounts.");
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function changeRole(id: string, role: string) {
    try {
      await requestJson("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      if (id === user.id) {
        const refreshed = await requestJson("/api/auth/me");
        onUserUpdate(refreshed.user);
      }
      await onFlash("Access updated.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update access.");
    }
  }
  return (
    <div className="workspace">
      <div className="section-head">
        <div>
          <h2>Role-based access</h2>
          <p className="muted">
            Accounts here control access to both attendance and archive tools.
          </p>
        </div>
        <button className="button primary" onClick={() => setOpen(true)}>
          <Plus size={17} />
          Add account
        </button>
      </div>
      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>Approved accounts</h3>
            <p className="muted">
              Assign the narrowest role each person needs.
            </p>
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((account) => (
                <tr key={account.id}>
                  <td>
                    <strong>{account.name}</strong>
                  </td>
                  <td>{account.email}</td>
                  <td>
                    <select
                      value={account.role}
                      onChange={(event) =>
                        changeRole(account.id, event.target.value)
                      }
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {roleLabels[role]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {open && (
        <AccountModal
          onClose={() => setOpen(false)}
          onCreated={async () => {
            setOpen(false);
            await onFlash("Account created.");
            await load();
          }}
        />
      )}
    </div>
  );
}

function AccountModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "MEMBER",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (form.password !== confirmPassword)
      return setError("Passwords do not match.");
    try {
      await requestJson("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await onCreated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create account.",
      );
    }
  }
  return (
    <Modal title="Add approved account" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <label>
          Full name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>
        <label>
          Role
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Password
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={12}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              title="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>
        <label>
          Confirm password
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={12}
            required
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="button quiet" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary">Create account</button>
        </div>
      </form>
    </Modal>
  );
}

function MembersView({
  canEdit,
  onFlash,
}: {
  canEdit: boolean;
  onFlash: (message: string) => Promise<void>;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    requestJson(`/api/members?search=${encodeURIComponent(search)}`).then(
      (result) => setMembers(result.members),
    );
  }, [search]);
  return (
    <div className="workspace">
      <div className="section-head">
        <div>
          <h2>Member directory</h2>
          <p className="muted">
            Historical attendance stays attached to each member record.
          </p>
        </div>
        {canEdit && (
          <button className="button primary" onClick={() => setOpen(true)}>
            <Plus size={17} />
            Add member
          </button>
        )}
      </div>
      <section className="panel">
        <div className="archive-toolbar">
          <div>
            <h3>{members.length} member records</h3>
          </div>
          <div className="search-field">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, department"
            />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Role</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const attended = member.attendance.filter((item) =>
                  ["PRESENT", "LATE"].includes(item.status),
                ).length;
                return (
                  <tr key={member.id}>
                    <td>
                      <strong>{member.fullName}</strong>
                      <small>{member.level || "Level not set"}</small>
                    </td>
                    <td>{member.department || "Not set"}</td>
                    <td>{member.clubRole || "Member"}</td>
                    <td>
                      <span className="rate">
                        {member.attendance.length
                          ? `${Math.round((attended / member.attendance.length) * 100)}%`
                          : "No data"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {open && (
        <MemberModal
          onClose={() => setOpen(false)}
          onCreated={async () => {
            setOpen(false);
            await onFlash("Member added.");
            requestJson(
              `/api/members?search=${encodeURIComponent(search)}`,
            ).then((result) => setMembers(result.members));
          }}
        />
      )}
    </div>
  );
}
function MemberModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    fullName: "",
    studentId: "",
    email: "",
    department: "",
    level: "",
    clubRole: "",
  });
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await requestJson("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add member.");
    }
  }
  return (
    <Modal title="Add member" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <label>
          Full name
          <input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
          />
        </label>
        <div className="form-row">
          <label>
            Student ID
            <input
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              required
            />
          </label>
          <label>
            Level
            <input
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Department
            <input
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </label>
          <label>
            Club role
            <input
              value={form.clubRole}
              onChange={(e) => setForm({ ...form, clubRole: e.target.value })}
            />
          </label>
        </div>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="button quiet" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary">Add member</button>
        </div>
      </form>
    </Modal>
  );
}
function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          <button className="icon-button" title="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
