"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ColorThemeToggle, useColorTheme } from "./theme-system";

type Role = "owner" | "warden" | "guard" | "security" | "staff" | "tenant" | "parent" | "platform";
type SectionId =
  | "overview"
  | "rooms"
  | "tenants"
  | "gate"
  | "visitors"
  | "finance"
  | "community"
  | "mess"
  | "documents"
  | "staff"
  | "parents"
  | "platform";

type Module = {
  id: SectionId;
  title: string;
  description: string;
  stat: string;
  meta: string;
  roles: Role[];
  action: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT";
};

type LoginState = {
  accessToken: string;
  orgId: string;
  userName: string;
  email: string;
};

type Occupant = {
  tenantProfileId: string;
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
  profilePhotoUrl?: string | null;
};

type RoomBoardRoom = {
  id: string;
  roomNumber: string;
  floorId: string;
  floorNumber: number;
  floorName: string;
  roomType: string;
  capacity: number;
  currentOccupancy: number;
  status: string;
  monthlyRent: string | number;
  occupants: Occupant[];
};

type TenantOption = {
  tenantProfileId?: string | null;
  userId: string;
  fullName: string;
  roomNumber?: string;
};

type TenantRecord = TenantOption & {
  email: string;
  phone: string;
  room?: {
    id: string;
    roomNumber: string;
    roomType: string;
    monthlyRent: string | number;
  } | null;
  status: string;
  assignmentStatus: string;
  admissionDate?: string;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  collegeOrCompany?: string | null;
};

type GatePassRecord = {
  id: string;
  reason: string;
  destination: string;
  status: string;
  expected_return_time: string;
  tenant?: { full_name: string; phone?: string };
};

type VisitorRecord = {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_relation: string;
  purpose: string;
  status: string;
  expected_visit_time: string;
  tenant?: { full_name: string };
};

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";

const modules: Module[] = [
  { id: "overview", title: "Overview", description: "Occupancy, requests, dues, and service queue.", stat: "84%", meta: "occupancy", roles: ["owner", "warden"], action: "Refresh", endpoint: "/metrics", method: "GET" },
  { id: "rooms", title: "Rooms", description: "Floors, room capacity, availability, and room history.", stat: "42", meta: "rooms", roles: ["owner", "warden", "guard", "security", "tenant", "parent"], action: "Create room", endpoint: "/rooms", method: "POST" },
  { id: "tenants", title: "Tenants", description: "Create tenant accounts, search residents, and view profiles.", stat: "118", meta: "active", roles: ["owner", "warden"], action: "Add tenant", endpoint: "/tenants", method: "POST" },
  { id: "gate", title: "Gate Passes", description: "View outing requests and approve or reject pending passes.", stat: "9", meta: "pending", roles: ["owner", "warden", "guard", "security", "tenant"], action: "Review passes", endpoint: "/gate-passes", method: "GET" },
  { id: "visitors", title: "Visitors", description: "View visitor records and filter by date, day, or visitor name.", stat: "6", meta: "today", roles: ["owner", "warden", "guard", "security", "tenant"], action: "View visitors", endpoint: "/visitors", method: "GET" },
  { id: "finance", title: "Dues & Payments", description: "Raise dues, collect payments, and set reminders.", stat: "₹2.4L", meta: "due", roles: ["owner", "warden", "tenant", "parent"], action: "Create due", endpoint: "/dues", method: "POST" },
  { id: "community", title: "Community", description: "Announcements, complaints, and lost/found discussion feed.", stat: "3", meta: "threads", roles: ["owner", "warden", "guard", "security", "staff", "tenant", "parent"], action: "Create post", endpoint: "/announcements", method: "POST" },
  { id: "mess", title: "Mess", description: "Weekly menu, publishing, feedback, and summary.", stat: "78%", meta: "rating", roles: ["owner", "warden", "staff", "tenant"], action: "Edit menu", endpoint: "/mess-menus", method: "POST" },
  { id: "documents", title: "Documents", description: "Upload and verify resident documents.", stat: "21", meta: "pending", roles: ["owner", "warden", "tenant"], action: "Upload", endpoint: "/documents", method: "POST" },
  { id: "staff", title: "Staff Contacts", description: "Emergency contacts and staff directory.", stat: "18", meta: "contacts", roles: ["owner", "warden", "guard", "security", "staff", "tenant"], action: "Add contact", endpoint: "/staff-contacts", method: "POST" },
  { id: "parents", title: "Parent Portal", description: "Ward details, privacy, dues, and movement visibility.", stat: "64", meta: "linked", roles: ["parent"], action: "View ward", endpoint: "/parents/ward", method: "GET" },
  { id: "platform", title: "Platform", description: "Organizations, subscription plans, and feature toggles.", stat: "27", meta: "orgs", roles: ["platform"], action: "View orgs", endpoint: "/platform/organizations", method: "GET" },
];

const dataRows: Record<SectionId, string[][]> = {
  overview: [["Gate pass", "Rohan Patel", "Pending", "7:30 PM return"], ["Complaint", "Water leakage", "Assigned", "Housekeeping"], ["Document", "Aadhaar", "Review", "Aarav Mehta"]],
  rooms: [["A-101", "First floor", "2/2", "Occupied"], ["A-102", "First floor", "2/3", "Available"], ["B-204", "Second floor", "1/1", "Maintenance"], ["C-305", "Third floor", "5/6", "Available"]],
  tenants: [["Aarav Mehta", "A-101", "₹12,000 due", "Active"], ["Isha Rao", "A-102", "₹0 due", "Active"], ["Kabir Singh", "C-305", "₹4,500 due", "Onboarding"]],
  gate: [["Rohan Patel", "Home visit", "Pending", "Out 5 PM"], ["Maya Nair", "Coaching", "Approved", "Return 8 PM"], ["Kabir Singh", "Medical", "Completed", "Returned"]],
  visitors: [["Priya Shah", "Isha Rao", "Approved", "Waiting"], ["Delivery", "Office", "Checked in", "Gate 1"], ["Mr. Nair", "Maya Nair", "Pending", "5 PM"]],
  finance: [["Rent - June", "Aarav Mehta", "₹12,000", "Unpaid"], ["Mess", "Kabir Singh", "₹4,500", "Partial"], ["Deposit", "Isha Rao", "₹20,000", "Paid"]],
  community: [["Water shutdown", "All residents", "Published", "92 reads"], ["Water leakage", "A-101", "Assigned", "High"], ["Lost charger", "Common room", "Open", "2 comments"]],
  mess: [["Monday lunch", "Paneer rice", "Published", "82%"], ["Tuesday dinner", "Dal tadka", "Draft", "Pending"], ["Friday snacks", "Poha", "Published", "76%"]],
  documents: [["Aadhaar", "Aarav Mehta", "Pending", "Uploaded"], ["PAN", "Isha Rao", "Verified", "Warden"], ["Passport", "Kabir Singh", "Rejected", "Blurred"]],
  staff: [["Ramesh", "Guard", "Emergency", "Night"], ["Anita", "Warden", "Primary", "Day"], ["Joseph", "Electrician", "On call", "Vendor"]],
  parents: [["Meena Mehta", "Aarav", "Linked", "Dues visible"], ["Ravi Nair", "Maya", "Linked", "Pass visible"], ["Sana Rao", "Isha", "Invited", "Pending"]],
  platform: [["City Complex", "Growth", "Active", "All core modules"], ["North Campus", "Pro", "Trialing", "15 days"], ["Urban Nest", "Starter", "Paused", "Billing hold"]],
};

function normalizeRole(role: string): Role {
  if (role === "security") return "guard";
  return role as Role;
}

function roleLabel(role: string) {
  if (role === "security") return "Security";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function WorkspaceApp({ workspace, role }: { workspace: string; role: string }) {
  const normalizedRole = normalizeRole(role);
  const { themeKey, setThemeKey } = useColorTheme();
  const [login, setLogin] = useState<LoginState | null>(null);
  const [activeId, setActiveId] = useState<SectionId>(normalizedRole === "platform" ? "platform" : "overview");
  const [message, setMessage] = useState("Login to open this private workspace.");
  const [busy, setBusy] = useState(false);
  const propertyName = titleFromSlug(workspace);

  const allowedModules = useMemo(
    () => modules.filter((module) => module.roles.includes(normalizedRole)),
    [normalizedRole]
  );
  const activeModule = allowedModules.find((module) => module.id === activeId) ?? allowedModules[0] ?? modules[0];

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("Checking workspace access...");
    const form = new FormData(event.currentTarget);

    try {
      const isPlatform = normalizedRole === "platform";
      const response = await fetch(`${apiBase}${isPlatform ? "/platform/auth/login" : "/auth/login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          email: form.get("username"),
          password: form.get("password"),
        }),
      });
      const data = await response.json().catch(() => ({}));
      const accessToken = data.accessToken ?? data.token;

      if (!response.ok || !accessToken) {
        setMessage("Login failed. Check email, password, and backend seed data.");
        return;
      }

      const matchedRole = Array.isArray(data.roles)
        ? data.roles.find((item: { orgId: string; orgSlug: string; role: string }) => item.orgSlug === workspace && item.role === normalizedRole)
        : null;

      if (!isPlatform) {
        if (!matchedRole) {
          setMessage(`This account does not have ${roleLabel(role)} access for ${propertyName}.`);
          return;
        }
      }

      setLogin({
        accessToken,
        orgId: matchedRole?.orgId ?? "platform",
        userName: data.user?.fullName ?? data.platformUser?.fullName ?? roleLabel(role),
        email: data.user?.email ?? form.get("username")?.toString() ?? "",
      });
      setMessage("Workspace opened.");
    } catch {
      setMessage("Backend is offline. Start the server to login and view this workspace.");
    } finally {
      setBusy(false);
    }
  }

  async function syncModule() {
    if (!login) return;
    setMessage(`Syncing ${activeModule.title}...`);
    try {
      const response = await fetch(`${apiBase}${activeModule.endpoint}`, {
        method: activeModule.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${login.accessToken}`,
          ...(login.orgId !== "platform" ? { "x-org-id": login.orgId } : {}),
        },
        body: activeModule.method === "GET" ? undefined : JSON.stringify({ orgSlug: workspace, source: "workspace-ui" }),
      });
      setMessage(response.ok ? `${activeModule.title} synced.` : `${activeModule.title} needs valid fields or permissions.`);
    } catch {
      setMessage("Server is not reachable right now.");
    }
  }

  if (!login) {
    return (
      <main>
        <header className="topbar">
          <a className="brand" href="/">
            <span>host</span>in<span>.</span>
          </a>
          <nav className="topnav" aria-label="Workspace">
            <a href="/">Home</a>
            <a href={`/${workspace}/owner`}>Owner</a>
            <a href={`/${workspace}/tenant`}>Tenant</a>
          </nav>
          <a className="outlineButton" href="/">Switch workspace</a>
        </header>

        <section className="portalLogin">
          <div>
            <p className="pill">{propertyName}</p>
            <h1>{roleLabel(role)} portal</h1>
            <p>
              This workspace is private. Sign in with an account that belongs to
              <strong> {propertyName}</strong> and has <strong>{roleLabel(role)}</strong> access.
            </p>
          </div>

          <form className="panel loginPortalCard" onSubmit={handleLogin}>
            <div className="panelTitle">
              <h2>Sign in</h2>
              <span>/{workspace}/{role}</span>
            </div>
            <label>
              <span>Email or phone</span>
              <input name="username" placeholder={`${normalizedRole}@${workspace}.hostin.local`} required />
            </label>
            <label>
              <span>Password</span>
              <input name="password" placeholder="Password" required type="password" />
            </label>
            <button className="gradientButton fullButton" disabled={busy} type="submit">
              {busy ? "Checking..." : `Open ${roleLabel(role)} workspace`}
            </button>
            <p className="formMessage">{message}</p>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main>
      <header className="topbar appTopbar">
        <button className="brand" onClick={() => setActiveId("overview")} type="button">
          <span>host</span>in<span>.</span>
        </button>
        <nav className="topnav" aria-label="Workspace navigation">
          {allowedModules.slice(0, 6).map((module) => (
            <button key={module.id} onClick={() => setActiveId(module.id)} type="button">
              {module.title}
            </button>
          ))}
        </nav>
        <ColorThemeToggle themeKey={themeKey} onChange={setThemeKey} />
        <button className="notificationIconButton" onClick={() => setMessage("Notifications opened from the top bar.")} type="button" aria-label="Notifications">
          <span>12</span>
        </button>
        <button className="gradientButton" onClick={syncModule} type="button">
          Sync
        </button>
      </header>

      <section className="workspace appWorkspace">
        <aside className="sidebar appSidebar">
          <div className="workspaceBadge">
            <span>{propertyName}</span>
            <strong>{roleLabel(role)}</strong>
            <small>{login.userName}</small>
          </div>
          <div className="moduleGroup">
            <p>Allowed modules</p>
            {allowedModules.map((module) => (
              <button
                className={module.id === activeModule.id ? "active navItem" : "navItem"}
                key={module.id}
                onClick={() => setActiveId(module.id)}
                type="button"
              >
                {module.title}
              </button>
            ))}
          </div>
          <button className="outlineButton fullButton" onClick={() => setLogin(null)} type="button">Logout</button>
        </aside>

        <section className="content">
          <div className="pageHeader">
            <div>
              <p className="crumb">{propertyName} / {roleLabel(role)}</p>
              <h2>{activeModule.title}</h2>
              <p>{activeModule.description}</p>
            </div>
            <button className="gradientButton" onClick={syncModule} type="button">{activeModule.action}</button>
          </div>

          <div className="syncBanner">
            <span>Workspace</span>
            <p>{message}</p>
          </div>

          {activeModule.id === "rooms" && ["owner", "warden"].includes(normalizedRole) ? (
            <RoomsBoard
              accessToken={login.accessToken}
              canManage={["owner", "warden"].includes(normalizedRole)}
              orgId={login.orgId}
              role={role}
              workspace={workspace}
            />
          ) : activeModule.id === "tenants" && ["owner", "warden"].includes(normalizedRole) ? (
            <TenantsSection accessToken={login.accessToken} orgId={login.orgId} workspace={workspace} />
          ) : activeModule.id === "gate" ? (
            <GatePassSection accessToken={login.accessToken} canModerate={["owner", "warden"].includes(normalizedRole)} orgId={login.orgId} />
          ) : activeModule.id === "visitors" ? (
            <VisitorsSection accessToken={login.accessToken} canCreate={normalizedRole === "guard"} orgId={login.orgId} />
          ) : activeModule.id === "community" ? (
            <CommunitySection accessToken={login.accessToken} canCreate={["owner", "warden"].includes(normalizedRole)} orgId={login.orgId} role={normalizedRole} />
          ) : (
            <div className="productGrid">
              <section className="panel statGridPanel">
                <div className="statGrid">
                  {allowedModules.slice(0, 6).map((module) => (
                    <button className="metricCard" key={module.id} onClick={() => setActiveId(module.id)} type="button">
                      <span>{module.title}</span>
                      <strong>{module.stat}</strong>
                      <small>{module.meta}</small>
                    </button>
                  ))}
                </div>
              </section>

              <section className="panel largePanel">
                <PanelTitle title={`${activeModule.title} records`} meta={`${dataRows[activeModule.id].length} items`} />
                <RecordList rows={dataRows[activeModule.id]} />
              </section>

              <section className="panel">
                <PanelTitle title={activeModule.action} meta="Action" />
                <SmartForm module={activeModule} onSubmit={syncModule} />
              </section>

              <section className="panel">
                <PanelTitle title="Workflow" meta="Role access" />
                <div className="timeline">
                  {workflowFor(activeModule.id).map((item, index) => (
                    <div key={item}>
                      <span>{index + 1}</span>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function PanelTitle({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="panelTitle">
      <h3>{title}</h3>
      <span>{meta}</span>
    </div>
  );
}

function TenantsSection({ accessToken, orgId, workspace }: { accessToken: string; orgId: string; workspace: string }) {
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const selectedTenant = tenants.find((tenant) => tenant.userId === selectedUserId) ?? tenants[0];
  const filteredTenants = tenants.filter((tenant) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return tenant.fullName.toLowerCase().includes(query) || tenant.room?.roomNumber?.toLowerCase().includes(query);
  });

  async function loadTenants() {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/tenants`, {
        headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
      });
      const data = await response.json().catch(() => ({}));
      const nextTenants = data.tenants ?? [];
      setTenants(nextTenants);
      setSelectedUserId((current) => current || nextTenants[0]?.userId || "");
    } catch {
      console.info("Tenants could not load.");
      setTenants([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, orgId]);

  async function createTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${apiBase}/tenants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "x-org-id": orgId,
        },
        body: JSON.stringify({
          fullName: form.get("fullName"),
          email: form.get("email"),
          phone: form.get("phone"),
          password: form.get("password") || undefined,
        }),
      });
      if (response.ok) {
        event.currentTarget.reset();
        await loadTenants();
      }
      console.info(response.ok ? "Tenant created." : "Tenant create failed.");
    } catch {
      console.info("Server is not reachable. Tenant was not created.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="tenantExperience">
      <section className="panel tenantCreatePanel">
        <PanelTitle title="Add tenant" meta="No room assignment here" />
        <form className="tenantCreateForm" onSubmit={createTenant}>
          <label><span>Full name</span><input name="fullName" placeholder="Tenant full name" required /></label>
          <label><span>Email</span><input name="email" placeholder={`tenant@${workspace}.hostin.local`} required type="email" /></label>
          <label><span>Phone</span><input name="phone" placeholder="10 digit phone" required /></label>
          <label><span>Temporary password</span><input name="password" placeholder={`${workspace}@123`} type="text" /></label>
          <button className="gradientButton fullButton" disabled={isCreating} type="submit">{isCreating ? "Creating..." : "Create tenant"}</button>
        </form>
      </section>

      <section className="panel tenantDirectoryPanel">
        <div className="roomsToolbar tenantToolbar">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tenant name or room number..." />
        </div>
        {isLoading ? (
          <DirectorySkeleton />
        ) : filteredTenants.length ? (
          <div className="tenantDirectoryLayout">
            <div className="tenantList">
              {filteredTenants.map((tenant) => (
                <button
                  className={selectedTenant?.userId === tenant.userId ? "active tenantListItem" : "tenantListItem"}
                  key={tenant.userId}
                  onClick={() => setSelectedUserId(tenant.userId)}
                  type="button"
                >
                  <span>{getInitials(tenant.fullName)}</span>
                  <div>
                    <strong>{tenant.fullName}</strong>
                    <small>{tenant.room?.roomNumber ? `Room ${tenant.room.roomNumber}` : "Unassigned"}</small>
                  </div>
                  <em>{tenant.assignmentStatus}</em>
                </button>
              ))}
            </div>
            <TenantDetailCard tenant={selectedTenant} />
          </div>
        ) : (
          <EmptyPanel title="No tenants found" copy="Create a tenant account first, then assign rooms from the Rooms board." />
        )}
      </section>
    </div>
  );
}

function TenantDetailCard({ tenant }: { tenant?: TenantRecord }) {
  if (!tenant) return <EmptyPanel title="Select a tenant" copy="Tenant profile details will appear here." />;
  return (
    <aside className="tenantDetailCard">
      <div className="tenantProfileHeader">
        <span>{getInitials(tenant.fullName)}</span>
        <div>
          <h3>{tenant.fullName}</h3>
          <p>{tenant.email}</p>
        </div>
      </div>
      <div className="roomInfoGrid">
        <div><span>Phone</span><strong>{tenant.phone}</strong></div>
        <div><span>Room</span><strong>{tenant.room?.roomNumber ?? "Not assigned"}</strong></div>
        <div><span>Status</span><strong>{tenant.status}</strong></div>
        <div><span>Company / College</span><strong>{tenant.collegeOrCompany ?? "Not added"}</strong></div>
        <div><span>Emergency contact</span><strong>{tenant.emergencyContactName ?? "Not added"}</strong></div>
      </div>
    </aside>
  );
}

function GatePassSection({ accessToken, canModerate, orgId }: { accessToken: string; canModerate: boolean; orgId: string }) {
  const [passes, setPasses] = useState<GatePassRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadPasses() {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/gate-passes`, {
        headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
      });
      const data = await response.json().catch(() => ({}));
      setPasses(data.gatePasses ?? []);
    } catch {
      setPasses([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, orgId]);

  async function updatePass(id: string, status: "approved" | "rejected") {
    const response = await fetch(`${apiBase}/gate-passes/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
      body: JSON.stringify({ status }),
    });
    console.info(response.ok ? `Gate pass ${status}.` : "Gate pass update failed.");
    if (response.ok) await loadPasses();
  }

  return (
    <section className="panel feedPanel">
      <PanelTitle title="Gate pass requests" meta={canModerate ? "Approve / Reject" : "View only"} />
      {isLoading ? <DirectorySkeleton /> : passes.length ? (
        <div className="recordList">
          {passes.map((pass) => (
            <article className="actionRecord" key={pass.id}>
              <div>
                <strong>{pass.tenant?.full_name ?? "Tenant"}</strong>
                <small>{pass.reason} · {pass.destination}</small>
                <small>Return: {formatDateTime(pass.expected_return_time)}</small>
              </div>
              <div>
                <span className={`statusPill ${pass.status}`}>{pass.status}</span>
                {canModerate && pass.status === "pending" ? (
                  <div className="inlineActions">
                    <button onClick={() => updatePass(pass.id, "approved")} type="button">Approve</button>
                    <button onClick={() => updatePass(pass.id, "rejected")} type="button">Reject</button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : <EmptyPanel title="No gate passes" copy="Pending and historical gate passes will appear here." />}
    </section>
  );
}

function VisitorsSection({ accessToken, canCreate, orgId }: { accessToken: string; canCreate: boolean; orgId: string }) {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [filter, setFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadVisitors() {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/visitors`, {
        headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
      });
      const data = await response.json().catch(() => ({}));
      setVisitors(data.visitors ?? []);
    } catch {
      setVisitors([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadVisitors();
    if (canCreate) {
      fetch(`${apiBase}/tenants`, {
        headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
      })
        .then((response) => response.json())
        .then((data) => setTenantOptions(data.tenants ?? []))
        .catch(() => setTenantOptions([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, canCreate, orgId]);

  async function createVisitor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${apiBase}/visitors`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
      body: JSON.stringify({
        tenantId: form.get("tenantId"),
        visitorName: form.get("visitorName"),
        visitorPhone: form.get("visitorPhone"),
        visitorRelation: form.get("visitorRelation"),
        purpose: form.get("purpose"),
        expectedVisitTime: form.get("expectedVisitTime"),
      }),
    });
    console.info(response.ok ? "Visitor created." : "Visitor creation failed.");
    if (response.ok) {
      event.currentTarget.reset();
      await loadVisitors();
    }
  }

  const filteredVisitors = visitors.filter((visitor) => {
    const query = filter.toLowerCase().trim();
    const matchesText = !query || visitor.visitor_name.toLowerCase().includes(query);
    const matchesDate = !dateFilter || visitor.expected_visit_time?.slice(0, 10) === dateFilter;
    return matchesText && matchesDate;
  });

  return (
    <section className="panel feedPanel">
      <PanelTitle title="Visitor records" meta={canCreate ? "Guard creation enabled" : "View and filter"} />
      <div className="roomsToolbar visitorToolbar">
        <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter by visitor name..." />
        <input value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} type="date" />
        <select onChange={(event) => setDateFilter(dayToDate(event.target.value))} defaultValue="">
          <option value="">Any day</option>
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
        </select>
      </div>
      {canCreate ? (
        <form className="communityComposer visitorCreateForm" onSubmit={createVisitor}>
          <select name="tenantId" required>
            <option value="">Host tenant</option>
            {tenantOptions.map((tenant) => (
              <option key={tenant.userId} value={tenant.userId}>{tenant.fullName}</option>
            ))}
          </select>
          <input name="visitorName" placeholder="Visitor name" required />
          <input name="visitorPhone" placeholder="Visitor phone" required />
          <input name="visitorRelation" placeholder="Relation" required />
          <input name="purpose" placeholder="Purpose" required />
          <input name="expectedVisitTime" type="datetime-local" required />
          <button className="gradientButton" type="submit">Create visitor</button>
        </form>
      ) : null}
      {isLoading ? <DirectorySkeleton /> : filteredVisitors.length ? (
        <div className="recordList">
          {filteredVisitors.map((visitor) => (
            <article className="actionRecord" key={visitor.id}>
              <div>
                <strong>{visitor.visitor_name}</strong>
                <small>{visitor.purpose} · Host: {visitor.tenant?.full_name ?? "Tenant"}</small>
                <small>{formatDateTime(visitor.expected_visit_time)}</small>
              </div>
              <span className={`statusPill ${visitor.status}`}>{visitor.status}</span>
            </article>
          ))}
        </div>
      ) : <EmptyPanel title="No visitor records" copy="Visitor entries matching your filters will appear here." />}
    </section>
  );
}

function CommunitySection({ accessToken, canCreate, orgId, role }: { accessToken: string; canCreate: boolean; orgId: string; role: Role }) {
  const [tab, setTab] = useState<"announcements" | "complaints" | "lost">("announcements");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const visibleTabs = role === "tenant" || role === "parent" || role === "guard" ? ["announcements", "lost"] : ["announcements", "complaints", "lost"];

  async function loadCommunity() {
    setIsLoading(true);
    try {
      const [announcementsResponse, complaintsResponse] = await Promise.all([
        fetch(`${apiBase}/announcements`, { headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId } }),
        fetch(`${apiBase}/complaints`, { headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId } }),
      ]);
      const announcementData = await announcementsResponse.json().catch(() => ({}));
      const complaintData = await complaintsResponse.json().catch(() => ({}));
      setAnnouncements(announcementData.announcements ?? []);
      setComplaints(complaintData.complaints ?? []);
    } catch {
      setAnnouncements([]);
      setComplaints([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCommunity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, orgId]);

  const feedItems = tab === "announcements" ? announcements : tab === "complaints" ? complaints : [];

  return (
    <section className="panel feedPanel">
      <div className="communityHeader">
        <PanelTitle title="Community" meta="Announcements · Complaints · Lost/Found" />
        <div className="communityToggle">
          {visibleTabs.map((item) => (
            <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item as any)} type="button">
              {item === "lost" ? "Lost / Found" : titleFromSlug(item)}
            </button>
          ))}
        </div>
      </div>
      {canCreate ? <CommunityComposer tab={tab} accessToken={accessToken} orgId={orgId} onPosted={loadCommunity} /> : null}
      {isLoading ? <DirectorySkeleton /> : feedItems.length ? (
        <div className="communityFeed">
          {feedItems.map((item) => (
            <article className="communityPost" key={item.id}>
              <div>
                <strong>{item.title ?? item.description ?? item.category}</strong>
                <small>{item.publisherName ?? item.tenant?.full_name ?? "Community"} · {formatDateTime(item.createdAt ?? item.created_at)}</small>
              </div>
              <p>{item.body ?? item.description ?? "No description added."}</p>
              <div className="postActions"><button type="button">React</button><button type="button">Comment</button></div>
            </article>
          ))}
        </div>
      ) : <EmptyPanel title="No posts yet" copy={tab === "lost" ? "Lost/found backend is not connected yet, so this feed starts empty." : "Community posts will appear here."} />}
    </section>
  );
}

function CommunityComposer({ accessToken, orgId, onPosted, tab }: { accessToken: string; orgId: string; onPosted: () => void; tab: string }) {
  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (tab !== "announcements") {
      console.info("Creation for this community tab needs its backend endpoint.");
      return;
    }
    const response = await fetch(`${apiBase}/announcements`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
      body: JSON.stringify({ title: form.get("title"), body: form.get("body"), targetType: "all" }),
    });
    if (response.ok) {
      event.currentTarget.reset();
      onPosted();
    }
  }
  return (
    <form className="communityComposer" onSubmit={submitPost}>
      <input name="title" placeholder={`Create ${tab === "lost" ? "lost/found" : tab} post`} required />
      <input name="body" placeholder="Write details..." required />
      <button className="gradientButton" type="submit">Post</button>
    </form>
  );
}

function RoomsBoard({
  accessToken,
  canManage,
  orgId,
  role,
  workspace,
}: {
  accessToken: string;
  canManage: boolean;
  orgId: string;
  role: string;
  workspace: string;
}) {
  const [rooms, setRooms] = useState<RoomBoardRoom[]>([]);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [floorFilter, setFloorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTenantUserId, setSelectedTenantUserId] = useState("");
  const [isLoadingBoard, setIsLoadingBoard] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);
  const stats = useMemo(() => {
    const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const occupiedSlots = rooms.reduce((sum, room) => sum + room.currentOccupancy, 0);
    const fullRooms = rooms.filter((room) => getRoomState(room) === "full").length;
    const partialRooms = rooms.filter((room) => getRoomState(room) === "partial").length;
    const emptyRooms = rooms.filter((room) => getRoomState(room) === "empty").length;
    return { totalCapacity, occupiedSlots, fullRooms, partialRooms, emptyRooms };
  }, [rooms]);

  const floors = useMemo(() => {
    const filtered = rooms.filter((room) => {
      const matchesFloor = floorFilter === "all" || String(room.floorNumber) === floorFilter;
      const matchesType = typeFilter === "all" || room.roomType === typeFilter;
      const normalizedSearch = search.toLowerCase().trim();
      const occupantMatch = room.occupants.some((occupant) =>
        occupant.fullName.toLowerCase().includes(normalizedSearch)
      );
      const matchesSearch =
        !normalizedSearch ||
        room.roomNumber.toLowerCase().includes(normalizedSearch) ||
        occupantMatch;
      return matchesFloor && matchesType && matchesSearch;
    });

    return Array.from(
      filtered.reduce((map, room) => {
        const key = `${room.floorNumber}-${room.floorName}`;
        const existing = map.get(key) ?? [];
        existing.push(room);
        map.set(key, existing);
        return map;
      }, new Map<string, RoomBoardRoom[]>())
    )
      .map(([key, floorRooms]) => ({
        key,
        floorNumber: floorRooms[0]?.floorNumber ?? 0,
        floorName: floorRooms[0]?.floorName ?? "Floor",
        rooms: floorRooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })),
      }))
      .sort((a, b) => b.floorNumber - a.floorNumber);
  }, [floorFilter, rooms, search, typeFilter]);

  async function loadBoard() {
    setIsLoadingBoard(true);
    try {
      const [roomsResponse, tenantsResponse] = await Promise.all([
        fetch(`${apiBase}/rooms`, {
          headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
        }),
        fetch(`${apiBase}/tenants`, {
          headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
        }),
      ]);

      if (!roomsResponse.ok || !tenantsResponse.ok) {
        setLoadFailed(true);
        setRooms([]);
        setTenantOptions([]);
        console.info("Room board could not load: backend room data needs login permissions or seed data.");
        return;
      }

      const roomsData = await roomsResponse.json();
      const tenantsData = await tenantsResponse.json();
      const mappedRooms = (roomsData.rooms ?? []).map(mapApiRoom);
      const mappedTenants = (tenantsData.tenants ?? []).map((tenant: any) => ({
        tenantProfileId: tenant.tenantProfileId,
        userId: tenant.userId,
        fullName: tenant.fullName,
        roomNumber: tenant.room?.roomNumber,
      }));

      setRooms(mappedRooms);
      setSelectedRoomId((current) => current && mappedRooms.some((room: RoomBoardRoom) => room.id === current) ? current : "");
      setTenantOptions(mappedTenants);
      setLoadFailed(false);
      console.info("Room board synced with database.");
    } catch {
      setLoadFailed(true);
      setRooms([]);
      setTenantOptions([]);
      console.info("Room board could not load: start the backend to sync live rooms.");
    } finally {
      setIsLoadingBoard(false);
    }
  }

  useEffect(() => {
    loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, orgId]);

  async function assignTenant() {
    if (!selectedRoom || !selectedTenantUserId) return;
    console.info("Assigning tenant to room...");
    try {
      const response = await fetch(`${apiBase}/rooms/${selectedRoom.id}/assign-tenant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "x-org-id": orgId,
        },
        body: JSON.stringify({ tenantUserId: selectedTenantUserId }),
      });

      console.info(response.ok ? "Tenant assigned. Refreshing board..." : "Could not assign tenant. Check capacity and permissions.");
      if (response.ok) await loadBoard();
    } catch {
      console.info("Server is not reachable. Assignment was not saved.");
    }
  }

  async function removeTenant(tenantProfileId: string) {
    if (!selectedRoom) return;
    console.info("Removing tenant from room...");
    try {
      const response = await fetch(`${apiBase}/rooms/${selectedRoom.id}/tenants/${tenantProfileId}/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "x-org-id": orgId,
        },
        body: JSON.stringify({ reason: "removed from room board" }),
      });

      console.info(response.ok ? "Tenant removed. Refreshing board..." : "Could not remove tenant. Check permissions.");
      if (response.ok) await loadBoard();
    } catch {
      console.info("Server is not reachable. Removal was not saved.");
    }
  }

  return (
    <div className="roomsExperience">
      {isLoadingBoard ? <RoomBoardSkeleton /> : (
        <section className="roomStats">
          <Metric label="Total Rooms" value={rooms.length} meta={`${floors.length} floors`} />
          <Metric label="Occupied Slots" value={stats.occupiedSlots} meta={`${stats.totalCapacity} capacity`} />
          <Metric label="Full Rooms" value={stats.fullRooms} meta="No beds free" />
          <Metric label="Partially Filled" value={stats.partialRooms} meta="Can assign" />
          <Metric label="Empty Rooms" value={stats.emptyRooms} meta="Open rooms" />
        </section>
      )}

      <section className="panel roomsPanel">
        <div className="roomsToolbar">
          <select value={floorFilter} onChange={(event) => setFloorFilter(event.target.value)} aria-label="Filter floor">
            <option value="all">All floors</option>
            {Array.from(new Set(rooms.map((room) => room.floorNumber))).sort((a, b) => b - a).map((floor) => (
              <option key={floor} value={floor}>Floor {floor}</option>
            ))}
          </select>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter room type">
            <option value="all">All room types</option>
            {Array.from(new Set(rooms.map((room) => room.roomType))).map((type) => (
              <option key={type} value={type}>{formatRoomType(type)}</option>
            ))}
          </select>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search room or student..." />
          <div className="roomLegend">
            <span><i className="full" /> Full</span>
            <span><i className="partial" /> Partial</span>
            <span><i className="empty" /> Empty</span>
            <span><i className="maintenance" /> Maintenance</span>
          </div>
        </div>

        <div className="roomsBoardLayout">
          {isLoadingBoard ? (
            <RoomGridSkeleton />
          ) : rooms.length ? (
            <div className="floorBoard">
              {floors.map((floor) => (
                <div className="floorRow" key={floor.key}>
                  <div className="floorLabel">
                    <span>{floor.floorNumber === 0 ? "Ground" : `Floor ${floor.floorNumber}`}</span>
                    <small>{floor.rooms.length} rooms</small>
                  </div>
                  <div className="roomCells">
                    {floor.rooms.map((room) => (
                      <RoomCell
                        isSelected={selectedRoom?.id === room.id}
                        key={room.id}
                        onSelect={() => setSelectedRoomId((current) => current === room.id ? "" : room.id)}
                        room={room}
                        role={role}
                        workspace={workspace}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="roomEmptyState">
              <strong>{loadFailed ? "Rooms could not be loaded" : "No rooms created yet"}</strong>
              <p>
                {loadFailed
                  ? "Check backend, login permissions, and seeded workspace data."
                  : "Create floors and rooms during setup to generate this visual board."}
              </p>
            </div>
          )}

          <aside className={`roomDetailsPanel ${selectedRoom ? "isVisible" : "isIdle"}`}>
            {selectedRoom ? (
              <>
              <div className="roomDetailsHeader">
                <div>
                  <h3>Room {selectedRoom.roomNumber}</h3>
                  <p>{selectedRoom.floorName} · {selectedRoom.currentOccupancy}/{selectedRoom.capacity} occupied</p>
                </div>
                <span className={`statusPill ${getRoomState(selectedRoom)}`}>{getRoomState(selectedRoom)}</span>
              </div>

              <div className="occupantList">
                <div className="occupantTitle">
                  <strong>Occupants</strong>
                  <span>{selectedRoom.occupants.length}/{selectedRoom.capacity}</span>
                </div>
                {selectedRoom.occupants.length ? selectedRoom.occupants.map((occupant) => (
                  <div className="occupantRow" key={occupant.tenantProfileId}>
                    <span>{getInitials(occupant.fullName)}</span>
                    <div>
                      <strong>{occupant.fullName}</strong>
                      <a href={`/${workspace}/${role}/tenants?student=${occupant.userId}`}>View profile</a>
                    </div>
                    {canManage ? (
                      <button onClick={() => removeTenant(occupant.tenantProfileId)} type="button">Remove</button>
                    ) : null}
                  </div>
                )) : <p className="emptyText">No students assigned.</p>}
              </div>

              <div className="roomInfoGrid">
                <div><span>Room type</span><strong>{formatRoomType(selectedRoom.roomType)}</strong></div>
                <div><span>Capacity</span><strong>{selectedRoom.capacity}</strong></div>
                <div><span>Monthly rent</span><strong>₹{selectedRoom.monthlyRent}</strong></div>
              </div>

              {canManage ? (
                <div className="assignBox">
                  <label>
                    <span>Add or move student</span>
                    <select value={selectedTenantUserId} onChange={(event) => setSelectedTenantUserId(event.target.value)}>
                      <option value="">Select tenant</option>
                      {tenantOptions.map((tenant) => (
                        <option key={tenant.userId} value={tenant.userId}>
                          {tenant.fullName}{tenant.roomNumber ? ` · ${tenant.roomNumber}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="gradientButton fullButton" disabled={!selectedTenantUserId || getRoomState(selectedRoom) === "full"} onClick={assignTenant} type="button">
                    Assign to room
                  </button>
                </div>
              ) : null}
              </>
            ) : (
              <div className="roomPanelPlaceholder">
                <strong>Select a room</strong>
                <p>Room actions will appear here without shifting the board layout.</p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}

function RoomBoardSkeleton() {
  return (
    <section className="roomStats">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="roomMetric skeletonMetric" key={index}>
          <div>
            <span className="skeletonLine label" />
            <strong className="skeletonLine value" />
            <small className="skeletonLine meta" />
          </div>
          <i className="skeletonIcon" />
        </div>
      ))}
    </section>
  );
}

function RoomGridSkeleton() {
  return (
    <>
      <div className="floorBoard skeletonBoard">
        {Array.from({ length: 4 }).map((_, floorIndex) => (
          <div className="floorRow" key={floorIndex}>
            <div className="floorLabel skeletonFloorLabel">
              <span className="skeletonLine short" />
              <small className="skeletonLine tiny" />
            </div>
            <div className="roomCells">
              {Array.from({ length: 8 }).map((_, roomIndex) => (
                <div className="roomCell skeletonRoom" key={roomIndex}>
                  <span className="skeletonLine roomNo" />
                  <div className="skeletonBeds">
                    <i />
                    <i />
                    <i />
                  </div>
                  <small className="skeletonLine tiny centered" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <aside className="roomDetailsPanel skeletonDetails">
        <span className="skeletonLine panelTitleLine" />
        <span className="skeletonLine panelMetaLine" />
        <div className="skeletonOccupants">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index}>
              <i />
              <span className="skeletonLine occupantName" />
            </div>
          ))}
        </div>
        <div className="skeletonInfoRows">
          <span />
          <span />
          <span />
        </div>
        <span className="skeletonButton" />
      </aside>
    </>
  );
}

function Metric({ label, value, meta }: { label: string; value: number | string; meta: string }) {
  return (
    <div className="roomMetric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{meta}</small>
    </div>
  );
}

function RoomCell({
  isSelected,
  onSelect,
  room,
  role,
  workspace,
}: {
  isSelected: boolean;
  onSelect: () => void;
  room: RoomBoardRoom;
  role: string;
  workspace: string;
}) {
  const state = getRoomState(room);
  const names = room.occupants.map((occupant) => occupant.fullName);

  return (
    <button className={`roomCell ${state} ${isSelected ? "selected" : ""}`} onClick={onSelect} type="button">
      <strong>{room.roomNumber}</strong>
      <div className="bedIcons" aria-label={`${room.currentOccupancy} of ${room.capacity} occupied`}>
        {Array.from({ length: room.capacity }).map((_, index) => {
          const occupant = room.occupants[index];
          return occupant ? (
            <a
              className="bedIcon filled"
              href={`/${workspace}/${role}/tenants?student=${occupant.userId}`}
              key={occupant.userId}
              onClick={(event) => event.stopPropagation()}
              title={occupant.fullName}
            >
              {getInitials(occupant.fullName).slice(0, 1)}
            </a>
          ) : (
            <span className="bedIcon" key={`empty-${index}`} />
          );
        })}
      </div>
      <small>{room.status === "maintenance" ? "Maintenance" : `${room.currentOccupancy}/${room.capacity}`}</small>
      {names.length ? (
        <span className="roomTooltip">
          {names.map((name) => <em key={name}>{name}</em>)}
          <b>View room details</b>
        </span>
      ) : null}
    </button>
  );
}

function mapApiRoom(room: any): RoomBoardRoom {
  return {
    id: room.id,
    roomNumber: room.room_number,
    floorId: room.floor_id,
    floorNumber: room.floor?.floor_number ?? 0,
    floorName: room.floor?.floor_name ?? "Floor",
    roomType: room.room_type,
    capacity: room.capacity,
    currentOccupancy: room.current_occupancy,
    status: room.status,
    monthlyRent: room.monthly_rent,
    occupants: (room.tenant_profiles ?? []).map((profile: any) => ({
      tenantProfileId: profile.id,
      userId: profile.user_id,
      fullName: profile.user?.full_name ?? "Student",
      email: profile.user?.email,
      phone: profile.user?.phone,
      profilePhotoUrl: profile.user?.profile_photo_url,
    })),
  };
}

function getRoomState(room: RoomBoardRoom) {
  if (room.status === "maintenance" || room.status === "unavailable") return "maintenance";
  if (room.currentOccupancy >= room.capacity) return "full";
  if (room.currentOccupancy === 0) return "empty";
  return "partial";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatRoomType(type: string) {
  return type
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatDateTime(value?: string) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function dayToDate(value: string) {
  if (!value) return "";
  const date = new Date();
  if (value === "tomorrow") date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function EmptyPanel({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="roomEmptyState compactEmpty">
      <strong>{title}</strong>
      <p>{copy}</p>
    </div>
  );
}

function DirectorySkeleton() {
  return (
    <div className="directorySkeleton">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="directorySkeletonRow" key={index}>
          <i className="skeletonIcon" />
          <div>
            <span className="skeletonLine short" />
            <span className="skeletonLine meta" />
          </div>
          <span className="skeletonLine tiny" />
        </div>
      ))}
    </div>
  );
}

function RecordList({ rows }: { rows: string[][] }) {
  return (
    <div className="recordList">
      {rows.map((row) => (
        <button key={row.join("-")} type="button">
          <div>
            <strong>{row[0]}</strong>
            <small>{row[1]}</small>
          </div>
          <div>
            <span>{row[2]}</span>
            <small>{row[3]}</small>
          </div>
        </button>
      ))}
    </div>
  );
}

function SmartForm({ module, onSubmit }: { module: Module; onSubmit: () => void }) {
  return (
    <form
      className="smartForm"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {fieldsFor(module.id).map((field) => (
        <label key={field}>
          <span>{field}</span>
          <input placeholder={field} />
        </label>
      ))}
      <button className="gradientButton fullButton" type="submit">{module.action}</button>
    </form>
  );
}

function fieldsFor(id: SectionId) {
  const map: Record<SectionId, string[]> = {
    overview: ["Search", "Date"],
    rooms: ["Room number", "Floor", "Capacity", "Room type"],
    tenants: ["Full name", "Email", "Phone", "Temporary password"],
    gate: ["Reason", "Destination", "Expected return", "Emergency contact"],
    visitors: ["Visitor name", "Phone", "Tenant", "Purpose"],
    finance: ["Tenant", "Due type", "Amount", "Due date"],
    community: ["Title", "Message", "Type"],
    mess: ["Week start", "Meal", "Dish", "Notes"],
    documents: ["Tenant", "Document type", "Document number", "File URL"],
    staff: ["Name", "Role", "Phone", "Emergency flag"],
    parents: ["Parent email", "Tenant", "Relationship", "Privacy"],
    platform: ["Organization", "Plan", "Feature key", "Status"],
  };

  return map[id];
}

function workflowFor(id: SectionId) {
  const map: Record<SectionId, string[]> = {
    overview: ["Review metrics", "Open priority queue", "Assign owners"],
    rooms: ["Create floor", "Create room", "Assign tenant", "Track history"],
    tenants: ["Create tenant account", "View profile", "Assign later from Rooms", "Collect documents"],
    gate: ["Tenant requests", "Warden approves or rejects", "Guard scans out", "Guard scans in"],
    visitors: ["Guard creates visitor", "Team views records", "Filter by date", "Check in/out"],
    finance: ["Raise due", "Send reminder", "Record payment", "Close balance"],
    community: ["Choose feed", "Post or view", "React", "Comment"],
    mess: ["Create menu", "Publish week", "Collect feedback", "Review summary"],
    documents: ["Upload document", "Review details", "Verify", "Keep audit trail"],
    staff: ["Add contact", "Set role", "Mark emergency", "Publish directory"],
    parents: ["Link parent", "Set privacy", "Show ward", "Review dues"],
    platform: ["Create plan", "Add organization", "Toggle features", "Monitor usage"],
  };

  return map[id];
}
