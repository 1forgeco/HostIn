"use client";

import { CSSProperties, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { applyCustomColor, applyDefaultTheme } from "./theme-system";
import { ClientOnboardingWizard } from "./client-onboarding-wizard";

type Role = "owner" | "warden" | "guard" | "security" | "staff" | "tenant" | "parent" | "platform";
type SectionId = "profile" | "overview" | "ownerProperties" | "ownerPeople" | "ownerCredentials" | "ownerRequests" | "ownerBilling" | "ownerReports" | "ownerSettings" | "rooms" | "tenants" | "gate" | "visitors" | "finance" | "community" | "complaints" | "announcements" | "mess" | "documents" | "staff" | "parents" | "platform";

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
  themeColor?: string | null;
  availableRoles?: { orgId: string; workspace: string; role: string; accountSlug: string; destination: string }[];
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
  reason?: string;
  purpose?: string;
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

type ComplaintRecord = {
  id: string;
  title?: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  tenant?: { full_name: string };
};

type DocumentRecord = {
  id: string;
  doc_type: string;
  file_name: string;
  file_url: string;
  is_verified: boolean;
  created_at: string;
  tenant?: { id: string; full_name: string; email: string };
};

type DueRecord = {
  id: string;
  amount: string | number;
  amount_paid: string | number;
  due_date: string;
  due_type: string;
  status: string;
  tenant: { full_name: string };
};

type StaffContactRecord = { id: string; name: string; phone: string; role_type: string };
type MessItem = { id: string; day_of_week: string; meal_type: string; items: string[] };
type PaymentRecord = {
  id: string;
  amount: string | number;
  payment_method: string;
  paid_at: string;
  status: string;
  due: { due_type: string; amount: string | number; due_date: string };
};
type NotificationRecord = { id: string; title: string; body: string; status: string; created_at: string };
type PlatformOrganization = {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  planName: string;
  planStatus: string;
  planExpiresAt?: string;
  isActive: boolean;
  totalCapacity: number;
  activeTenantsCount: number;
  occupancyRate: number;
  memberCount: number;
  roleCounts: Record<string, number>;
  features: { key: string; enabled: boolean }[];
  monthlyPrice: string | number;
  contactEmail?: string | null;
  contactPhone?: string | null;
  cityState?: string;
  address?: string | null;
  createdAt?: string;
  themeColor?: string | null;
  workspaceStatus?: string;
  clientType?: string | null;
  branchCount?: number;
  billingCycle?: string;
  onboarding?: { current_step: number; status: string } | null;
};
type PlatformPlan = { id: string; name: string; price_monthly: string | number; max_tenants: number };
type PlatformControlData = {
  onboarding?: { current_step: number; status: string } | null;
  people: {
    id: string;
    full_name: string;
    phone: string;
    email?: string | null;
    person_type: string;
    room_number?: string | null;
    status: string;
  }[];
  accounts: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    account_status: string;
    force_password_change: boolean;
    last_login_at?: string | null;
    roles: string[];
  }[];
  floors: {
    id: string;
    floor_number: number;
    floor_name: string;
    rooms: {
      id: string;
      room_number: string;
      capacity: number;
      current_occupancy: number;
      monthly_rent: string | number;
      status: string;
    }[];
  }[];
  roleDashboards: { role: string; status: string }[];
  rolePermissions: { role: string; feature_key: string; is_allowed: boolean }[];
  accessOverrides: {
    id: string;
    user_id: string;
    role: string;
    feature_key: string;
    decision: string;
    reason?: string | null;
    expires_at?: string | null;
    user: { full_name: string; email: string };
  }[];
};

type OwnerDashboardData = {
  owner: { name: string; organizationName: string; managingProperties: number };
  summary: {
    totalProperties: number;
    totalTenants: number;
    availableBeds: number;
    totalBeds: number;
    monthlyRevenue: number;
    pendingRent: number;
    openComplaints: number;
    staffActive: number;
    pendingRequests: number;
    pendingCredentialRequests: number;
  };
  properties: {
    id: string;
    name: string;
    slug: string;
    cityState: string;
    clientType?: string | null;
    planName: string;
    planStatus: string;
    roomCount: number;
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    activeTenants: number;
    monthlyRevenue: number;
    pendingRent: number;
    openComplaints: number;
    staffActive: number;
    status: string;
  }[];
  attention: { key: string; label: string; count: number; severity: string }[];
  credentials: {
    userId: string;
    name: string;
    role: string;
    loginId: string;
    property: string;
    status: string;
    roleActive: boolean;
    createdOn: string;
    lastActive?: string | null;
  }[];
  people: {
    id: string;
    name: string;
    role: string;
    property: string;
    roomOrDepartment: string;
    phone: string;
    accountStatus: string;
    documentStatus: string;
    lastActive?: string | null;
    status: string;
  }[];
  documents: { id: string; tenantName: string; type: string; fileName: string; status: string; createdAt: string }[];
  requests: {
    id: string;
    type: string;
    status: string;
    title: string;
    personName?: string | null;
    role?: string | null;
    property: string;
    requestedBy: string;
    createdAt: string;
    updatedAt: string;
    reason?: string | null;
    requiredAccess?: string | null;
  }[];
  billing: {
    orgId: string;
    property: string;
    planName: string;
    planStatus: string;
    baseMonthly: number;
    maxTenants: number;
    activeFeatures: string[];
    nextRenewal?: string | null;
    totalCapacity: number;
    activeUsers: number;
  }[];
  recentActivity: { type: string; title: string; date: string }[];
  roleCounts: Record<string, number>;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";
const ownerDashboardIds: SectionId[] = ["overview", "ownerProperties", "ownerPeople", "ownerCredentials", "ownerRequests", "documents", "ownerBilling", "ownerReports", "ownerSettings"];

const modules: Module[] = [
  {
    id: "overview",
    title: "Dashboard",
    description: "What needs your attention today.",
    stat: "84%",
    meta: "occupancy",
    roles: ["owner", "warden"],
    action: "Refresh",
    endpoint: "/metrics",
    method: "GET",
  },
  {
    id: "ownerProperties",
    title: "My Properties",
    description: "Manage every PG, hostel, branch, plan, occupancy, and billing status.",
    stat: "0",
    meta: "properties",
    roles: ["owner"],
    action: "Request property",
    endpoint: "/owner/requests",
    method: "POST",
  },
  {
    id: "rooms",
    title: "Rooms",
    description: "Floors, room capacity, availability, and room history.",
    stat: "42",
    meta: "rooms",
    roles: ["owner", "warden", "parent"],
    action: "Create room",
    endpoint: "/rooms",
    method: "POST",
  },
  {
    id: "ownerPeople",
    title: "People & Roles",
    description: "Master people directory across tenants, wardens, guards, mess managers, parents, and vendors.",
    stat: "118",
    meta: "people",
    roles: ["owner"],
    action: "Request credential",
    endpoint: "/owner/requests",
    method: "POST",
  },
  {
    id: "ownerCredentials",
    title: "Credentials",
    description: "View login IDs, account status, role access, and credential requests fulfilled by 1Forge.",
    stat: "0",
    meta: "accounts",
    roles: ["owner"],
    action: "Request credential",
    endpoint: "/owner/requests",
    method: "POST",
  },
  {
    id: "ownerRequests",
    title: "Requests",
    description: "Track credential, feature, property, plan, staff, document, and support requests.",
    stat: "0",
    meta: "open",
    roles: ["owner"],
    action: "Submit request",
    endpoint: "/owner/requests",
    method: "POST",
  },
  {
    id: "tenants",
    title: "Tenants",
    description: "Create tenant accounts, search residents, and view profiles.",
    stat: "118",
    meta: "active",
    roles: ["warden"],
    action: "Add tenant",
    endpoint: "/tenants",
    method: "POST",
  },
  {
    id: "gate",
    title: "Gate Passes",
    description: "View outing requests and approve or reject pending passes.",
    stat: "9",
    meta: "pending",
    roles: ["owner", "warden", "guard", "security", "tenant"],
    action: "Review passes",
    endpoint: "/gate-passes",
    method: "GET",
  },
  {
    id: "visitors",
    title: "Visitors",
    description: "View visitor records and filter by date, day, or visitor name.",
    stat: "6",
    meta: "today",
    roles: ["owner", "warden", "guard", "security"],
    action: "View visitors",
    endpoint: "/visitors",
    method: "GET",
  },
  {
    id: "complaints",
    title: "Complaints",
    description: "Assign, update, and resolve operational complaints.",
    stat: "0",
    meta: "open",
    roles: ["owner", "warden"],
    action: "Review complaints",
    endpoint: "/complaints",
    method: "GET",
  },
  {
    id: "announcements",
    title: "Announcements",
    description: "Create and view property announcements.",
    stat: "0",
    meta: "posts",
    roles: ["warden"],
    action: "Create announcement",
    endpoint: "/announcements",
    method: "POST",
  },
  {
    id: "finance",
    title: "Dues & Payments",
    description: "Raise dues, collect payments, and set reminders.",
    stat: "₹2.4L",
    meta: "due",
    roles: ["owner", "tenant", "parent"],
    action: "Create due",
    endpoint: "/dues",
    method: "POST",
  },
  {
    id: "community",
    title: "Community",
    description: "Announcements, complaints, and lost/found discussion feed.",
    stat: "3",
    meta: "threads",
    roles: ["owner", "staff", "tenant", "parent"],
    action: "Create post",
    endpoint: "/announcements",
    method: "POST",
  },
  {
    id: "mess",
    title: "Mess",
    description: "Weekly menu, publishing, feedback, and summary.",
    stat: "78%",
    meta: "rating",
    roles: ["owner", "staff", "tenant"],
    action: "Edit menu",
    endpoint: "/mess-menus",
    method: "POST",
  },
  {
    id: "documents",
    title: "Documents Vault",
    description: "Upload and verify resident documents.",
    stat: "21",
    meta: "pending",
    roles: ["owner", "warden"],
    action: "Upload",
    endpoint: "/documents",
    method: "POST",
  },
  {
    id: "staff",
    title: "Staff Contacts",
    description: "Emergency contacts and staff directory.",
    stat: "18",
    meta: "contacts",
    roles: ["owner", "warden", "guard", "security", "staff", "tenant"],
    action: "Add contact",
    endpoint: "/staff-contacts",
    method: "POST",
  },
  {
    id: "ownerBilling",
    title: "Billing & Plans",
    description: "Plan, enabled features, usage, renewal, and add-on request controls.",
    stat: "0",
    meta: "billing",
    roles: ["owner"],
    action: "Request upgrade",
    endpoint: "/owner/requests",
    method: "POST",
  },
  {
    id: "ownerReports",
    title: "Reports",
    description: "Owner-level financial, occupancy, role, request, and operations summaries.",
    stat: "0",
    meta: "reports",
    roles: ["owner"],
    action: "Refresh",
    endpoint: "/owner/dashboard",
    method: "GET",
  },
  {
    id: "ownerSettings",
    title: "Settings",
    description: "Workspace status, plan limits, feature policy, and 1Forge-managed controls.",
    stat: "0",
    meta: "settings",
    roles: ["owner"],
    action: "Request change",
    endpoint: "/owner/requests",
    method: "POST",
  },
  {
    id: "parents",
    title: "Parent Portal",
    description: "Ward details, privacy, dues, and movement visibility.",
    stat: "64",
    meta: "linked",
    roles: ["parent"],
    action: "View ward",
    endpoint: "/parents/ward",
    method: "GET",
  },
  {
    id: "platform",
    title: "Platform",
    description: "Organizations, subscription plans, and feature toggles.",
    stat: "27",
    meta: "orgs",
    roles: ["platform"],
    action: "View orgs",
    endpoint: "/platform/organizations",
    method: "GET",
  },
];

const profileModule: Module = {
  id: "profile",
  title: "Profile",
  description: "Your account, posting identity, security settings, and workspace access.",
  stat: "1",
  meta: "account",
  roles: ["owner", "warden", "guard", "security", "staff", "tenant", "parent", "platform"],
  action: "Open profile",
  endpoint: "/auth/me",
  method: "GET",
};

const dataRows: Partial<Record<SectionId, string[][]>> = {
  overview: [
    ["Gate pass", "Rohan Patel", "Pending", "7:30 PM return"],
    ["Complaint", "Water leakage", "Assigned", "Housekeeping"],
    ["Document", "Aadhaar", "Review", "Aarav Mehta"],
  ],
  rooms: [
    ["A-101", "First floor", "2/2", "Occupied"],
    ["A-102", "First floor", "2/3", "Available"],
    ["B-204", "Second floor", "1/1", "Maintenance"],
    ["C-305", "Third floor", "5/6", "Available"],
  ],
  tenants: [
    ["Aarav Mehta", "A-101", "₹12,000 due", "Active"],
    ["Isha Rao", "A-102", "₹0 due", "Active"],
    ["Kabir Singh", "C-305", "₹4,500 due", "Onboarding"],
  ],
  gate: [
    ["Rohan Patel", "Home visit", "Pending", "Out 5 PM"],
    ["Maya Nair", "Coaching", "Approved", "Return 8 PM"],
    ["Kabir Singh", "Medical", "Completed", "Returned"],
  ],
  visitors: [
    ["Priya Shah", "Isha Rao", "Approved", "Waiting"],
    ["Delivery", "Office", "Checked in", "Gate 1"],
    ["Mr. Nair", "Maya Nair", "Pending", "5 PM"],
  ],
  finance: [
    ["Rent - June", "Aarav Mehta", "₹12,000", "Unpaid"],
    ["Mess", "Kabir Singh", "₹4,500", "Partial"],
    ["Deposit", "Isha Rao", "₹20,000", "Paid"],
  ],
  community: [
    ["Water shutdown", "All residents", "Published", "92 reads"],
    ["Water leakage", "A-101", "Assigned", "High"],
    ["Lost charger", "Common room", "Open", "2 comments"],
  ],
  mess: [
    ["Monday lunch", "Paneer rice", "Published", "82%"],
    ["Tuesday dinner", "Dal tadka", "Draft", "Pending"],
    ["Friday snacks", "Poha", "Published", "76%"],
  ],
  documents: [
    ["Aadhaar", "Aarav Mehta", "Pending", "Uploaded"],
    ["PAN", "Isha Rao", "Verified", "Warden"],
    ["Passport", "Kabir Singh", "Rejected", "Blurred"],
  ],
  staff: [
    ["Ramesh", "Guard", "Emergency", "Night"],
    ["Anita", "Warden", "Primary", "Day"],
    ["Joseph", "Electrician", "On call", "Vendor"],
  ],
  parents: [
    ["Meena Mehta", "Aarav", "Linked", "Dues visible"],
    ["Ravi Nair", "Maya", "Linked", "Pass visible"],
    ["Sana Rao", "Isha", "Invited", "Pending"],
  ],
  platform: [
    ["City Complex", "Growth", "Active", "All core modules"],
    ["North Campus", "Pro", "Trialing", "15 days"],
    ["Urban Nest", "Starter", "Paused", "Billing hold"],
  ],
};

function normalizeRole(role: string): Role {
  if (role === "security") return "guard";
  return role as Role;
}

function roleLabel(role: string) {
  if (role === "security") return "Security";
  if (role === "staff") return "Mess Manager";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function titleFromSlug(slug: string) {
  if (slug === "staff") return "Mess Manager";
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function WorkspaceApp({ workspace, role, profile }: { workspace: string; role: string; profile?: string }) {
  const normalizedRole = normalizeRole(role);
  const [login, setLogin] = useState<LoginState | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [activeId, setActiveId] = useState<SectionId>(normalizedRole === "platform" ? "platform" : "overview");
  const [message, setMessage] = useState("Login to open this private workspace.");
  const [busy, setBusy] = useState(false);
  const propertyName = titleFromSlug(workspace);

  useEffect(() => {
    applyDefaultTheme();
    try {
      const stored = window.sessionStorage.getItem("hostin-session");
      if (!stored) return;
      const session = JSON.parse(stored);
      const matchingAccess = session.availableRoles?.find((item: { workspace: string; role: string }) => item.workspace === workspace && normalizeRole(item.role) === normalizedRole);
      if ((session.workspace === workspace && normalizeRole(session.role) === normalizedRole) || matchingAccess) {
        setLogin({
          accessToken: session.accessToken,
          orgId: matchingAccess?.orgId || session.orgId,
          userName: session.userName,
          email: session.email,
          themeColor: session.themeColor,
          availableRoles: session.availableRoles,
        });
        if (session.themeColor && normalizedRole !== "platform") applyCustomColor(session.themeColor);
        setMessage("Workspace opened.");
      }
    } catch {
      window.sessionStorage.removeItem("hostin-session");
    } finally {
      setSessionChecked(true);
    }
  }, [normalizedRole, workspace]);

  const allowedModules = useMemo(() => {
    const available = modules.filter((module) => module.roles.includes(normalizedRole));
    if (normalizedRole !== "warden") return available;
    const order: SectionId[] = ["overview", "rooms", "tenants", "complaints", "gate", "visitors", "announcements", "staff", "documents"];
    return available.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [normalizedRole]);
  const activeModule = activeId === "profile" ? profileModule : (allowedModules.find((module) => module.id === activeId) ?? allowedModules[0] ?? modules[0]);
  const propertyOptions = useMemo(() => {
    if (!login || normalizedRole === "platform") return [];
    const seen = new Set<string>();
    const options = (login.availableRoles ?? [])
      .filter((item) => normalizeRole(item.role) === normalizedRole)
      .filter((item) => {
        if (seen.has(item.workspace)) return false;
        seen.add(item.workspace);
        return true;
      })
      .map((item) => ({
        label: titleFromSlug(item.workspace),
        value: item.workspace,
        destination: item.destination,
      }));
    return options.length
      ? options
      : [
          {
            label: propertyName,
            value: workspace,
            destination: `/${workspace}/${normalizedRole}/${profile || "account"}`,
          },
        ];
  }, [login, normalizedRole, profile, propertyName, workspace]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("Checking workspace access...");
    const form = new FormData(event.currentTarget);

    try {
      const isPlatform = normalizedRole === "platform";
      const response = await fetch(`${apiBase}${isPlatform ? "/platform/auth/login" : "/auth/login"}`, {
        method: "POST",
        credentials: "include",
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

      const matchedRole = Array.isArray(data.roles) ? data.roles.find((item: { orgId: string; orgSlug: string; role: string }) => item.orgSlug === workspace && item.role === normalizedRole) : null;

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
        themeColor: matchedRole?.themeColor,
        availableRoles: data.roles?.map((item: { orgId: string; orgSlug: string; role: string; accountSlug?: string }) => ({
          orgId: item.orgId,
          workspace: item.orgSlug,
          role: item.role,
          accountSlug: item.accountSlug || "account",
          destination: `/${item.orgSlug}/${item.role}/${item.accountSlug || "account"}`,
        })),
      });
      window.sessionStorage.setItem(
        "hostin-session",
        JSON.stringify({
          accessToken,
          orgId: matchedRole?.orgId ?? "platform",
          userName: data.user?.fullName ?? data.platformUser?.fullName ?? roleLabel(role),
          email: data.user?.email ?? form.get("username")?.toString() ?? "",
          workspace,
          role: normalizedRole,
          themeColor: matchedRole?.themeColor,
          availableRoles: data.roles?.map((item: { orgId: string; orgSlug: string; role: string; accountSlug?: string }) => ({
            orgId: item.orgId,
            workspace: item.orgSlug,
            role: item.role,
            accountSlug: item.accountSlug || "account",
            destination: `/${item.orgSlug}/${item.role}/${item.accountSlug || "account"}`,
          })),
        })
      );
      if (matchedRole?.themeColor && !isPlatform) applyCustomColor(matchedRole.themeColor);
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

  async function logout() {
    try {
      await fetch(`${apiBase}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      /* Local session is still cleared below. */
    }
    window.sessionStorage.removeItem("hostin-session");
    setLogin(null);
    window.location.assign("/login");
  }

  if (!sessionChecked)
    return (
      <main className="sessionLoading">
        <div className="brand">
          <span>host</span>in<span>.</span>
        </div>
        <div className="skeletonLine sessionLoadingLine" />
      </main>
    );

  if (!login) {
    return (
      <main>
        <header className="topbar">
          <Link className="brand" href="/">
            <span>host</span>in<span>.</span>
          </Link>
          <nav className="topnav" aria-label="Workspace">
            <Link href="/">Home</Link>
            <a href={`/${workspace}/owner`}>Owner</a>
            <a href={`/${workspace}/tenant`}>Tenant</a>
          </nav>
          <Link className="outlineButton" href="/">
            Switch workspace
          </Link>
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
              <span>
                /{workspace}/{role}
              </span>
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
        <div className="appTopbarActions">
          {normalizedRole === "owner" ? (
            <label className="propertySwitcher">
              <span>Property</span>
              <select
                aria-label="Switch property"
                onChange={(event) => {
                  const option = propertyOptions.find((item) => item.value === event.target.value);
                  if (option && option.value !== workspace) window.location.assign(option.destination);
                }}
                value={workspace}
              >
                {propertyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <NotificationMenu accessToken={login.accessToken} isPlatform={normalizedRole === "platform"} orgId={login.orgId} />
          <ProfileMenu login={login} onLogout={logout} onOpenProfile={() => setActiveId("profile")} role={normalizedRole} workspace={propertyName} />
        </div>
      </header>

      <section className="workspace appWorkspace">
        <aside className="sidebar appSidebar">
          <div className="workspaceBadge">
            <span>{propertyName}</span>
            <strong>{roleLabel(role)}</strong>
            <small>{login.userName}</small>
          </div>
          {normalizedRole === "platform" ? (
            <div className="moduleGroup platformNavGroup">
              <p>Control center</p>
              <Link className={!profile ? "active navItem" : "navItem"} href="/1forge/platform">
                Dashboard
              </Link>
              <Link className={profile && profile !== "analytics" ? "active navItem" : "navItem"} href="/1forge/platform">
                Clients
              </Link>
              <Link className={profile === "analytics" ? "active navItem" : "navItem"} href="/1forge/platform/analytics">
                Analytics
              </Link>
            </div>
          ) : (
            <div className="moduleGroup">
              <p>Allowed modules</p>
              {allowedModules.map((module) => (
                <button className={module.id === activeModule.id ? "active navItem" : "navItem"} key={module.id} onClick={() => setActiveId(module.id)} type="button">
                  {module.title}
                </button>
              ))}
            </div>
          )}
          {normalizedRole !== "platform" && (login.availableRoles?.length ?? 0) > 1 ? (
            <div className="moduleGroup roleSwitcher">
              <p>Switch role</p>
              {login.availableRoles
                ?.filter((item) => item.workspace === workspace)
                .map((item) => (
                  <Link className={normalizeRole(item.role) === normalizedRole ? "active navItem" : "navItem"} href={item.destination} key={`${item.orgId}-${item.role}`}>
                    {roleLabel(item.role)}
                  </Link>
                ))}
            </div>
          ) : null}
          <button className="outlineButton fullButton" onClick={logout} type="button">
            Logout
          </button>
        </aside>

        <section className={normalizedRole === "platform" ? "content platformContent" : "content"}>
          {normalizedRole === "platform" ? (
            activeModule.id === "profile" ? (
              <ProfilePage login={login} onLogout={logout} role={normalizedRole} showTitle workspace={propertyName} />
            ) : (
              <PlatformSection accessToken={login.accessToken} routeView={profile} />
            )
          ) : (
            <>
              <div className="pageHeader">
                <div>
                  <p className="crumb">
                    {propertyName} / {roleLabel(role)}
                  </p>
                  <h2>{activeModule.title}</h2>
                  <p>{normalizedRole === "tenant" && activeModule.id === "gate" ? "Request an outing pass and review your permanent pass history." : normalizedRole === "tenant" && activeModule.id === "finance" ? "Review your dues, pay securely, and keep your payment history." : activeModule.description}</p>
                </div>
                {activeModule.id === "tenants" ? (
                  <button className="gradientButton" onClick={() => window.dispatchEvent(new Event("hostin:add-tenant"))} type="button">
                    Add tenant
                  </button>
                ) : normalizedRole === "tenant" && activeModule.id === "gate" ? (
                  <button className="gradientButton" onClick={() => window.dispatchEvent(new Event("hostin:request-gate-pass"))} type="button">
                    Request Gate Pass
                  </button>
                ) : normalizedRole !== "owner" && !["profile", "finance", "mess", "staff", "visitors", "gate", "community", "complaints", "announcements", "documents", "platform"].includes(activeModule.id) ? (
                  <button className="gradientButton" onClick={syncModule} type="button">
                    {activeModule.action}
                  </button>
                ) : null}
              </div>

              <div className="syncBanner">
                <span>Workspace</span>
                <p>{message}</p>
              </div>

              {activeModule.id === "profile" ? (
                <ProfilePage login={login} onLogout={logout} role={normalizedRole} workspace={propertyName} />
              ) : normalizedRole === "owner" && ownerDashboardIds.includes(activeModule.id) ? (
                <OwnerWorkspaceSection accessToken={login.accessToken} orgId={login.orgId} setActiveId={setActiveId} view={activeModule.id} />
              ) : normalizedRole === "warden" && activeModule.id === "overview" ? (
                <WardenDashboard accessToken={login.accessToken} orgId={login.orgId} setActiveId={setActiveId} userName={login.userName} workspace={propertyName} />
              ) : activeModule.id === "rooms" && ["owner", "warden"].includes(normalizedRole) ? (
                <RoomsBoard accessToken={login.accessToken} canManage={["owner", "warden"].includes(normalizedRole)} orgId={login.orgId} role={role} workspace={workspace} />
              ) : activeModule.id === "tenants" && ["owner", "warden"].includes(normalizedRole) ? (
                <TenantsSection accessToken={login.accessToken} orgId={login.orgId} workspace={workspace} />
              ) : activeModule.id === "gate" ? (
                <GatePassSection accessToken={login.accessToken} canModerate={["owner", "warden", "guard"].includes(normalizedRole)} isTenant={normalizedRole === "tenant"} orgId={login.orgId} />
              ) : activeModule.id === "visitors" ? (
                <VisitorsSection accessToken={login.accessToken} canCreate={["guard", "warden"].includes(normalizedRole)} canModerate={["owner", "warden", "guard"].includes(normalizedRole)} orgId={login.orgId} />
              ) : activeModule.id === "community" || activeModule.id === "complaints" || activeModule.id === "announcements" ? (
                <CommunitySection accessToken={login.accessToken} canCreate={activeModule.id !== "complaints" && ["owner", "warden"].includes(normalizedRole)} mode={activeModule.id === "complaints" ? "complaints" : activeModule.id === "announcements" ? "announcements" : undefined} orgId={login.orgId} role={normalizedRole} />
              ) : activeModule.id === "documents" && normalizedRole === "warden" ? (
                <DocumentsVault accessToken={login.accessToken} orgId={login.orgId} />
              ) : activeModule.id === "finance" ? (
                <FinanceSection accessToken={login.accessToken} isTenant={normalizedRole === "tenant"} orgId={login.orgId} />
              ) : activeModule.id === "mess" ? (
                <MessSection accessToken={login.accessToken} canManage={["owner", "warden", "staff"].includes(normalizedRole)} orgId={login.orgId} />
              ) : activeModule.id === "staff" ? (
                <StaffContactsSection accessToken={login.accessToken} orgId={login.orgId} />
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
                    <PanelTitle title={`${activeModule.title} records`} meta={`${(dataRows[activeModule.id] ?? []).length} items`} />
                    <RecordList rows={dataRows[activeModule.id] ?? []} />
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
            </>
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

function ProfileMenu({ login, role, workspace, onOpenProfile, onLogout }: { login: LoginState; role: Role; workspace: string; onOpenProfile: () => void; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const initials =
    login.userName
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!(event.target as Element).closest(".profileMenu")) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className={`profileMenu ${open ? "isOpen" : ""}`}>
      <button aria-expanded={open} aria-label="Profile menu" className="profileMenuButton" onClick={() => setOpen((current) => !current)} type="button">
        {initials}
      </button>
      {open ? (
        <div className="profilePopover">
          <div className="profilePopoverHeader">
            <strong>{login.userName}</strong>
            <span>
              {roleLabel(role)} · {workspace}
            </span>
            <small>{login.email}</small>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              onOpenProfile();
            }}
            type="button"
          >
            View profile
          </button>
          <Link href="/change-password">Change password</Link>
          <button onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ProfilePage({ login, role, workspace, onLogout, showTitle = false }: { login: LoginState; role: Role; workspace: string; onLogout: () => void; showTitle?: boolean }) {
  const roleAccess = login.availableRoles?.filter((item) => item.workspace === workspace.toLowerCase().replace(/\s+/g, "-")) ?? [];

  return (
    <div className="profilePageGrid">
      {showTitle ? <h2 className="profilePageTitle">Profile</h2> : null}
      <section className="panel profileHeroCard">
        <div className="profileAvatarLarge">{login.userName.slice(0, 1).toUpperCase()}</div>
        <div>
          <p className="sectionEyebrow">Posting identity</p>
          <h3>{login.userName}</h3>
          <p>Community posts, announcements, requests, and internal activity will use this profile identity.</p>
        </div>
      </section>
      <section className="panel">
        <PanelTitle title="Account details" meta={roleLabel(role)} />
        <dl className="clientDetails">
          <div>
            <dt>Name</dt>
            <dd>{login.userName}</dd>
          </div>
          <div>
            <dt>Email / Login ID</dt>
            <dd>{login.email}</dd>
          </div>
          <div>
            <dt>Current property</dt>
            <dd>{workspace}</dd>
          </div>
          <div>
            <dt>Current role</dt>
            <dd>{roleLabel(role)}</dd>
          </div>
        </dl>
      </section>
      <section className="panel">
        <PanelTitle title="Security" meta="Self-service" />
        <p className="mutedCopy">Keep this account secure because it controls how your role appears across the workspace.</p>
        <div className="profileActionRow">
          <Link className="gradientButton" href="/change-password">
            Change password
          </Link>
          <button className="outlineButton" onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      </section>
      <section className="panel">
        <PanelTitle title="Workspace access" meta={`${roleAccess.length || 1} role${(roleAccess.length || 1) === 1 ? "" : "s"}`} />
        <div className="applyRoleList">
          {(roleAccess.length ? roleAccess : [{ role, workspace }]).map((item) => (
            <span key={`${item.workspace}-${item.role}`}>
              {titleFromSlug(item.workspace)} · {roleLabel(item.role)}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function WardenDashboard({ accessToken, orgId, setActiveId, userName, workspace }: { accessToken: string; orgId: string; setActiveId: (id: SectionId) => void; userName: string; workspace: string }) {
  const [rooms, setRooms] = useState<RoomBoardRoom[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [passes, setPasses] = useState<GatePassRecord[]>([]);
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const headers = { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId };

  useEffect(() => {
    let active = true;
    Promise.all([fetch(`${apiBase}/rooms`, { headers }), fetch(`${apiBase}/complaints`, { headers }), fetch(`${apiBase}/gate-passes`, { headers }), fetch(`${apiBase}/visitors`, { headers }), fetch(`${apiBase}/documents`, { headers })])
      .then(async (responses) => Promise.all(responses.map((response) => response.json().catch(() => ({})))))
      .then(([roomData, complaintData, passData, visitorData, documentData]) => {
        if (!active) return;
        setRooms((roomData.rooms ?? []).map(mapApiRoom));
        setComplaints(complaintData.complaints ?? []);
        setPasses(passData.gatePasses ?? []);
        setVisitors(visitorData.visitors ?? []);
        setDocuments(documentData.documents ?? []);
      })
      .catch(() => {
        if (!active) return;
        setRooms([]);
        setComplaints([]);
        setPasses([]);
        setVisitors([]);
        setDocuments([]);
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, orgId]);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const availableBeds = rooms.reduce((total, room) => total + Math.max(0, room.capacity - room.currentOccupancy), 0);
  const openComplaints = complaints.filter((item) => ["open", "in_progress"].includes(item.status));
  const pendingPasses = passes.filter((item) => item.status === "pending");
  const visitorsToday = visitors.filter((item) => item.expected_visit_time?.slice(0, 10) === today);
  const waitingVisitors = visitors.filter((item) => item.status === "pending");
  const currentVisitors = visitors.filter((item) => item.status === "approved");
  const lateReturns = passes.filter((item) => item.status === "approved" && new Date(item.expected_return_time) < now);
  const pendingDocuments = documents.filter((item) => !item.is_verified);
  const urgentComplaints = openComplaints.sort((a, b) => ["urgent", "high", "medium", "low"].indexOf(a.priority) - ["urgent", "high", "medium", "low"].indexOf(b.priority)).slice(0, 4);
  const tasks: { label: string; count: number; action: string; target: SectionId }[] = [
    { label: "gate passes waiting for approval", count: pendingPasses.length, action: "Approve", target: "gate" },
    { label: "complaints needing attention", count: openComplaints.length, action: "Assign", target: "complaints" },
    { label: "tenants late to return", count: lateReturns.length, action: "Call", target: "gate" },
    { label: "visitors waiting at the gate", count: waitingVisitors.length, action: "Review", target: "visitors" },
    { label: "documents pending review", count: pendingDocuments.length, action: "Review", target: "documents" },
  ];

  return (
    <div aria-busy={isLoading} className="wardenDashboard">
      <section className="panel wardenWelcome">
        <p className="sectionEyebrow">Warden dashboard</p>
        <h2>Good morning, {userName.split(" ")[0]}</h2>
        <p>{workspace} · Here is what needs attention today.</p>
      </section>
      {isLoading ? (
        <section className="panel wardenLoading">
          <DirectorySkeleton />
        </section>
      ) : null}
      <section className="wardenKpis" aria-label="Today’s operational summary">
        {[
          ["Available Beds", availableBeds, "rooms"],
          ["Pending Complaints", openComplaints.length, "complaints"],
          ["Gate Pass Requests", pendingPasses.length, "gate"],
          ["Visitors Today", visitorsToday.length, "visitors"],
          ["Late Returns", lateReturns.length, "gate"],
        ].map(([label, value, target]) => (
          <button className="panel" key={label} onClick={() => setActiveId(target as SectionId)} type="button">
            <span>{label}</span>
            <strong>{value}</strong>
          </button>
        ))}
      </section>
      <section className="panel wardenTasks">
        <PanelTitle title="Today’s Tasks" meta={`${tasks.reduce((sum, task) => sum + task.count, 0)} actions`} />
        <div>
          {tasks.map((task) => (
            <article key={task.label}>
              <strong>{task.count}</strong>
              <span>{task.label}</span>
              <button onClick={() => setActiveId(task.target)} type="button">
                {task.action}
              </button>
            </article>
          ))}
        </div>
      </section>
      <div className="wardenOperationalGrid">
        <section className="panel wardenRoomSnapshot">
          <PanelTitle title="Room Snapshot" meta={`${rooms.length} rooms`} />
          <div>
            {rooms.slice(0, 8).map((room) => (
              <button className={getRoomState(room)} key={room.id} onClick={() => setActiveId("rooms")} type="button">
                <strong>{room.roomNumber}</strong>
                <span>{room.status === "maintenance" ? "Maintenance" : room.currentOccupancy === 0 ? "Empty" : `${room.currentOccupancy}/${room.capacity}`}</span>
              </button>
            ))}
          </div>
          <button className="textLink" onClick={() => setActiveId("rooms")} type="button">
            View all rooms →
          </button>
        </section>
        <section className="panel wardenQueue">
          <PanelTitle title="Pending Complaints" meta={`${openComplaints.length} open`} />
          {urgentComplaints.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.title || titleFromSlug(item.category)}</strong>
                <small>
                  {item.tenant?.full_name || "Resident"} · {titleFromSlug(item.priority)}
                </small>
              </div>
              <button onClick={() => setActiveId("complaints")} type="button">
                Resolve
              </button>
            </article>
          ))}
          {!urgentComplaints.length ? <EmptyPanel title="No pending complaints" copy="There is nothing urgent right now." /> : null}
        </section>
        <section className="panel wardenQueue">
          <PanelTitle title="Gate Pass Requests" meta={`${pendingPasses.length} pending`} />
          {pendingPasses.slice(0, 4).map((pass) => (
            <article key={pass.id}>
              <div>
                <strong>{pass.tenant?.full_name || "Tenant"}</strong>
                <small>
                  {pass.purpose || pass.reason} · {pass.destination}
                </small>
              </div>
              <button onClick={() => setActiveId("gate")} type="button">
                Approve
              </button>
            </article>
          ))}
          {!pendingPasses.length ? <EmptyPanel title="No pending passes" copy="New outing requests will appear here." /> : null}
        </section>
        <section className="panel wardenQueue">
          <PanelTitle title="Visitors" meta={`${waitingVisitors.length} waiting · ${currentVisitors.length} inside`} />
          {[...waitingVisitors, ...currentVisitors].slice(0, 4).map((visitor) => (
            <article key={visitor.id}>
              <div>
                <strong>{visitor.visitor_name}</strong>
                <small>
                  {visitor.status === "pending" ? "Waiting at gate" : "Currently inside"} · {visitor.tenant?.full_name || "Tenant"}
                </small>
              </div>
              <button onClick={() => setActiveId("visitors")} type="button">
                {visitor.status === "pending" ? "Review" : "Mark Exit"}
              </button>
            </article>
          ))}
          {!waitingVisitors.length && !currentVisitors.length ? <EmptyPanel title="No visitors needing attention" copy="Waiting and current visitors will appear here." /> : null}
        </section>
      </div>
    </div>
  );
}

function DocumentsVault({ accessToken, orgId }: { accessToken: string; orgId: string }) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    fetch(`${apiBase}/documents`, { headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId } })
      .then((response) => response.json())
      .then((data) => setDocuments(data.documents ?? []))
      .catch(() => setDocuments([]))
      .finally(() => setIsLoading(false));
  }, [accessToken, orgId]);
  const filtered = documents.filter((document) => (document.tenant?.full_name ?? "").toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <section className="panel">
      <PanelTitle title="Documents Vault" meta={`${documents.filter((document) => !document.is_verified).length} pending review`} />
      <div className="documentVaultToolbar">
        <label>
          <span>Filter by student name</span>
          <input aria-label="Filter documents by student name" onChange={(event) => setQuery(event.target.value)} placeholder="Search student..." type="search" value={query} />
        </label>
        <small>
          {filtered.length} of {documents.length} documents
        </small>
      </div>
      {isLoading ? (
        <DirectorySkeleton />
      ) : filtered.length ? (
        <div className="documentCardGrid">
          {filtered.map((document) => (
            <article key={document.id}>
              <div>
                <strong>{document.tenant?.full_name ?? "Student"}</strong>
                <small>{document.tenant?.email}</small>
              </div>
              <span>{titleFromSlug(document.doc_type)}</span>
              <a href={document.file_url} rel="noreferrer" target="_blank">
                {document.file_name}
              </a>
              <span className={`statusPill ${document.is_verified ? "verified" : "pending"}`}>{document.is_verified ? "Verified" : "Pending"}</span>
            </article>
          ))}
        </div>
      ) : (
        <EmptyPanel title="No matching documents" copy="Try another student name." />
      )}
    </section>
  );
}

function OwnerWorkspaceSection({ accessToken, orgId, view, setActiveId }: { accessToken: string; orgId: string; view: SectionId; setActiveId: (id: SectionId) => void }) {
  const [dashboard, setDashboard] = useState<OwnerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestTitle, setRequestTitle] = useState("Submit request to 1Forge");
  const [documentQuery, setDocumentQuery] = useState("");
  const [draft, setDraft] = useState({
    type: view === "ownerBilling" ? "plan_upgrade" : view === "ownerProperties" ? "new_property" : "credential_creation",
    title: "",
    personName: "",
    role: "tenant",
    propertyName: "",
    department: "",
    reason: "",
    requiredAccess: "",
  });
  const headers = { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId };
  const money = (value: number | string) => `₹${Number(value).toLocaleString("en-IN")}`;
  const labelFromKey = (value: string) => titleFromSlug(value.replace(/_/g, "-"));

  async function loadOwnerDashboard() {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/owner/dashboard`, { headers });
      const data = await response.json().catch(() => ({}));
      if (response.ok) setDashboard(data.dashboard);
      else setMessage(data.error ?? "Unable to load owner dashboard.");
    } catch {
      setMessage("Owner dashboard is unavailable. Start the backend and retry.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOwnerDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, orgId]);

  useEffect(() => {
    if (!isRequestOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setIsRequestOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isRequestOpen]);

  function openRequest(title: string, nextDraft: Partial<typeof draft> = {}) {
    setRequestTitle(title);
    setDraft((current) => ({
      ...current,
      ...nextDraft,
      propertyName: nextDraft.propertyName ?? current.propertyName ?? dashboard?.properties[0]?.name ?? "",
    }));
    setIsRequestOpen(true);
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fallbackTitle = `${labelFromKey(draft.type)} request`;
    const response = await fetch(`${apiBase}/owner/requests`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        title: draft.title || fallbackTitle,
        propertyName: draft.propertyName || dashboard?.properties[0]?.name,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setMessage("Request submitted to 1Forge.");
      setIsRequestOpen(false);
      setDraft((current) => ({
        ...current,
        title: "",
        personName: "",
        department: "",
        reason: "",
        requiredAccess: "",
      }));
      await loadOwnerDashboard();
    } else {
      setMessage(data.error ?? "Unable to submit request.");
    }
  }

  if (isLoading)
    return (
      <section className="panel">
        <DirectorySkeleton />
      </section>
    );
  if (!dashboard)
    return (
      <section className="panel">
        <EmptyPanel title="Owner dashboard unavailable" copy={message || "No owner data was returned."} />
      </section>
    );

  const requestTypes = ["credential_creation", "feature_request", "plan_upgrade", "new_property", "staff_addition", "document_verification", "support"];
  const requestModal = isRequestOpen ? (
    <div className="modalBackdrop" onMouseDown={() => setIsRequestOpen(false)}>
      <form className="panel ownerRequestModal" onMouseDown={(event) => event.stopPropagation()} onSubmit={submitRequest}>
        <div className="modalHeader">
          <div>
            <h3>{requestTitle}</h3>
            <p>Requests are sent to 1Forge for approval, credentialing, and workspace-level changes.</p>
          </div>
          <button aria-label="Close request form" onClick={() => setIsRequestOpen(false)} type="button">
            ×
          </button>
        </div>
        <div className="platformControlGrid">
          <label>
            <span>Request type</span>
            <select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}>
              {requestTypes.map((type) => (
                <option key={type} value={type}>
                  {labelFromKey(type)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Title</span>
            <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Night guard credential / Add parent app" />
          </label>
          <label>
            <span>Person name</span>
            <input value={draft.personName} onChange={(event) => setDraft((current) => ({ ...current, personName: event.target.value }))} placeholder="Required for credential/staff requests" />
          </label>
          <label>
            <span>Role</span>
            <select value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}>
              {["owner", "warden", "guard", "staff", "tenant", "parent"].map((role) => (
                <option key={role} value={role}>
                  {titleFromSlug(role)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Property</span>
            <select value={draft.propertyName} onChange={(event) => setDraft((current) => ({ ...current, propertyName: event.target.value }))}>
              <option value="">Current property</option>
              {dashboard.properties.map((property) => (
                <option key={property.id} value={property.name}>
                  {property.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Department / room</span>
            <input value={draft.department} onChange={(event) => setDraft((current) => ({ ...current, department: event.target.value }))} placeholder="Gate Security / Room 203" />
          </label>
        </div>
        <label>
          <span>Reason</span>
          <textarea value={draft.reason} onChange={(event) => setDraft((current) => ({ ...current, reason: event.target.value }))} placeholder="Explain why this is needed" />
        </label>
        <label>
          <span>Required access</span>
          <textarea value={draft.requiredAccess} onChange={(event) => setDraft((current) => ({ ...current, requiredAccess: event.target.value }))} placeholder="Guard dashboard + visitor management, parent app, reports..." />
        </label>
        <button className="gradientButton fullButton" type="submit">
          Submit request
        </button>
        {message ? (
          <p className="formMessage" role="status">
            {message}
          </p>
        ) : null}
      </form>
    </div>
  ) : null;
  const withRequestModal = (content: ReactNode) => (
    <>
      {content}
      {requestModal}
    </>
  );

  if (view === "ownerProperties") {
    return withRequestModal(
      <div className="ownerPageGrid">
        <section className="ownerSectionHeader panel">
          <div>
            <h3>My Properties</h3>
            <p>Switch properties from the top bar. Additions and plan changes are approved through 1Forge.</p>
          </div>
          <button className="gradientButton" onClick={() => openRequest("Request New Property", { type: "new_property", title: "Add new property" })} type="button">
            Request New Property
          </button>
        </section>
        <section className="ownerPropertyGrid">
          {dashboard.properties.map((property) => (
            <article className="panel ownerPropertyCard" key={property.id}>
              <header>
                <span className={`statusPill ${property.status}`}>{titleFromSlug(property.status)}</span>
                <b>{property.planName}</b>
              </header>
              <h3>{property.name}</h3>
              <p>
                {property.cityState} · {property.clientType || "PG / Hostel"}
              </p>
              <div className="clientQuickStats">
                <span>
                  <b>{property.activeTenants}</b>Tenants
                </span>
                <span>
                  <b>{property.availableBeds}</b>Available beds
                </span>
                <span>
                  <b>{money(property.pendingRent)}</b>Pending rent
                </span>
                <span>
                  <b>{property.openComplaints}</b>Complaints
                </span>
              </div>
              <footer>
                <button onClick={() => setActiveId("rooms")} type="button">
                  Manage rooms
                </button>
                <button onClick={() => setActiveId("staff")} type="button">
                  View Mess Manager
                </button>
                <button onClick={() => setActiveId("ownerBilling")} type="button">
                  View billing
                </button>
              </footer>
            </article>
          ))}
        </section>
      </div>
    );
  }

  if (view === "ownerPeople") {
    return withRequestModal(
      <div className="ownerPageGrid">
        <section className="ownerSectionHeader panel">
          <div>
            <h3>People & Roles</h3>
            <p>View residents and staff from live workspace records. Request new access through 1Forge.</p>
          </div>
          <button className="gradientButton" onClick={() => openRequest("Add Team Member", { type: "staff_addition", title: "Add team member" })} type="button">
            Add Team Member
          </button>
        </section>
        <section className="panel">
          <PanelTitle title="People directory" meta={`${dashboard.people.length} people`} />
          <div className="controlTable ownerPeopleTable">
            <div>
              <b>Name</b>
              <b>Role</b>
              <b>Property</b>
              <b>Room / department</b>
              <b>Account</b>
              <b>Documents</b>
            </div>
            {dashboard.people.map((person) => (
              <div key={person.id}>
                <span>
                  <strong>{person.name}</strong>
                  <small>{person.phone}</small>
                </span>
                <span>{titleFromSlug(person.role)}</span>
                <span>{person.property}</span>
                <span>{person.roomOrDepartment}</span>
                <span className={`statusPill ${person.accountStatus}`}>{titleFromSlug(person.accountStatus)}</span>
                <span>{titleFromSlug(person.documentStatus)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (view === "ownerCredentials") {
    return withRequestModal(
      <div className="ownerPageGrid">
        <section className="ownerSectionHeader panel">
          <div>
            <h3>Credentials</h3>
            <p>Each login is shown as a separate account card so owner review stays compact and readable.</p>
          </div>
          <button className="gradientButton" onClick={() => openRequest("Add Team Member", { type: "credential_creation", title: "Create team member credential" })} type="button">
            Add Team Member
          </button>
        </section>
        <section className="ownerCredentialCards">
          {dashboard.credentials.map((credential) => (
            <article className="panel ownerCredentialCard" key={`${credential.userId}-${credential.role}`}>
              <header>
                <div>
                  <h3>{credential.name}</h3>
                  <span>{credential.property}</span>
                </div>
                <span className={`statusPill ${credential.status}`}>{titleFromSlug(credential.status)}</span>
              </header>
              <dl>
                <div>
                  <dt>Role</dt>
                  <dd>{titleFromSlug(credential.role)}</dd>
                </div>
                <div>
                  <dt>Login ID</dt>
                  <dd>
                    <code>{credential.loginId}</code>
                  </dd>
                </div>
                <div>
                  <dt>Last active</dt>
                  <dd>{credential.lastActive ? new Date(credential.lastActive).toLocaleDateString("en-IN") : "Never"}</dd>
                </div>
              </dl>
              <footer>
                <button
                  onClick={() =>
                    openRequest("Request Credential Reset", {
                      type: "credential_creation",
                      title: `Reset credential for ${credential.name}`,
                      personName: credential.name,
                      role: credential.role,
                      propertyName: credential.property,
                    })
                  }
                  type="button"
                >
                  Request reset
                </button>
                <button
                  onClick={() =>
                    openRequest("Request Role Change", {
                      type: "feature_request",
                      title: `Change access for ${credential.name}`,
                      personName: credential.name,
                      role: credential.role,
                      propertyName: credential.property,
                    })
                  }
                  type="button"
                >
                  Request role change
                </button>
              </footer>
            </article>
          ))}
        </section>
      </div>
    );
  }

  if (view === "ownerRequests") {
    return withRequestModal(
      <div className="ownerPageGrid">
        <section className="ownerSectionHeader panel">
          <div>
            <h3>Requests</h3>
            <p>Track every credential, staffing, plan, property, feature, and support request submitted to 1Forge.</p>
          </div>
          <button className="gradientButton" onClick={() => openRequest("New Request", { type: "credential_creation", title: "" })} type="button">
            New Request
          </button>
        </section>
        <section className="panel">
          <PanelTitle title="Request history" meta={`${dashboard.requests.length} requests`} />
          <div className="ownerRequestList">
            {dashboard.requests.map((request) => (
              <article key={request.id}>
                <span className={`statusPill ${request.status}`}>{labelFromKey(request.status)}</span>
                <div>
                  <b>{request.title}</b>
                  <small>
                    {labelFromKey(request.type)} · {request.property}
                  </small>
                  <p>{request.reason || request.requiredAccess || "Awaiting 1Forge review."}</p>
                </div>
                <time>{new Date(request.createdAt).toLocaleDateString("en-IN")}</time>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (view === "documents") {
    const filteredDocuments = dashboard.documents.filter((document) => document.tenantName.toLowerCase().includes(documentQuery.trim().toLowerCase()));
    return (
      <section className="panel">
        <PanelTitle title="Documents Vault" meta={`${dashboard.documents.filter((document) => document.status === "pending").length} pending verification`} />
        <div className="documentVaultToolbar">
          <label>
            <span>Filter by student name</span>
            <input aria-label="Filter documents by student name" onChange={(event) => setDocumentQuery(event.target.value)} placeholder="Search student..." type="search" value={documentQuery} />
          </label>
          <small>
            {filteredDocuments.length} of {dashboard.documents.length} documents
          </small>
        </div>
        <div className="controlTable ownerDocumentsTable">
          <div>
            <b>Tenant</b>
            <b>Document</b>
            <b>File</b>
            <b>Status</b>
            <b>Uploaded</b>
          </div>
          {filteredDocuments.map((document) => (
            <div key={document.id}>
              <span>{document.tenantName}</span>
              <span>{titleFromSlug(document.type)}</span>
              <span>{document.fileName}</span>
              <span className={`statusPill ${document.status}`}>{titleFromSlug(document.status)}</span>
              <span>{new Date(document.createdAt).toLocaleDateString("en-IN")}</span>
            </div>
          ))}
        </div>
        {!filteredDocuments.length ? <EmptyPanel title="No matching documents" copy="Try another student name." /> : null}
      </section>
    );
  }

  if (view === "ownerBilling") {
    return withRequestModal(
      <div className="ownerPageGrid">
        <section className="ownerSectionHeader panel">
          <div>
            <h3>Billing & Plans</h3>
            <p>Plan limits and enabled features are controlled centrally by 1Forge.</p>
          </div>
          <button className="gradientButton" onClick={() => openRequest("Request Plan Change", { type: "plan_upgrade", title: "Upgrade or change plan" })} type="button">
            Request Plan Change
          </button>
        </section>
        <section className="ownerBillingGrid">
          {dashboard.billing.map((bill) => (
            <article className="panel" key={bill.orgId}>
              <PanelTitle title={bill.property} meta={titleFromSlug(bill.planStatus)} />
              <dl className="clientDetails">
                <div>
                  <dt>Current plan</dt>
                  <dd>{bill.planName}</dd>
                </div>
                <div>
                  <dt>Base monthly</dt>
                  <dd>{money(bill.baseMonthly)}</dd>
                </div>
                <div>
                  <dt>Included users</dt>
                  <dd>{bill.maxTenants}</dd>
                </div>
                <div>
                  <dt>Active users</dt>
                  <dd>{bill.activeUsers}</dd>
                </div>
                <div>
                  <dt>Capacity</dt>
                  <dd>{bill.totalCapacity} beds</dd>
                </div>
                <div>
                  <dt>Renewal</dt>
                  <dd>{bill.nextRenewal ? new Date(bill.nextRenewal).toLocaleDateString("en-IN") : "Not set"}</dd>
                </div>
              </dl>
              <div className="applyRoleList">
                {bill.activeFeatures.map((feature) => (
                  <span key={feature}>{labelFromKey(feature)}</span>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    );
  }

  if (view === "ownerReports") {
    return (
      <div className="ownerPageGrid">
        <section className="panel">
          <PanelTitle title="Reports" meta="Live business summary" />
          <div className="platformMetrics">
            <Metric label="Properties" value={dashboard.summary.totalProperties} meta="managed" />
            <Metric label="Tenants" value={dashboard.summary.totalTenants} meta="active" />
            <Metric label="Monthly revenue" value={money(dashboard.summary.monthlyRevenue)} meta="collected" />
            <Metric label="Pending rent" value={money(dashboard.summary.pendingRent)} meta="due" />
          </div>
        </section>
        <section className="panel">
          <PanelTitle title="Operational mix" meta="Database-backed" />
          <div className="rolePermissionMatrix">
            <h3>Role distribution</h3>
            {Object.entries(dashboard.roleCounts).map(([role, count]) => (
              <div key={role}>
                <strong>{titleFromSlug(role)}</strong>
                <span>{count} accounts</span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <PanelTitle title="Recent activity" meta={`${dashboard.recentActivity.length} events`} />
          <div className="timeline">
            {dashboard.recentActivity.map((activity) => (
              <div key={`${activity.type}-${activity.title}-${activity.date}`}>
                <span>{labelFromKey(activity.type).slice(0, 1)}</span>
                <p>
                  {activity.title}
                  <small>{new Date(activity.date).toLocaleDateString("en-IN")}</small>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (view === "ownerSettings") {
    return withRequestModal(
      <div className="ownerPageGrid">
        <section className="panel">
          <PanelTitle title="Settings" meta="1Forge managed" />
          <p className="mutedCopy">Theme colours, feature access, role apps, billing, and workspace-level policy are now controlled from the 1Forge admin dashboard so client apps stay consistent.</p>
          <div className="settingsCardGrid">
            <div>
              <b>Property switching</b>
              <span>Use the top-bar dropdown to move between assigned PGs/properties.</span>
            </div>
            <div>
              <b>Theme & branding</b>
              <span>Managed centrally by 1Forge and applied across every role app.</span>
            </div>
            <div>
              <b>Role app access</b>
              <span>Request changes here; 1Forge reviews and applies them from admin controls.</span>
            </div>
          </div>
          <button className="gradientButton" onClick={() => openRequest("Request Workspace Change", { type: "feature_request", title: "Workspace settings change" })} type="button">
            Request Workspace Change
          </button>
        </section>
        <section className="panel">
          <PanelTitle title="Current limits" meta={`${dashboard.billing.length} properties`} />
          <div className="clientDetails">
            {dashboard.billing.map((bill) => (
              <div key={bill.orgId}>
                <dt>{bill.property}</dt>
                <dd>
                  {bill.planName} · {bill.activeUsers}/{bill.maxTenants} users · {bill.totalCapacity} beds
                </dd>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="ownerDashboardHome">
      <div className="ownerWelcome panel">
        <p className="sectionEyebrow">Owner dashboard</p>
        <h2>Good morning, {dashboard.owner.name.split("@")[0]}</h2>
        <p>
          Managing {dashboard.summary.totalProperties} {dashboard.summary.totalProperties === 1 ? "property" : "properties"} under {dashboard.owner.organizationName}.
        </p>
      </div>
      <div className="platformKpis">
        <PlatformKpi label="Total properties" value={dashboard.summary.totalProperties} note="Owner portfolio" />
        <PlatformKpi label="Total tenants" value={dashboard.summary.totalTenants} note={`${dashboard.summary.availableBeds}/${dashboard.summary.totalBeds} beds available`} />
        <PlatformKpi label="Monthly revenue" value={money(dashboard.summary.monthlyRevenue)} note="Successful payments this month" />
        <PlatformKpi label="Pending rent" value={money(dashboard.summary.pendingRent)} note="Unpaid, partial, and overdue" tone="warning" />
        <PlatformKpi label="Open complaints" value={dashboard.summary.openComplaints} note="Open or in progress" tone={dashboard.summary.openComplaints ? "warning" : undefined} />
        <PlatformKpi label="Mess Managers active" value={dashboard.summary.staffActive} note="Owner, wardens, guards, mess managers, parents" />
        <PlatformKpi label="Pending requests" value={dashboard.summary.pendingRequests} note={`${dashboard.summary.pendingCredentialRequests} credentials`} tone={dashboard.summary.pendingRequests ? "warning" : undefined} />
      </div>
      <div className="ownerPageGrid">
        <section className="panel">
          <PanelTitle title="Property health overview" meta={`${dashboard.properties.length} properties`} />
          <div className="ownerPropertyMiniList">
            {dashboard.properties.map((property) => (
              <button key={property.id} onClick={() => setActiveId("ownerProperties")} type="button">
                <b>{property.name}</b>
                <span>
                  {property.activeTenants}/{property.totalBeds} tenants · {property.availableBeds} beds available
                </span>
                <small>
                  {money(property.pendingRent)} pending · {property.openComplaints} complaints
                </small>
              </button>
            ))}
          </div>
        </section>
        <section className="panel">
          <PanelTitle title="Today’s attention" meta="Needs owner action" />
          <div className="attentionList">
            {dashboard.attention.map((item) => (
              <button key={item.key} onClick={() => (item.key.includes("credential") ? setActiveId("ownerCredentials") : item.key.includes("document") ? setActiveId("documents") : item.key.includes("complaint") ? setActiveId("complaints") : setActiveId("ownerReports"))} type="button">
                <strong>{item.count}</strong>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="panel">
          <PanelTitle title="Quick actions" meta="Requests go to 1Forge" />
          <div className="quickActionGrid">
            {[
              ["Request New Credential", "ownerCredentials"],
              ["Add Team Member", "ownerCredentials"],
              ["Add New Property", "ownerProperties"],
              ["Request Plan Change", "ownerBilling"],
              ["Add Feature", "ownerBilling"],
              ["Create Announcement", "community"],
              ["Upload Document", "documents"],
              ["View Mess Manager Directory", "staff"],
            ].map(([label, id]) => (
              <button key={label} onClick={() => setActiveId(id as SectionId)} type="button">
                {label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function PlatformSection({ accessToken, routeView }: { accessToken: string; routeView?: string }) {
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [controlTab, setControlTab] = useState("overview");
  const [controlData, setControlData] = useState<PlatformControlData | null>(null);
  const [oneTimeCredential, setOneTimeCredential] = useState<{ loginId: string; temporaryPassword: string } | null>(null);
  const [overrideDraft, setOverrideDraft] = useState({
    userId: "",
    role: "tenant",
    featureKey: "community",
    decision: "block",
    reason: "",
    expiresAt: "",
  });
  const selected = organizations.find((organization) => organization.slug === routeView);
  const headers = { Authorization: `Bearer ${accessToken}` };

  async function loadPlatform() {
    setIsLoading(true);
    try {
      const [orgResponse, planResponse] = await Promise.all([fetch(`${apiBase}/platform/organizations`, { headers }), fetch(`${apiBase}/platform/plans`, { headers })]);
      const [orgData, planData] = await Promise.all([orgResponse.json(), planResponse.json()]);
      setOrganizations(orgData.organizations ?? []);
      setPlans(planData.plans ?? []);
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    loadPlatform(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [accessToken]);

  async function loadControl(orgId: string) {
    const response = await fetch(`${apiBase}/platform/organizations/${orgId}/control`, { headers });
    const data = await response.json().catch(() => ({}));
    if (response.ok) setControlData(data.control);
  }
  useEffect(() => {
    if (selected) loadControl(selected.id);
    else setControlData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  async function updateOrganization(values: Record<string, unknown>) {
    if (!selected) return;
    const response = await fetch(`${apiBase}/platform/organizations/${selected.id}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (response.ok) await loadPlatform();
  }
  async function toggleFeature(featureKey: string, isEnabled: boolean) {
    if (!selected) return;
    const response = await fetch(`${apiBase}/platform/organizations/${selected.id}/features`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ featureKey, isEnabled }),
    });
    if (response.ok) await loadPlatform();
  }
  async function updateRoleDashboard(role: string, enabled: boolean) {
    if (!selected) return;
    const response = await fetch(`${apiBase}/platform/organizations/${selected.id}/role-dashboards/${role}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ status: enabled ? "active" : "inactive" }),
    });
    if (response.ok) await loadControl(selected.id);
  }
  async function updateRolePermission(role: string, featureKey: string, isAllowed: boolean) {
    if (!selected) return;
    const response = await fetch(`${apiBase}/platform/organizations/${selected.id}/role-permissions/${role}/${featureKey}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ isAllowed }),
    });
    if (response.ok) await loadControl(selected.id);
  }
  async function updateAccountStatus(userId: string, status: string) {
    if (!selected) return;
    const response = await fetch(`${apiBase}/platform/organizations/${selected.id}/accounts/${userId}/status`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) await loadControl(selected.id);
  }
  async function resetAccountPassword(userId: string) {
    if (!selected) return;
    const response = await fetch(`${apiBase}/platform/organizations/${selected.id}/accounts/${userId}/reset-password`, {
      method: "POST",
      headers,
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setOneTimeCredential(data.account);
      await loadControl(selected.id);
    }
  }
  async function saveAccessOverride(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !overrideDraft.userId) return;
    const response = await fetch(`${apiBase}/platform/organizations/${selected.id}/access-overrides`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(overrideDraft),
    });
    if (response.ok) {
      await loadControl(selected.id);
      setOverrideDraft((current) => ({ ...current, reason: "", expiresAt: "" }));
    }
  }
  async function deleteAccessOverride(overrideId: string) {
    if (!selected) return;
    const response = await fetch(`${apiBase}/platform/organizations/${selected.id}/access-overrides/${overrideId}`, {
      method: "DELETE",
      headers,
    });
    if (response.ok) await loadControl(selected.id);
  }
  const roleLabels = ["owner", "warden", "guard", "staff", "tenant", "parent"];
  const featureKeys = Array.from(new Set(["rooms", "dues", "gate_pass", "visitor_log", "community", "mess_menu", "documents", "parent_portal", ...(selected?.features.map((feature) => feature.key).filter((key) => !key.startsWith("role_")) ?? [])]));

  if (isLoading)
    return (
      <section className="panel">
        <DirectorySkeleton />
      </section>
    );
  if (routeView === "new") return <ClientOnboardingWizard accessToken={accessToken} plans={plans} />;
  if (routeView && routeView !== "analytics" && !selected)
    return (
      <section className="panel">
        <EmptyPanel title="Client not found" copy="Return to the dashboard and choose an available client." />
      </section>
    );
  const activeOrganizations = organizations.filter((organization) => organization.isActive && ["active", "trialing"].includes(organization.planStatus));
  const mrr = activeOrganizations.reduce((total, organization) => total + Number(organization.monthlyPrice), 0);
  const filteredOrganizations = organizations.filter((organization) => {
    const matchesQuery = `${organization.name} ${organization.ownerName} ${organization.cityState ?? ""} ${organization.planName}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "active" ? organization.isActive && organization.planStatus === "active" : organization.planStatus === filter) || (filter === "suspended" && organization.workspaceStatus === "suspended") || (filter === "setup" && !["active", "suspended"].includes(organization.workspaceStatus || "active"));
    return matchesQuery && matchesFilter;
  });
  const money = (value: number | string) => `₹${Number(value).toLocaleString("en-IN")}`;

  if (routeView === "analytics") {
    const today = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const value = organizations.reduce((sum, organization) => {
        const joined = organization.createdAt ? new Date(organization.createdAt) : new Date(0);
        return joined <= end ? sum + Number(organization.monthlyPrice) : sum;
      }, 0);
      return { label: date.toLocaleDateString("en-IN", { month: "short" }), value };
    });
    const maxRevenue = Math.max(...months.map((month) => month.value), 1);
    return (
      <div className="platformPage">
        <PlatformPageHeader eyebrow="1Forge / Analytics" title="Financial analytics" copy="Subscription revenue, client contribution, and portfolio health in one view." />
        <div className="platformKpis">
          <PlatformKpi label="Monthly recurring revenue" value={money(mrr)} note={`${activeOrganizations.length} contributing clients`} />
          <PlatformKpi label="Annual run rate" value={money(mrr * 12)} note="Based on current plans" />
          <PlatformKpi label="Average revenue / client" value={money(activeOrganizations.length ? Math.round(mrr / activeOrganizations.length) : 0)} note="Active portfolio" />
          <PlatformKpi label="Pending accounts" value={organizations.filter((item) => item.planStatus === "paused" || !item.isActive).length} note="Needs attention" tone="warning" />
        </div>
        <div className="analyticsGrid">
          <section className="panel revenueChartPanel">
            <PanelTitle title="Monthly recurring revenue" meta="Last 6 months" />
            <div className="revenueBars" aria-label="Monthly recurring revenue chart">
              {months.map((month) => (
                <div key={month.label} className="revenueBarColumn">
                  <strong>{money(month.value)}</strong>
                  <div>
                    <i style={{ height: `${Math.max(8, (month.value / maxRevenue) * 100)}%` }} />
                  </div>
                  <span>{month.label}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="panel revenueMixPanel">
            <PanelTitle title="Revenue by client" meta={`${organizations.length} clients`} />
            <div className="revenueClientList">
              {[...organizations]
                .sort((a, b) => Number(b.monthlyPrice) - Number(a.monthlyPrice))
                .map((organization) => (
                  <div key={organization.id}>
                    <span className="clientAvatar">{organization.name.slice(0, 2).toUpperCase()}</span>
                    <p>
                      <strong>{organization.name}</strong>
                      <small>{organization.planName}</small>
                    </p>
                    <b>{money(organization.monthlyPrice)}</b>
                    <i>
                      <em
                        style={{
                          width: `${mrr ? Math.min(100, (Number(organization.monthlyPrice) / mrr) * 100) : 0}%`,
                        }}
                      />
                    </i>
                  </div>
                ))}
            </div>
          </section>
        </div>
        <section className="panel analyticsTablePanel">
          <PanelTitle title="Client subscription ledger" meta="Current monthly billing" />
          <div className="analyticsTable">
            <div className="analyticsTableHead">
              <span>Client</span>
              <span>Plan</span>
              <span>Status</span>
              <span>Monthly revenue</span>
              <span>Annual value</span>
            </div>
            {organizations.map((organization) => (
              <Link href={`/1forge/platform/${organization.slug}`} key={organization.id}>
                <strong>{organization.name}</strong>
                <span>{organization.planName}</span>
                <span className={`statusPill ${organization.planStatus}`}>{organization.isActive ? organization.planStatus : "suspended"}</span>
                <b>{money(organization.monthlyPrice)}</b>
                <span>{money(Number(organization.monthlyPrice) * 12)}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (selected) {
    const tabs = ["overview", "setup", "people", "accounts", "rooms", "apps & roles", "features", "access overrides", "theme & branding", "billing"];
    return (
      <div className="platformPage">
        <div className="clientControlHeader panel">
          <div className="clientAvatar large">{selected.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <p className="sectionEyebrow">Client control</p>
            <h2>{selected.name}</h2>
            <span>
              {selected.cityState || selected.slug} · {selected.planName} · {money(selected.monthlyPrice)}/month
            </span>
          </div>
          <div className="clientHeaderActions">
            {selected.workspaceStatus === "active" ? (
              <>
                <a className="outlineButton" href={`/${selected.slug}/owner`}>
                  Open client app
                </a>
                <button className="dangerButton" onClick={() => updateOrganization({ isActive: false })} type="button">
                  Suspend
                </button>
              </>
            ) : (
              <>
                <span className={`statusPill ${selected.workspaceStatus}`}>{titleFromSlug(selected.workspaceStatus || "draft")}</span>
                {selected.workspaceStatus === "suspended" ? (
                  <button className="gradientButton" onClick={() => updateOrganization({ isActive: true })} type="button">
                    Restore
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
        <label className="clientControlSelect">
          <span>Client control section</span>
          <select aria-label="Client control section" onChange={(event) => setControlTab(event.target.value)} value={controlTab}>
            {tabs.map((tab) => (
              <option key={tab} value={tab}>
                {tab.replace(/\b\w/g, (letter) => letter.toUpperCase())}
              </option>
            ))}
          </select>
        </label>
        <nav className="clientControlTabs" aria-label="Client control sections">
          {tabs.map((tab) => (
            <button className={controlTab === tab ? "active" : ""} key={tab} onClick={() => setControlTab(tab)} type="button">
              {tab.replace(/\b\w/g, (letter) => letter.toUpperCase())}
            </button>
          ))}
        </nav>
        {controlTab === "overview" ? (
          <div className="clientOverviewGrid">
            <section className="panel">
              <PanelTitle title="Client details" meta={`/${selected.slug}`} />
              <dl className="clientDetails">
                <div>
                  <dt>Owner</dt>
                  <dd>{selected.ownerName}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{selected.contactEmail || "Not added"}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{selected.contactPhone || "Not added"}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{selected.cityState || "Not added"}</dd>
                </div>
                <div>
                  <dt>Joined</dt>
                  <dd>{selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("en-IN") : "—"}</dd>
                </div>
                <div>
                  <dt>Capacity</dt>
                  <dd>{selected.totalCapacity} beds</dd>
                </div>
              </dl>
            </section>
            <section className="panel">
              <PanelTitle title="Client health" meta={selected.isActive ? "Operational" : "Attention"} />
              <div className="healthChecks">
                {[
                  ["Payment", selected.planStatus === "active" ? "Clear" : titleFromSlug(selected.planStatus)],
                  ["Usage", selected.memberCount ? "Active" : "Low usage"],
                  ["Setup", selected.totalCapacity ? "Complete" : "Incomplete"],
                  ["Occupancy", `${selected.occupancyRate}%`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <b>{value}</b>
                  </div>
                ))}
              </div>
            </section>
            <section className="panel overviewRoleStats">
              <PanelTitle title="Accounts & occupancy" meta={`${selected.memberCount} accounts`} />
              <div className="platformMetrics">
                {roleLabels.map((roleName) => (
                  <Metric key={roleName} label={titleFromSlug(roleName)} value={selected.roleCounts[roleName] ?? 0} meta="active" />
                ))}
                <Metric label="Occupancy" value={`${selected.occupancyRate}%`} meta={`${selected.activeTenantsCount}/${selected.totalCapacity}`} />
              </div>
            </section>
          </div>
        ) : null}
        {controlTab === "setup" ? (
          <section className="panel setupControl">
            <PanelTitle title="Setup checklist" meta={titleFromSlug(selected.workspaceStatus || "active")} />
            <div className="setupChecklist">
              {[
                ["Workspace created", true],
                ["Rooms added", Boolean(controlData?.floors.some((floor) => floor.rooms.length))],
                ["People imported", Boolean(controlData?.people.length)],
                ["Accounts generated", Boolean(controlData?.accounts.length)],
                ["Features selected", Boolean(selected.features.length)],
                ["Branding applied", Boolean(selected.themeColor)],
                ["Billing started", selected.planStatus === "active"],
              ].map(([label, complete]) => (
                <div key={String(label)}>
                  <span className={complete ? "complete" : "pending"}>{complete ? "✓" : "!"}</span>
                  <b>{label}</b>
                  <small>{complete ? "Complete" : "Still required"}</small>
                </div>
              ))}
            </div>
            {selected.workspaceStatus !== "active" ? (
              <Link className="gradientButton" href={`/1forge/platform/new?org=${selected.id}`}>
                Continue setup wizard
              </Link>
            ) : null}
          </section>
        ) : null}
        {controlTab === "people" ? (
          <section className="panel">
            <PanelTitle title="People directory" meta={`${controlData?.people.length ?? 0} people`} />
            <div className="controlTable peopleControlTable">
              <div>
                <b>Name</b>
                <b>Type</b>
                <b>Room</b>
                <b>Status</b>
              </div>
              {controlData?.people.map((person) => (
                <div key={person.id}>
                  <span>
                    <strong>{person.full_name}</strong>
                    <small>{person.phone}</small>
                  </span>
                  <span>{titleFromSlug(person.person_type)}</span>
                  <span>{person.room_number || "—"}</span>
                  <span className={`statusPill ${person.status}`}>{person.status}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {controlTab === "accounts" ? (
          <section className="panel">
            <PanelTitle title="Accounts & credentials" meta={`${controlData?.accounts.length ?? 0} logins`} />
            {oneTimeCredential ? (
              <div className="credentialNotice">
                <b>Temporary password—copy now</b>
                <code>{oneTimeCredential.loginId}</code>
                <code>{oneTimeCredential.temporaryPassword}</code>
                <button onClick={() => setOneTimeCredential(null)} type="button">
                  Done
                </button>
              </div>
            ) : null}
            <div className="controlTable accountControlTable">
              <div>
                <b>Person</b>
                <b>Login ID</b>
                <b>Roles</b>
                <b>Status</b>
                <b>Actions</b>
              </div>
              {controlData?.accounts.map((account) => (
                <div key={account.id}>
                  <span>
                    <strong>{account.full_name}</strong>
                    <small>{account.phone}</small>
                  </span>
                  <code>{account.email}</code>
                  <span>{account.roles.join(", ")}</span>
                  <span className={`statusPill ${account.account_status}`}>{account.force_password_change ? "Password reset required" : account.account_status}</span>
                  <span className="tableActions">
                    <button onClick={() => resetAccountPassword(account.id)} type="button">
                      Reset password
                    </button>
                    <button onClick={() => updateAccountStatus(account.id, account.account_status === "active" ? "suspended" : "active")} type="button">
                      {account.account_status === "active" ? "Suspend" : "Activate"}
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {controlTab === "rooms" ? (
          <section className="panel">
            <PanelTitle title="Property structure" meta={`${controlData?.floors.reduce((sum, floor) => sum + floor.rooms.length, 0) ?? 0} rooms`} />
            <div className="controlFloorGrid">
              {controlData?.floors.map((floor) => (
                <article key={floor.id}>
                  <h3>{floor.floor_name}</h3>
                  <div>
                    {floor.rooms.map((room) => (
                      <span key={room.id}>
                        <b>{room.room_number}</b>
                        <small>
                          {room.current_occupancy}/{room.capacity} occupied
                        </small>
                        <em>₹{Number(room.monthly_rent).toLocaleString("en-IN")}</em>
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        {controlTab === "apps & roles" ? (
          <section className="roleAppGrid">
            {roleLabels.map((roleName) => {
              const dashboard = controlData?.roleDashboards.find((item) => item.role === roleName);
              const key = `role_${roleName}`;
              const saved = selected.features.find((feature) => feature.key === key);
              const enabled = dashboard ? dashboard.status === "active" : (saved?.enabled ?? (selected.roleCounts[roleName] ?? 0) > 0);
              return (
                <article className="panel roleAppCard" key={roleName}>
                  <div>
                    <span className="clientAvatar">{roleName.slice(0, 2).toUpperCase()}</span>
                    <span className={`statusPill ${enabled ? "active" : "paused"}`}>{enabled ? "Enabled" : titleFromSlug(dashboard?.status || "Disabled")}</span>
                  </div>
                  <h3>{titleFromSlug(roleName)} App</h3>
                  <p>{roleName === "tenant" ? "Dues, passes, community and resident services." : roleName === "guard" ? "Visitor entry, gate passes and security workflows." : "Role-specific access to the client workspace."}</p>
                  <footer>
                    <small>{selected.roleCounts[roleName] ?? 0} active accounts</small>
                    <label className="switch">
                      <input checked={enabled} onChange={(event) => updateRoleDashboard(roleName, event.target.checked)} type="checkbox" />
                      <i />
                    </label>
                  </footer>
                </article>
              );
            })}
          </section>
        ) : null}
        {controlTab === "features" ? (
          <section className="panel">
            <PanelTitle title="Feature access" meta="Client and role-level policy" />
            <div className="featureManagementTable">
              {featureKeys.map((key) => {
                const enabled = selected.features.find((feature) => feature.key === key)?.enabled ?? false;
                return (
                  <div key={key}>
                    <span>
                      <strong>{titleFromSlug(key)}</strong>
                      <small>Control this capability across the client workspace.</small>
                    </span>
                    <em>{enabled ? "In use" : "Not in use"}</em>
                    <b>{selected.planName}</b>
                    <label className="switch">
                      <input checked={enabled} onChange={(event) => toggleFeature(key, event.target.checked)} type="checkbox" />
                      <i />
                    </label>
                  </div>
                );
              })}
            </div>
            <div className="rolePermissionMatrix">
              <h3>Role feature permissions</h3>
              <div className="permissionMatrixHead">
                <b>Feature</b>
                {roleLabels.map((role) => (
                  <b key={role}>{titleFromSlug(role)}</b>
                ))}
              </div>
              {featureKeys.map((feature) => (
                <div key={feature}>
                  <strong>{titleFromSlug(feature)}</strong>
                  {roleLabels.map((role) => {
                    const saved = controlData?.rolePermissions.find((permission) => permission.role === role && permission.feature_key === feature);
                    const allowed = saved?.is_allowed !== false;
                    return (
                      <label key={role}>
                        <input aria-label={`${titleFromSlug(role)} ${titleFromSlug(feature)}`} checked={allowed} onChange={(event) => updateRolePermission(role, feature, event.target.checked)} type="checkbox" />
                        <span>{allowed ? "Allow" : "Block"}</span>
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {controlTab === "access overrides" ? (
          <div className="overrideControlGrid">
            <form className="panel overrideForm" onSubmit={saveAccessOverride}>
              <PanelTitle title="Add access override" meta="Advanced control" />
              <label>
                <span>User</span>
                <select
                  onChange={(event) => {
                    const account = controlData?.accounts.find((item) => item.id === event.target.value);
                    setOverrideDraft((current) => ({
                      ...current,
                      userId: event.target.value,
                      role: account?.roles[0] || current.role,
                    }));
                  }}
                  required
                  value={overrideDraft.userId}
                >
                  <option value="">Select account</option>
                  {controlData?.accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.full_name} · {account.email}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Role</span>
                <select onChange={(event) => setOverrideDraft((current) => ({ ...current, role: event.target.value }))} value={overrideDraft.role}>
                  {(controlData?.accounts.find((item) => item.id === overrideDraft.userId)?.roles || roleLabels).map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Feature</span>
                <select onChange={(event) => setOverrideDraft((current) => ({ ...current, featureKey: event.target.value }))} value={overrideDraft.featureKey}>
                  {featureKeys.map((feature) => (
                    <option key={feature} value={feature}>
                      {titleFromSlug(feature)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Access</span>
                <select onChange={(event) => setOverrideDraft((current) => ({ ...current, decision: event.target.value }))} value={overrideDraft.decision}>
                  <option value="block">Block</option>
                  <option value="allow">Allow</option>
                </select>
              </label>
              <label>
                <span>Reason</span>
                <textarea onChange={(event) => setOverrideDraft((current) => ({ ...current, reason: event.target.value }))} value={overrideDraft.reason} />
              </label>
              <label>
                <span>Expiry date (optional)</span>
                <input onChange={(event) => setOverrideDraft((current) => ({ ...current, expiresAt: event.target.value }))} type="date" value={overrideDraft.expiresAt} />
              </label>
              <button className="gradientButton" type="submit">
                Save override
              </button>
            </form>
            <section className="panel">
              <PanelTitle title="Active overrides" meta={`${controlData?.accessOverrides.length ?? 0} rules`} />
              <div className="overrideList">
                {controlData?.accessOverrides.map((override) => (
                  <div key={override.id}>
                    <span className={`statusPill ${override.decision === "allow" ? "active" : "paused"}`}>{override.decision}</span>
                    <p>
                      <strong>{override.user.full_name}</strong>
                      <small>
                        {titleFromSlug(override.role)} · {titleFromSlug(override.feature_key)}
                      </small>
                    </p>
                    <span>{override.reason || "No reason supplied"}</span>
                    <button onClick={() => deleteAccessOverride(override.id)} type="button">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}
        {controlTab === "theme & branding" ? (
          <section className="brandingGrid">
            <div className="panel brandingControls">
              <PanelTitle title="Client theme" meta="Applies across all role apps" />
              <label>
                <span>Primary theme colour</span>
                <div className="brandColorField">
                  <input type="color" value={selected.themeColor || "#0f766e"} onChange={(event) => updateOrganization({ themeColor: event.target.value })} />
                  <strong>{selected.themeColor || "#0f766e"}</strong>
                </div>
              </label>
              <p>The saved colour is loaded automatically whenever an owner, warden, guard, mess manager, tenant, or parent signs into this client.</p>
              <div className="applyRoleList">
                {roleLabels.map((roleName) => (
                  <span key={roleName}>✓ {titleFromSlug(roleName)} App</span>
                ))}
              </div>
            </div>
            <div className="panel brandPreview" style={{ "--preview-accent": selected.themeColor || "#0f766e" } as CSSProperties}>
              <PanelTitle title="Live preview" meta="Workspace shell" />
              <div className="brandPreviewWindow">
                <aside>
                  <b>{selected.name.slice(0, 1)}</b>
                  <i />
                  <i />
                  <i />
                </aside>
                <main>
                  <small>{selected.name}</small>
                  <h3>Good morning, team.</h3>
                  <div>
                    <span />
                    <span />
                    <span />
                  </div>
                  <button type="button">Primary action</button>
                </main>
              </div>
            </div>
          </section>
        ) : null}
        {controlTab === "billing" ? (
          <section className="panel">
            <PanelTitle title="Subscription & billing" meta={`${money(selected.monthlyPrice)}/month`} />
            <div className="platformControlGrid">
              <label>
                <span>Plan</span>
                <select value={plans.find((plan) => plan.name === selected.planName)?.id ?? ""} onChange={(event) => updateOrganization({ planId: event.target.value })}>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} · {money(plan.price_monthly)}/mo
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Subscription status</span>
                <select value={selected.planStatus} onChange={(event) => updateOrganization({ planStatus: event.target.value })}>
                  {["active", "trialing", "paused", "canceled", "expired"].map((status) => (
                    <option key={status} value={status}>
                      {titleFromSlug(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Renewal / expiry date</span>
                <input onChange={(event) => updateOrganization({ planExpiresAt: event.target.value || null })} type="date" value={selected.planExpiresAt?.slice(0, 10) ?? ""} />
              </label>
              <label>
                <span>Licensed capacity</span>
                <input min="0" onBlur={(event) => updateOrganization({ totalCapacity: event.target.value })} type="number" defaultValue={selected.totalCapacity} />
              </label>
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="platformPage">
      <PlatformPageHeader
        eyebrow="1Forge / Control center"
        title="Dashboard"
        copy="A focused view of every HostIn client and what needs your attention."
        action={
          <Link className="gradientButton" href="/1forge/platform/new">
            + Add client
          </Link>
        }
      />
      <div className="platformKpis">
        <PlatformKpi label="Total clients" value={organizations.length} note="Across all plans" />
        <PlatformKpi label="Active clients" value={activeOrganizations.length} note={`${organizations.length ? Math.round((activeOrganizations.length / organizations.length) * 100) : 0}% active rate`} />
        <PlatformKpi label="Monthly recurring revenue" value={money(mrr)} note="Current subscribed plans" />
        <PlatformKpi label="Pending payments" value={organizations.filter((item) => ["paused", "expired"].includes(item.planStatus)).length} note="Clients need action" tone="warning" />
      </div>
      <section className="clientDirectory">
        <div className="clientDirectoryTools">
          <div>
            <h3>Clients</h3>
            <span>{filteredOrganizations.length} shown</span>
          </div>
          <input aria-label="Search clients" onChange={(event) => setQuery(event.target.value)} placeholder="Search by client, owner, city or plan" value={query} />
          <div className="clientFilters">
            {["all", "active", "trialing", "paused", "suspended", "setup"].map((item) => (
              <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)} type="button">
                {titleFromSlug(item)}
              </button>
            ))}
          </div>
        </div>
        <div className="clientCardGrid">
          {filteredOrganizations.map((organization) => {
            const displayStatus = organization.workspaceStatus && organization.workspaceStatus !== "active" ? organization.workspaceStatus : organization.isActive ? organization.planStatus : "suspended";
            return (
              <Link className="panel platformClientCard" href={`/1forge/platform/${organization.slug}`} key={organization.id}>
                <header>
                  <span className="clientAvatar">{organization.name.slice(0, 2).toUpperCase()}</span>
                  <span className={`statusPill ${displayStatus}`}>{titleFromSlug(displayStatus)}</span>
                </header>
                <div>
                  <h3>{organization.name}</h3>
                  <p>{organization.cityState || organization.ownerName}</p>
                </div>
                <div className="clientPlanLine">
                  <span>{organization.planName}</span>
                  <strong>
                    {money(organization.monthlyPrice)}
                    <small>/month</small>
                  </strong>
                </div>
                <div className="clientQuickStats">
                  <span>
                    <b>{organization.activeTenantsCount}</b>Tenants
                  </span>
                  <span>
                    <b>{organization.totalCapacity}</b>Capacity
                  </span>
                  <span>
                    <b>{organization.memberCount}</b>Accounts
                  </span>
                  <span>
                    <b>{organization.features.filter((item) => item.enabled).length}</b>Features
                  </span>
                </div>
                <footer>
                  <span className={organization.workspaceStatus === "active" ? "healthy" : "attention"}>● {organization.workspaceStatus === "active" ? "Healthy" : "Setup needs attention"}</span>
                  <b>Manage client →</b>
                </footer>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function PlatformPageHeader({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: ReactNode }) {
  return (
    <header className="platformPageHeader">
      <div>
        <p className="crumb">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <div className="platformHeaderAside">
        <span>{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
        {action}
      </div>
    </header>
  );
}
function PlatformKpi({ label, value, note, tone }: { label: string; value: string | number; note: string; tone?: string }) {
  return (
    <article className="panel platformKpi">
      <span>{label}</span>
      <strong>{value}</strong>
      <small className={tone || ""}>{note}</small>
    </article>
  );
}

function NotificationMenu({ accessToken, orgId, isPlatform = false }: { accessToken: string; orgId: string; isPlatform?: boolean }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const unread = notifications.filter((item) => item.status !== "read").length;

  async function loadNotifications() {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}${isPlatform ? "/platform/notifications" : "/notifications"}`, {
        headers: { Authorization: `Bearer ${accessToken}`, ...(isPlatform ? {} : { "x-org-id": orgId }) },
      });
      const data = await response.json().catch(() => ({}));
      setNotifications(data.notifications ?? []);
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    loadNotifications(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [accessToken, isPlatform, orgId]);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!(event.target as Element).closest(".notificationMenu")) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  async function markRead(id: string) {
    if (isPlatform) {
      setOpen(false);
      return;
    }
    await fetch(`${apiBase}/notifications/${id}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
    });
    await loadNotifications();
  }
  return (
    <div className={`notificationMenu ${open ? "isOpen" : ""}`}>
      <button aria-expanded={open} aria-label="Notifications" className="notificationIconButton" onClick={() => setOpen((current) => !current)} type="button">
        {unread ? <span>{unread}</span> : null}
      </button>
      {open ? (
        <div className="notificationPopover">
          <div className="notificationPopoverHeader">
            <strong>Notifications</strong>
            <small>{unread} unread</small>
          </div>
          {isLoading ? (
            <DirectorySkeleton />
          ) : notifications.length ? (
            notifications.map((item) => (
              <button className={item.status === "read" ? "notificationItem" : "notificationItem unread"} key={item.id} onClick={() => markRead(item.id)} type="button">
                <strong>{item.title}</strong>
                <p>{item.body}</p>
                <small>{formatDateTime(item.created_at)}</small>
              </button>
            ))
          ) : (
            <EmptyPanel title="All caught up" copy="New updates will appear here." />
          )}
        </div>
      ) : null}
    </div>
  );
}

function TenantsSection({ accessToken, orgId, workspace }: { accessToken: string; orgId: string; workspace: string }) {
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const selectedTenant = tenants.find((tenant) => tenant.userId === selectedUserId);
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
      setSelectedUserId((current) => (nextTenants.some((tenant: TenantRecord) => tenant.userId === current) ? current : ""));
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

  useEffect(() => {
    const open = () => setShowCreate(true);
    const close = () => setShowCreate(false);
    window.addEventListener("hostin:add-tenant", open);
    window.addEventListener("popstate", close);
    return () => {
      window.removeEventListener("hostin:add-tenant", open);
      window.removeEventListener("popstate", close);
    };
  }, []);

  useEffect(() => {
    if (!showCreate) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setShowCreate(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showCreate]);

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
        setShowCreate(false);
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
                <button className={selectedTenant?.userId === tenant.userId ? "active tenantListItem" : "tenantListItem"} key={tenant.userId} onClick={() => setSelectedUserId((current) => (current === tenant.userId ? "" : tenant.userId))} type="button">
                  <span>{getInitials(tenant.fullName)}</span>
                  <div>
                    <strong>{tenant.fullName}</strong>
                    <small>{tenant.room?.roomNumber ? `Room ${tenant.room.roomNumber}` : "Unassigned"}</small>
                  </div>
                  <em>{tenant.assignmentStatus}</em>
                </button>
              ))}
            </div>
            <div className={`tenantDetailSlot ${selectedTenant ? "isVisible" : ""}`}>{selectedTenant ? <TenantDetailCard tenant={selectedTenant} /> : null}</div>
          </div>
        ) : (
          <EmptyPanel title="No tenants found" copy="Create a tenant account first, then assign rooms from the Rooms board." />
        )}
      </section>
      {showCreate ? (
        <div className="modalBackdrop" onMouseDown={() => setShowCreate(false)} role="presentation">
          <section aria-labelledby="add-tenant-title" aria-modal="true" className="panel tenantCreateModal" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <div className="modalHeader">
              <div>
                <h3 id="add-tenant-title">Add tenant</h3>
                <p>Create the account now and assign a room later.</p>
              </div>
              <button aria-label="Close add tenant" onClick={() => setShowCreate(false)} type="button">
                ×
              </button>
            </div>
            <form className="tenantCreateForm" onSubmit={createTenant}>
              <label>
                <span>Full name</span>
                <input name="fullName" placeholder="Tenant full name" required />
              </label>
              <label>
                <span>Email</span>
                <input name="email" placeholder={`tenant@${workspace}.hostin.local`} required type="email" />
              </label>
              <label>
                <span>Phone</span>
                <input name="phone" placeholder="10 digit phone" required />
              </label>
              <label>
                <span>Temporary password</span>
                <input name="password" placeholder={`${workspace}@123`} type="text" />
              </label>
              <button className="gradientButton fullButton" disabled={isCreating} type="submit">
                {isCreating ? "Creating..." : "Create tenant"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
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
        <div>
          <span>Phone</span>
          <strong>{tenant.phone}</strong>
        </div>
        <div>
          <span>Room</span>
          <strong>{tenant.room?.roomNumber ?? "Not assigned"}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{tenant.status}</strong>
        </div>
        <div>
          <span>Company / College</span>
          <strong>{tenant.collegeOrCompany ?? "Not added"}</strong>
        </div>
        <div>
          <span>Emergency contact</span>
          <strong>{tenant.emergencyContactName ?? "Not added"}</strong>
        </div>
      </div>
    </aside>
  );
}

function GatePassSection({ accessToken, canModerate, isTenant, orgId }: { accessToken: string; canModerate: boolean; isTenant: boolean; orgId: string }) {
  const [passes, setPasses] = useState<GatePassRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);

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

  useEffect(() => {
    if (!showRequestForm) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setShowRequestForm(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [showRequestForm]);

  useEffect(() => {
    const open = () => setShowRequestForm(true);
    window.addEventListener("hostin:request-gate-pass", open);
    return () => window.removeEventListener("hostin:request-gate-pass", open);
  }, []);

  async function updatePass(id: string, status: "approved" | "rejected") {
    const response = await fetch(`${apiBase}/gate-passes/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
      body: JSON.stringify({ status }),
    });
    console.info(response.ok ? `Gate pass ${status}.` : "Gate pass update failed.");
    if (response.ok) await loadPasses();
  }

  async function requestPass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${apiBase}/gate-passes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
      body: JSON.stringify({
        purpose: form.get("purpose"),
        destination: form.get("destination"),
        expectedOutTime: form.get("expectedOutTime"),
        expectedReturnTime: form.get("expectedReturnTime"),
      }),
    });
    if (response.ok) {
      event.currentTarget.reset();
      setShowRequestForm(false);
      await loadPasses();
    }
  }

  async function cancelPass(id: string) {
    const response = await fetch(`${apiBase}/gate-passes/${id}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
    });
    if (response.ok) await loadPasses();
  }

  const pendingPasses = passes.filter((pass) => pass.status === "pending");
  const historyPasses = passes.filter((pass) => pass.status !== "pending");

  if (isTenant)
    return (
      <div className="gateTenantExperience">
        {showRequestForm ? (
          <div className="modalBackdrop" onMouseDown={() => setShowRequestForm(false)}>
            <section aria-modal="true" className="panel gatePassModal" onMouseDown={(event) => event.stopPropagation()} role="dialog">
              <div className="modalHeader">
                <div>
                  <h3>Request Gate Pass</h3>
                  <p>Share your destination and expected timings.</p>
                </div>
                <button aria-label="Close gate pass form" onClick={() => setShowRequestForm(false)} type="button">
                  ×
                </button>
              </div>
              <form className="gatePassForm" onSubmit={requestPass}>
                <label>
                  <span>Purpose</span>
                  <input name="purpose" placeholder="Home leave, outing..." required />
                </label>
                <label>
                  <span>Destination</span>
                  <input name="destination" placeholder="Where are you going?" required />
                </label>
                <label>
                  <span>Leaving</span>
                  <input name="expectedOutTime" type="datetime-local" required />
                </label>
                <label>
                  <span>Expected return</span>
                  <input name="expectedReturnTime" type="datetime-local" required />
                </label>
                <button className="gradientButton fullButton" type="submit">
                  Submit Request
                </button>
              </form>
            </section>
          </div>
        ) : null}
        <section className="panel feedPanel">
          <PanelTitle title="Pending requests" meta={`${pendingPasses.length} awaiting review`} />
          {isLoading ? (
            <DirectorySkeleton />
          ) : pendingPasses.length ? (
            <div className="recordList">
              {pendingPasses.map((pass) => (
                <GatePassRow key={pass.id} pass={pass}>
                  <button className="cancelTextButton" onClick={() => cancelPass(pass.id)} type="button">
                    Cancel request
                  </button>
                </GatePassRow>
              ))}
            </div>
          ) : (
            <EmptyPanel title="No pending requests" copy="Your new requests will appear here until reviewed." />
          )}
          <PanelTitle title="Gate pass history" meta="Permanent record" />
          {historyPasses.length ? (
            <div className="recordList">
              {historyPasses.map((pass) => (
                <GatePassRow key={pass.id} pass={pass} />
              ))}
            </div>
          ) : (
            <EmptyPanel title="No history yet" copy="Approved, rejected, cancelled, and completed passes will remain here." />
          )}
        </section>
      </div>
    );

  return (
    <section className="panel feedPanel">
      <PanelTitle title="Gate pass requests" meta={canModerate ? "Approve / Reject" : "View only"} />
      {isLoading ? (
        <DirectorySkeleton />
      ) : passes.length ? (
        <div className="recordList">
          {passes.map((pass) => (
            <article className="actionRecord" key={pass.id}>
              <div>
                <strong>{pass.tenant?.full_name ?? "Tenant"}</strong>
                <small>
                  {pass.purpose ?? pass.reason} · {pass.destination}
                </small>
                <small>Return: {formatDateTime(pass.expected_return_time)}</small>
              </div>
              <div>
                <span className={`statusPill ${pass.status}`}>{pass.status}</span>
                {canModerate && pass.status === "pending" ? (
                  <div className="inlineActions">
                    <button onClick={() => updatePass(pass.id, "approved")} type="button">
                      Approve
                    </button>
                    <button onClick={() => updatePass(pass.id, "rejected")} type="button">
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyPanel title="No gate passes" copy="Pending and historical gate passes will appear here." />
      )}
    </section>
  );
}

function GatePassRow({ children, pass }: { children?: ReactNode; pass: GatePassRecord }) {
  return (
    <article className="actionRecord">
      <div>
        <strong>{pass.purpose ?? pass.reason}</strong>
        <small>{pass.destination}</small>
        <small>Return: {formatDateTime(pass.expected_return_time)}</small>
      </div>
      <div>
        <span className={`statusPill ${pass.status}`}>{pass.status}</span>
        {children}
      </div>
    </article>
  );
}

function VisitorsSection({ accessToken, canCreate, canModerate, orgId }: { accessToken: string; canCreate: boolean; canModerate: boolean; orgId: string }) {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [filter, setFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

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

  useEffect(() => {
    if (!showCreate) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setShowCreate(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [showCreate]);

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
      setShowCreate(false);
      await loadVisitors();
    }
  }

  async function updateVisitor(id: string, status: "approved" | "rejected") {
    const response = await fetch(`${apiBase}/visitors/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
      body: JSON.stringify({ status }),
    });
    if (response.ok) await loadVisitors();
  }

  const filteredVisitors = visitors.filter((visitor) => {
    const query = filter.toLowerCase().trim();
    const matchesText = !query || visitor.visitor_name.toLowerCase().includes(query);
    const matchesDate = !dateFilter || visitor.expected_visit_time?.slice(0, 10) === dateFilter;
    return matchesText && matchesDate;
  });

  return (
    <section className="panel feedPanel">
      <div className="sectionActionHeader">
        <h3>Visitor records</h3>
        {canCreate ? (
          <button className="gradientButton" onClick={() => setShowCreate(true)} type="button">
            Add visitor
          </button>
        ) : null}
      </div>
      <div className="roomsToolbar visitorToolbar">
        <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter by visitor name..." />
        <input value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} type="date" />
        <select onChange={(event) => setDateFilter(dayToDate(event.target.value))} defaultValue="">
          <option value="">Any day</option>
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
        </select>
      </div>
      {showCreate ? (
        <div className="modalBackdrop" onMouseDown={() => setShowCreate(false)}>
          <section aria-modal="true" className="panel visitorCreateModal" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <div className="modalHeader">
              <div>
                <h3>Add visitor</h3>
                <p>Register a visitor against their host tenant.</p>
              </div>
              <button aria-label="Close visitor form" onClick={() => setShowCreate(false)} type="button">
                ×
              </button>
            </div>
            <form className="visitorModalForm" onSubmit={createVisitor}>
              <label className="formSpan">
                <span>Host tenant</span>
                <select name="tenantId" required>
                  <option value="">Select host tenant</option>
                  {tenantOptions.map((tenant) => (
                    <option key={tenant.userId} value={tenant.userId}>
                      {tenant.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Visitor name</span>
                <input name="visitorName" placeholder="Enter full name" required />
              </label>
              <label>
                <span>Phone number</span>
                <input name="visitorPhone" placeholder="Enter phone number" required />
              </label>
              <label>
                <span>Relation</span>
                <input name="visitorRelation" placeholder="Friend, parent, delivery..." required />
              </label>
              <label>
                <span>Expected visit</span>
                <input name="expectedVisitTime" type="datetime-local" required />
              </label>
              <label className="formSpan">
                <span>Purpose</span>
                <input name="purpose" placeholder="Reason for visit" required />
              </label>
              <button className="gradientButton fullButton" type="submit">
                Create visitor
              </button>
            </form>
          </section>
        </div>
      ) : null}
      {isLoading ? (
        <DirectorySkeleton />
      ) : filteredVisitors.length ? (
        <div className="recordList">
          {filteredVisitors.map((visitor) => (
            <article className="actionRecord" key={visitor.id}>
              <div>
                <strong>{visitor.visitor_name}</strong>
                <small>
                  {visitor.purpose} · Host: {visitor.tenant?.full_name ?? "Tenant"}
                </small>
                <small>{formatDateTime(visitor.expected_visit_time)}</small>
              </div>
              <div>
                <span className={`statusPill ${visitor.status}`}>{titleFromSlug(visitor.status)}</span>
                {canModerate && visitor.status === "pending" ? (
                  <div className="inlineActions">
                    <button onClick={() => updateVisitor(visitor.id, "approved")} type="button">
                      Approve Entry
                    </button>
                    <button onClick={() => updateVisitor(visitor.id, "rejected")} type="button">
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyPanel title="No visitor records" copy="Visitor entries matching your filters will appear here." />
      )}
    </section>
  );
}

function CommunitySection({ accessToken, canCreate, orgId, role, mode }: { accessToken: string; canCreate: boolean; orgId: string; role: Role; mode?: "complaints" | "announcements" }) {
  const [tab, setTab] = useState<"announcements" | "complaints" | "lost">(mode ?? "announcements");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [lostPosts, setLostPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentsFor, setCommentsFor] = useState("");
  const visibleTabs = mode ? [mode] : role === "tenant" ? ["announcements", "complaints", "lost"] : role === "parent" || role === "guard" ? ["announcements", "lost"] : ["announcements", "complaints", "lost"];

  async function loadCommunity() {
    setIsLoading(true);
    try {
      const [announcementsResponse, complaintsResponse, lostResponse] = await Promise.all([
        fetch(`${apiBase}/announcements`, { headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId } }),
        fetch(`${apiBase}/complaints`, { headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId } }),
        fetch(`${apiBase}/community/lost-found`, {
          headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
        }),
      ]);
      const announcementData = await announcementsResponse.json().catch(() => ({}));
      const complaintData = await complaintsResponse.json().catch(() => ({}));
      const lostData = await lostResponse.json().catch(() => ({}));
      setAnnouncements(announcementData.announcements ?? []);
      setComplaints(complaintData.complaints ?? []);
      setLostPosts(lostData.posts ?? []);
    } catch {
      setAnnouncements([]);
      setComplaints([]);
      setLostPosts([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCommunity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, orgId]);

  useEffect(() => {
    if (mode) setTab(mode);
  }, [mode]);

  async function updateComplaintStatus(id: string, status: "in_progress" | "resolved" | "closed") {
    const response = await fetch(`${apiBase}/complaints/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
      body: JSON.stringify({
        status,
        note: status === "closed" ? "Complaint closed" : status === "resolved" ? "Complaint resolved" : "Work started on this complaint",
      }),
    });
    if (response.ok) await loadCommunity();
  }

  const feedItems = tab === "announcements" ? announcements : tab === "complaints" ? complaints : lostPosts;

  return (
    <section className="panel feedPanel">
      <div className="communityHeader">
        <PanelTitle title={mode ? titleFromSlug(mode) : "Community"} meta={mode === "complaints" ? "Open · In progress · Resolved" : mode === "announcements" ? "Property updates" : "Announcements · Complaints · Lost/Found"} />
        {!mode ? (
          <div className="communityToggle">
            {visibleTabs.map((item) => (
              <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item as any)} type="button">
                {item === "lost" ? "Lost / Found" : titleFromSlug(item)}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {canCreate || (role === "tenant" && ["complaints", "lost"].includes(tab)) ? <CommunityComposer tab={tab} accessToken={accessToken} orgId={orgId} onPosted={loadCommunity} /> : null}
      {isLoading ? (
        <DirectorySkeleton />
      ) : feedItems.length ? (
        <div className="communityFeed">
          {feedItems.map((item) => (
            <article className="communityPost" key={item.id}>
              <div>
                <strong>{item.title ?? item.description ?? item.category}</strong>
                <small>
                  {item.publisherName ?? item.tenant?.full_name ?? "Community"} · {formatDateTime(item.createdAt ?? item.created_at)}
                </small>
              </div>
              <p>{item.body ?? item.description ?? "No description added."}</p>
              {["owner", "warden"].includes(role) && tab === "complaints" && item.status !== "closed" ? (
                <div className="inlineActions complaintActions">
                  {item.status === "open" ? (
                    <button onClick={() => updateComplaintStatus(item.id, "in_progress")} type="button">
                      Start work
                    </button>
                  ) : null}
                  {item.status !== "resolved" ? (
                    <button onClick={() => updateComplaintStatus(item.id, "resolved")} type="button">
                      Resolve
                    </button>
                  ) : (
                    <button onClick={() => updateComplaintStatus(item.id, "closed")} type="button">
                      Close
                    </button>
                  )}
                </div>
              ) : null}
              {item.imageUrls?.length ? (
                <div className="postImages">
                  {item.imageUrls.map((url: string, index: number) => (
                    <Image alt={`Lost or found attachment ${index + 1}`} height={320} key={`${item.id}-${index}`} src={url} unoptimized width={512} />
                  ))}
                </div>
              ) : null}
              {role !== "tenant" || tab === "announcements" ? (
                <div className="postActions">
                  <button onClick={() => interact(item.id, tab, "reaction", "like")} type="button">
                    Like <span>{item.reactionCount ?? 0}</span>
                  </button>
                  <button onClick={() => setCommentsFor((current) => (current === item.id ? "" : item.id))} type="button">
                    Comment <span>{item.commentCount ?? 0}</span>
                  </button>
                </div>
              ) : null}
              {(role !== "tenant" || tab === "announcements") && commentsFor === item.id ? (
                <form className="commentComposer" onSubmit={(event) => submitComment(event, item.id, tab)}>
                  <input name="comment" placeholder="Write a comment..." required />
                  <button type="submit">Post</button>
                  {(item.comments ?? []).map((comment: any) => (
                    <p key={comment.id}>
                      <strong>{comment.authorName}</strong> {comment.body}
                    </p>
                  ))}
                </form>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyPanel title="No posts yet" copy="Community posts will appear here." />
      )}
    </section>
  );

  async function interact(postId: string, postType: string, kind: string, body?: string) {
    const response = await fetch(`${apiBase}/community/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
      body: JSON.stringify({ postId, postType, kind, body }),
    });
    if (response.ok) await loadCommunity();
  }

  async function submitComment(event: FormEvent<HTMLFormElement>, postId: string, postType: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await interact(postId, postType, "comment", String(form.get("comment")));
    event.currentTarget.reset();
  }
}

function CommunityComposer({ accessToken, orgId, onPosted, tab }: { accessToken: string; orgId: string; onPosted: () => void; tab: string }) {
  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (tab === "lost") {
      const files = Array.from((form.get("images") as File)?.size ? [form.get("images") as File] : []);
      const imageUrls = await Promise.all(files.map(fileToDataUrl));
      const response = await fetch(`${apiBase}/community/lost-found`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
        body: JSON.stringify({ caption: form.get("body"), imageUrls }),
      });
      if (response.ok) {
        event.currentTarget.reset();
        onPosted();
      }
      return;
    }
    if (tab === "complaints") {
      const response = await fetch(`${apiBase}/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
        body: JSON.stringify({
          category: form.get("category"),
          title: form.get("title"),
          description: form.get("body"),
          priority: form.get("priority"),
        }),
      });
      if (response.ok) {
        event.currentTarget.reset();
        onPosted();
      }
      return;
    }
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
      {tab === "complaints" ? (
        <>
          <select aria-label="Complaint category" defaultValue="maintenance" name="category">
            <option value="maintenance">Maintenance</option>
            <option value="cleanliness">Cleanliness</option>
            <option value="food">Food</option>
            <option value="security">Security</option>
            <option value="noise">Noise</option>
            <option value="other">Other</option>
          </select>
          <select aria-label="Complaint priority" defaultValue="medium" name="priority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </>
      ) : null}
      {tab !== "lost" ? <input name="title" placeholder={`Create ${tab} post`} required /> : null}
      <input name="body" placeholder="Write details..." required />
      {tab === "lost" ? (
        <label className="imageUploadButton">
          Add image
          <input accept="image/*" name="images" type="file" />
        </label>
      ) : null}
      <button className="gradientButton" type="submit">
        Post
      </button>
    </form>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function FinanceSection({ accessToken, isTenant, orgId }: { accessToken: string; isTenant: boolean; orgId: string }) {
  const [dues, setDues] = useState<DueRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [checkoutDue, setCheckoutDue] = useState<DueRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("desc");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetch(`${apiBase}/dues`, { headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId } }).then((response) => response.json()), fetch(`${apiBase}/payments`, { headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId } }).then((response) => response.json())])
      .then(([dueData, paymentData]) => {
        setDues(dueData.dues ?? []);
        setPayments(paymentData.payments ?? []);
      })
      .catch(() => setDues([]))
      .finally(() => setIsLoading(false));
  }, [accessToken, orgId]);

  const visible = dues
    .filter((due) => {
      const paid = due.status === "paid";
      return (status === "all" || (status === "paid" ? paid : !paid)) && due.tenant.full_name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => (Number(a.amount) - Number(b.amount)) * (sort === "asc" ? 1 : -1));
  const paidDues = dues.filter((due) => due.status === "paid");
  const dueDues = dues.filter((due) => due.status !== "paid");

  async function payDue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!checkoutDue) return;
    const form = new FormData(event.currentTarget);
    const remaining = Number(checkoutDue.amount) - Number(checkoutDue.amount_paid);
    const response = await fetch(`${apiBase}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
      body: JSON.stringify({
        dueId: checkoutDue.id,
        amount: remaining,
        paymentMethod: form.get("paymentMethod"),
        gateway: "manual",
      }),
    });
    if (response.ok) {
      setCheckoutDue(null);
      const [dueData, paymentData] = await Promise.all([fetch(`${apiBase}/dues`, { headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId } }).then((item) => item.json()), fetch(`${apiBase}/payments`, { headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId } }).then((item) => item.json())]);
      setDues(dueData.dues ?? []);
      setPayments(paymentData.payments ?? []);
    }
  }

  if (isTenant)
    return (
      <section className="tenantBilling">
        <section className="panel feedPanel">
          <PanelTitle title="My dues" meta={`${dueDues.length} outstanding`} />
          {isLoading ? (
            <DirectorySkeleton />
          ) : dueDues.length ? (
            <div className="billGrid">
              {dueDues.map((due) => {
                const remaining = Number(due.amount) - Number(due.amount_paid);
                return (
                  <article className="billCard" key={due.id}>
                    <div className="billHeader">
                      <div>
                        <small>{titleFromSlug(due.due_type)}</small>
                        <strong>₹{remaining.toLocaleString("en-IN")}</strong>
                      </div>
                      <span className={`statusPill ${due.status}`}>{due.status}</span>
                    </div>
                    <dl>
                      <div>
                        <dt>Base amount</dt>
                        <dd>₹{Number(due.amount).toLocaleString("en-IN")}</dd>
                      </div>
                      <div>
                        <dt>Already paid</dt>
                        <dd>- ₹{Number(due.amount_paid).toLocaleString("en-IN")}</dd>
                      </div>
                      <div>
                        <dt>Due date</dt>
                        <dd>{new Date(due.due_date).toLocaleDateString("en-IN")}</dd>
                      </div>
                      <div className="billTotal">
                        <dt>Amount payable</dt>
                        <dd>₹{remaining.toLocaleString("en-IN")}</dd>
                      </div>
                    </dl>
                    <button className="gradientButton fullButton" onClick={() => setCheckoutDue(due)} type="button">
                      Pay now
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyPanel title="Nothing due" copy="You have no outstanding payments." />
          )}
        </section>
        <section className="panel feedPanel">
          <PanelTitle title="Payment history" meta={`${payments.length} payments`} />
          {payments.length ? (
            <div className="recordList">
              {payments.map((payment) => (
                <article className="actionRecord" key={payment.id}>
                  <div>
                    <strong>{titleFromSlug(payment.due.due_type)}</strong>
                    <small>
                      {formatDateTime(payment.paid_at)} · {titleFromSlug(payment.payment_method)}
                    </small>
                  </div>
                  <div className="dueAmount">
                    <strong>₹{Number(payment.amount).toLocaleString("en-IN")}</strong>
                    <span className={`statusPill ${payment.status}`}>{payment.status}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyPanel title="No payments yet" copy="Completed payments and their breakdown will remain here." />
          )}
        </section>
        {checkoutDue ? (
          <div className="modalBackdrop" onMouseDown={() => setCheckoutDue(null)}>
            <form className="panel checkoutModal" onMouseDown={(event) => event.stopPropagation()} onSubmit={payDue}>
              <div className="modalHeader">
                <div>
                  <h3>Payment checkout</h3>
                  <p>{titleFromSlug(checkoutDue.due_type)}</p>
                </div>
                <button aria-label="Close checkout" onClick={() => setCheckoutDue(null)} type="button">
                  ×
                </button>
              </div>
              <div className="checkoutTotal">
                <span>Total payable</span>
                <strong>₹{(Number(checkoutDue.amount) - Number(checkoutDue.amount_paid)).toLocaleString("en-IN")}</strong>
              </div>
              <label>
                <span>Payment method</span>
                <select name="paymentMethod" required>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="net_banking">Net banking</option>
                </select>
              </label>
              <button className="gradientButton fullButton" type="submit">
                Pay securely
              </button>
              <small className="checkoutNote">Payment gateway integration will replace manual confirmation in production.</small>
            </form>
          </div>
        ) : null}
      </section>
    );

  return (
    <section className="financeExperience">
      <div className="financeStats">
        <Metric label="Paid" value={`₹${sumDues(paidDues)}`} meta={`${countDueTenants(paidDues)} students`} />
        <Metric label="Due" value={`₹${sumDues(dueDues)}`} meta={`${countDueTenants(dueDues)} students`} />
      </div>
      <section className="panel feedPanel">
        <div className="roomsToolbar financeToolbar">
          <input onChange={(event) => setSearch(event.target.value)} placeholder="Search tenant name..." value={search} />
          <select onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="all">All payments</option>
            <option value="paid">Paid</option>
            <option value="due">Not paid</option>
          </select>
          <select onChange={(event) => setSort(event.target.value)} value={sort}>
            <option value="desc">Price: high to low</option>
            <option value="asc">Price: low to high</option>
          </select>
        </div>
        {isLoading ? (
          <DirectorySkeleton />
        ) : visible.length ? (
          <div className="recordList">
            {visible.map((due) => (
              <article className="actionRecord" key={due.id}>
                <div>
                  <strong>{due.tenant.full_name}</strong>
                  <small>
                    {titleFromSlug(due.due_type)} · Due {new Date(due.due_date).toLocaleDateString("en-IN")}
                  </small>
                </div>
                <div className="dueAmount">
                  <strong>₹{Number(due.amount).toLocaleString("en-IN")}</strong>
                  <span className={`statusPill ${due.status}`}>{due.status}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyPanel title="No dues found" copy="Monthly rent dues appear automatically after a tenant is assigned a room." />
        )}
      </section>
    </section>
  );
}

function MessSection({ accessToken, canManage, orgId }: { accessToken: string; canManage: boolean; orgId: string }) {
  const mealTypes = ["breakfast", "lunch", "snacks", "dinner"];
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const [items, setItems] = useState<MessItem[]>([]);
  const [weekStart, setWeekStart] = useState(getMondayInput());
  const [isLoading, setIsLoading] = useState(true);

  async function loadMenu() {
    setIsLoading(true);
    const response = await fetch(`${apiBase}/mess-menus?date=${weekStart}`, {
      headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
    });
    const data = await response.json().catch(() => ({}));
    setItems(data.menu?.items ?? []);
    setIsLoading(false);
  }
  useEffect(() => {
    loadMenu(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [weekStart, accessToken, orgId]);

  function valueFor(day: string, meal: string) {
    return items.find((item) => item.day_of_week === day && item.meal_type === meal)?.items.join(", ") ?? "";
  }
  async function saveCell(day: string, meal: string, value: string) {
    const next = items.filter((item) => !(item.day_of_week === day && item.meal_type === meal));
    const payload = [
      ...next,
      {
        day_of_week: day,
        meal_type: meal,
        items: value
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean),
      },
    ];
    const response = await fetch(`${apiBase}/mess-menus`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, "x-org-id": orgId },
      body: JSON.stringify({
        weekStartDate: weekStart,
        items: payload.map((item) => ({ dayOfWeek: item.day_of_week, mealType: item.meal_type, items: item.items })),
      }),
    });
    if (response.ok) await loadMenu();
  }

  return (
    <section className="panel feedPanel">
      <div className="menuHeader">
        <PanelTitle title="Weekly meal plan" meta="Breakfast · Lunch · Snacks · Dinner" />
        <label>
          Week of
          <input onChange={(event) => setWeekStart(event.target.value)} type="date" value={weekStart} />
        </label>
      </div>
      {isLoading ? (
        <DirectorySkeleton />
      ) : (
        <div className="messTableWrap">
          <table className="messTable">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                {mealTypes.map((meal) => (
                  <th key={meal}>{titleFromSlug(meal)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, dayIndex) => (
                <tr key={day}>
                  <td>{dateForWeekDay(weekStart, dayIndex)}</td>
                  <th>{titleFromSlug(day)}</th>
                  {mealTypes.map((meal) => (
                    <td key={meal}>{canManage ? <textarea aria-label={`${day} ${meal}`} defaultValue={valueFor(day, meal)} key={`${weekStart}-${day}-${meal}-${valueFor(day, meal)}`} onBlur={(event) => saveCell(day, meal, event.target.value)} placeholder="Add meal" /> : <span>{valueFor(day, meal) || "Not planned"}</span>}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StaffContactsSection({ accessToken, orgId }: { accessToken: string; orgId: string }) {
  const [contacts, setContacts] = useState<StaffContactRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    fetch(`${apiBase}/staff-contacts`, { headers: { Authorization: `Bearer ${accessToken}`, "x-org-id": orgId } })
      .then((response) => response.json())
      .then((data) => setContacts(data.staffContacts ?? []))
      .catch(() => setContacts([]))
      .finally(() => setIsLoading(false));
  }, [accessToken, orgId]);
  return (
    <section className="panel feedPanel">
      <PanelTitle title="Contact directory" meta={`${contacts.length} contacts`} />
      {isLoading ? (
        <DirectorySkeleton />
      ) : contacts.length ? (
        <div className="contactGrid">
          {contacts.map((contact) => (
            <article className="contactCard" key={contact.id}>
              <span>{getInitials(contact.name)}</span>
              <div>
                <strong>{contact.name}</strong>
                <small>{titleFromSlug(contact.role_type)}</small>
              </div>
              <a href={`tel:${contact.phone}`}>{contact.phone}</a>
            </article>
          ))}
        </div>
      ) : (
        <EmptyPanel title="No contacts" copy="Staff names and phone numbers will appear here." />
      )}
    </section>
  );
}

function sumDues(dues: DueRecord[]) {
  return dues.reduce((sum, due) => sum + Math.max(0, Number(due.amount) - Number(due.amount_paid)), 0).toLocaleString("en-IN");
}
function countDueTenants(dues: DueRecord[]) {
  return new Set(dues.map((due) => due.tenant.full_name)).size;
}
function getMondayInput() {
  const date = new Date();
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date.toISOString().slice(0, 10);
}
function dateForWeekDay(weekStart: string, offset: number) {
  const date = new Date(`${weekStart}T00:00:00`);
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function RoomsBoard({ accessToken, canManage, orgId, role, workspace }: { accessToken: string; canManage: boolean; orgId: string; role: string; workspace: string }) {
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
      const occupantMatch = room.occupants.some((occupant) => occupant.fullName.toLowerCase().includes(normalizedSearch));
      const matchesSearch = !normalizedSearch || room.roomNumber.toLowerCase().includes(normalizedSearch) || occupantMatch;
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
      setSelectedRoomId((current) => (current && mappedRooms.some((room: RoomBoardRoom) => room.id === current) ? current : ""));
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
      {isLoadingBoard ? (
        <RoomBoardSkeleton />
      ) : (
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
            {Array.from(new Set(rooms.map((room) => room.floorNumber)))
              .sort((a, b) => b - a)
              .map((floor) => (
                <option key={floor} value={floor}>
                  Floor {floor}
                </option>
              ))}
          </select>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter room type">
            <option value="all">All room types</option>
            {Array.from(new Set(rooms.map((room) => room.roomType))).map((type) => (
              <option key={type} value={type}>
                {formatRoomType(type)}
              </option>
            ))}
          </select>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search room or student..." />
          <div className="roomLegend">
            <span>
              <i className="full" /> Full
            </span>
            <span>
              <i className="partial" /> Partial
            </span>
            <span>
              <i className="empty" /> Empty
            </span>
            <span>
              <i className="maintenance" /> Maintenance
            </span>
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
                      <RoomCell isSelected={selectedRoom?.id === room.id} key={room.id} onSelect={() => setSelectedRoomId((current) => (current === room.id ? "" : room.id))} room={room} role={role} workspace={workspace} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="roomEmptyState">
              <strong>{loadFailed ? "Rooms could not be loaded" : "No rooms created yet"}</strong>
              <p>{loadFailed ? "Check backend, login permissions, and seeded workspace data." : "Create floors and rooms during setup to generate this visual board."}</p>
            </div>
          )}

          <aside className={`roomDetailsPanel ${selectedRoom ? "isVisible" : "isIdle"}`}>
            {selectedRoom ? (
              <>
                <div className="roomDetailsHeader">
                  <div>
                    <h3>Room {selectedRoom.roomNumber}</h3>
                    <p>
                      {selectedRoom.floorName} · {selectedRoom.currentOccupancy}/{selectedRoom.capacity} occupied
                    </p>
                  </div>
                  <span className={`statusPill ${getRoomState(selectedRoom)}`}>{getRoomState(selectedRoom)}</span>
                </div>

                <div className="occupantList">
                  <div className="occupantTitle">
                    <strong>Occupants</strong>
                    <span>
                      {selectedRoom.occupants.length}/{selectedRoom.capacity}
                    </span>
                  </div>
                  {selectedRoom.occupants.length ? (
                    selectedRoom.occupants.map((occupant) => (
                      <div className="occupantRow" key={occupant.tenantProfileId}>
                        <span>{getInitials(occupant.fullName)}</span>
                        <div>
                          <strong>{occupant.fullName}</strong>
                          <a href={`/${workspace}/${role}/tenants?student=${occupant.userId}`}>View profile</a>
                        </div>
                        {canManage ? (
                          <button onClick={() => removeTenant(occupant.tenantProfileId)} type="button">
                            Remove
                          </button>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="emptyText">No students assigned.</p>
                  )}
                </div>

                <div className="roomInfoGrid">
                  <div>
                    <span>Room type</span>
                    <strong>{formatRoomType(selectedRoom.roomType)}</strong>
                  </div>
                  <div>
                    <span>Capacity</span>
                    <strong>{selectedRoom.capacity}</strong>
                  </div>
                  <div>
                    <span>Monthly rent</span>
                    <strong>₹{selectedRoom.monthlyRent}</strong>
                  </div>
                </div>

                {canManage ? (
                  <div className="assignBox">
                    <label>
                      <span>Add or move student</span>
                      <select value={selectedTenantUserId} onChange={(event) => setSelectedTenantUserId(event.target.value)}>
                        <option value="">Select tenant</option>
                        {tenantOptions.map((tenant) => (
                          <option key={tenant.userId} value={tenant.userId}>
                            {tenant.fullName}
                            {tenant.roomNumber ? ` · ${tenant.roomNumber}` : ""}
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

function RoomCell({ isSelected, onSelect, room, role, workspace }: { isSelected: boolean; onSelect: () => void; room: RoomBoardRoom; role: string; workspace: string }) {
  const state = getRoomState(room);
  const names = room.occupants.map((occupant) => occupant.fullName);

  return (
    <button className={`roomCell ${state} ${isSelected ? "selected" : ""}`} onClick={onSelect} type="button">
      <strong>{room.roomNumber}</strong>
      <div className="bedIcons" aria-label={`${room.currentOccupancy} of ${room.capacity} occupied`}>
        {Array.from({ length: room.capacity }).map((_, index) => {
          const occupant = room.occupants[index];
          return occupant ? (
            <a className="bedIcon filled" href={`/${workspace}/${role}/tenants?student=${occupant.userId}`} key={occupant.userId} onClick={(event) => event.stopPropagation()} title={occupant.fullName}>
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
          {names.map((name) => (
            <em key={name}>{name}</em>
          ))}
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
      <button className="gradientButton fullButton" type="submit">
        {module.action}
      </button>
    </form>
  );
}

function fieldsFor(id: SectionId) {
  const map: Partial<Record<SectionId, string[]>> = {
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

  return map[id] ?? ["Search", "Notes"];
}

function workflowFor(id: SectionId) {
  const map: Partial<Record<SectionId, string[]>> = {
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

  return map[id] ?? ["Review", "Request", "Track", "Close"];
}
