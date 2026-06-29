"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";
const steps = ["Client Details", "PG Structure", "Rooms & Beds", "People Import", "Role Assignment", "Account Generation", "Feature Access", "Branding & Billing", "Review & Activate"];
const roleOptions = ["owner", "warden", "tenant", "parent", "guard", "mess_manager", "staff", "maintenance", "accountant"];
const featureOptions = ["rooms", "dues", "gate_pass", "visitor_log", "community", "mess_menu", "documents", "parent_portal"];

type Plan = { id: string; name: string; price_monthly: string | number; max_tenants: number };
type PersonDraft = { fullName: string; phone: string; email?: string; roles: string[]; roomNumber?: string; parentName?: string; parentPhone?: string; emergencyContactName?: string; emergencyContactPhone?: string; joiningDate?: string; branch?: string; createAccount: boolean; loginId?: string };
type RoomDraft = { roomNumber: string; floorNumber: number; capacity: number; monthlyRent: number; roomType: string };
type Credential = { name: string; loginId: string; temporaryPassword: string; roles: string[] };

const emptyPerson: PersonDraft = { fullName: "", phone: "", email: "", roles: ["tenant"], roomNumber: "", parentName: "", parentPhone: "", joiningDate: "", branch: "Main", createAccount: true };

export function ClientOnboardingWizard({ accessToken, plans }: { accessToken: string; plans: Plan[] }) {
  const [step, setStep] = useState(1);
  const [orgId, setOrgId] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Your progress is saved after every step.");
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [details, setDetails] = useState({ name: "", ownerName: "", ownerPhone: "", ownerEmail: "", cityState: "", address: "", slug: "", clientType: "PG", branchCount: 1, planId: plans[0]?.id || "", startDate: new Date().toISOString().slice(0, 10), billingCycle: "monthly" });
  const [structure, setStructure] = useState({ buildingNames: "Main Building", floorCount: 1, genderType: "boys", messAvailable: true, visitorAllowed: true, guardAvailable: true, parentAccess: true });
  const [roomSetup, setRoomSetup] = useState({ floorNumber: 1, start: 101, end: 110, capacity: 3, monthlyRent: 8000, roomType: "triple" });
  const [rooms, setRooms] = useState<RoomDraft[]>([]);
  const [people, setPeople] = useState<PersonDraft[]>([]);
  const [personDraft, setPersonDraft] = useState<PersonDraft>(emptyPerson);
  const [features, setFeatures] = useState<Record<string, boolean>>({ rooms: true, dues: true, gate_pass: true, visitor_log: true, community: true, mess_menu: true, documents: true, parent_portal: true });
  const [roleDashboards, setRoleDashboards] = useState<Record<string, boolean>>({ owner: true, warden: true, tenant: true, parent: true, guard: true, staff: true });
  const [branding, setBranding] = useState({ themeColor: "#7c5cff", billingCycle: "monthly", rentDueDay: 5, visitorHours: "08:00–21:00", mealTimings: "08:00, 13:00, 20:00", complaintEscalationHours: 24 });

  const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
  const floors = useMemo(() => Array.from({ length: Math.max(1, structure.floorCount) }, (_, index) => ({ floorNumber: index + 1, floorName: `Floor ${index + 1}` })), [structure.floorCount]);

  useEffect(() => {
    const resumeId = new URLSearchParams(window.location.search).get("org");
    if (!resumeId) return;
    fetch(`${apiBase}/platform/onboarding/${resumeId}`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.organization?.onboarding) throw new Error(data.error || "Unable to resume onboarding");
      const organization = data.organization;
      const onboarding = organization.onboarding;
      setOrgId(organization.id);
      setSlug(organization.slug);
      setDetails({ name: organization.name, ownerName: organization.owner_name, ownerPhone: organization.contact_phone || "", ownerEmail: organization.contact_email || "", cityState: organization.city_state, address: organization.address || "", slug: organization.slug, clientType: organization.client_type || "PG", branchCount: organization.branch_count || 1, planId: organization.plan_id, startDate: organization.start_date?.slice(0, 10) || new Date().toISOString().slice(0, 10), billingCycle: organization.billing_cycle || "monthly" });
      if (onboarding.structure_data) setStructure((current) => ({ ...current, ...onboarding.structure_data, buildingNames: (onboarding.structure_data.buildings || []).join(", ") || current.buildingNames }));
      if (Array.isArray(onboarding.rooms_data?.rooms)) setRooms(onboarding.rooms_data.rooms);
      if (Array.isArray(onboarding.people_data?.people)) setPeople(onboarding.people_data.people);
      if (onboarding.features_data?.features) setFeatures(onboarding.features_data.features);
      if (onboarding.features_data?.roleDashboards) setRoleDashboards(onboarding.features_data.roleDashboards);
      if (onboarding.branding_data) setBranding((current) => ({ ...current, ...onboarding.branding_data }));
      setStep(Math.max(2, Math.min(9, onboarding.current_step || 2)));
      setMessage("Saved onboarding draft restored.");
    }).catch((error) => setMessage(error instanceof Error ? error.message : "Unable to resume onboarding"));
  }, [accessToken]);

  function updateDetails(name: string, value: string | number) {
    setDetails((current) => ({ ...current, [name]: value, ...(name === "name" && !current.slug ? { slug: String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") } : {}) }));
  }

  function addPerson() {
    if (!personDraft.fullName.trim() || !personDraft.phone.trim()) return setMessage("Add a name and phone number before saving a person.");
    setPeople((current) => [...current, { ...personDraft, roles: personDraft.roles.length ? personDraft.roles : ["tenant"] }]);
    setPersonDraft(emptyPerson);
    setMessage("Person added to this onboarding draft.");
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const rows = (await file.text()).split(/\r?\n/).filter(Boolean).map((line) => line.split(",").map((cell) => cell.trim()));
    const header = rows.shift()?.map((cell) => cell.toLowerCase()) ?? [];
    const indexOf = (...names: string[]) => header.findIndex((cell) => names.includes(cell));
    const imported = rows.map((row) => {
      const role = row[indexOf("role", "roles")] || "tenant";
      return { fullName: row[indexOf("name", "full name")] || "", phone: row[indexOf("phone", "phone number")] || "", email: row[indexOf("email")] || "", roles: role.split(/[|;]/).map((value) => value.trim().toLowerCase().replace(/\s+/g, "_")), roomNumber: row[indexOf("room", "room number")] || "", parentName: row[indexOf("parent name")] || "", parentPhone: row[indexOf("parent phone")] || "", joiningDate: row[indexOf("joining date")] || "", branch: row[indexOf("branch")] || "Main", createAccount: true } as PersonDraft;
    }).filter((person) => person.fullName && person.phone);
    setPeople((current) => [...current, ...imported]);
    setMessage(`${imported.length} people imported from ${file.name}.`);
  }

  function generateRooms() {
    const start = Math.min(roomSetup.start, roomSetup.end);
    const end = Math.max(roomSetup.start, roomSetup.end);
    const generated = Array.from({ length: Math.min(300, end - start + 1) }, (_, index) => ({ roomNumber: String(start + index), floorNumber: roomSetup.floorNumber, capacity: roomSetup.capacity, monthlyRent: roomSetup.monthlyRent, roomType: roomSetup.roomType }));
    setRooms((current) => [...current.filter((room) => room.floorNumber !== roomSetup.floorNumber), ...generated]);
    setMessage(`${generated.length} rooms generated for Floor ${roomSetup.floorNumber}.`);
  }

  async function saveStep(number: number, data: Record<string, unknown>) {
    const response = await fetch(`${apiBase}/platform/onboarding/${orgId}/steps/${number}`, { method: "PUT", headers, body: JSON.stringify({ data }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Unable to save step ${number}`);
  }

  async function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      if (step === 1) {
        const response = await fetch(`${apiBase}/platform/onboarding`, { method: "POST", headers, body: JSON.stringify(details) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Unable to create workspace");
        setOrgId(data.organization.id);
        setSlug(data.organization.slug);
        setPeople([{ fullName: details.ownerName, phone: details.ownerPhone, email: details.ownerEmail, roles: ["owner"], branch: "Main", createAccount: true }]);
      } else if (step === 2) await saveStep(2, { ...structure, buildings: structure.buildingNames.split(",").map((name) => name.trim()).filter(Boolean) });
      else if (step === 3) {
        if (!rooms.length) throw new Error("Generate at least one room before continuing");
        await saveStep(3, { floors, rooms });
      } else if (step === 4) {
        if (!people.length) throw new Error("Add at least the owner before continuing");
        await saveStep(4, { people });
      } else if (step === 5) await saveStep(5, { assignments: people.map((person) => ({ name: person.fullName, roles: person.roles })) });
      else if (step === 6) await saveStep(6, { accountCount: people.filter((person) => person.createAccount).length, loginDomain: "hostin.app", forcePasswordChange: true });
      else if (step === 7) await saveStep(7, { features, roleDashboards, rolePermissions: [] });
      else if (step === 8) await saveStep(8, { ...branding, planId: details.planId });
      else if (step === 9) {
        await saveStep(9, { acknowledged: true, rooms: rooms.length, people: people.length, accounts: people.filter((person) => person.createAccount).length });
        const response = await fetch(`${apiBase}/platform/onboarding/${orgId}/activate`, { method: "POST", headers });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Unable to activate client");
        setCredentials(data.credentials || []);
        setMessage("Client activated. These temporary passwords are shown once—save them securely.");
        return;
      }
      setStep((current) => Math.min(9, current + 1));
      setMessage("Step saved successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save onboarding progress");
    } finally {
      setBusy(false);
    }
  }

  if (credentials.length) return <div className="platformPage"><header className="wizardSuccess panel"><span>✓</span><div><p className="sectionEyebrow">Workspace active</p><h2>{details.name} is ready.</h2><p>Download or copy these credentials now. Passwords are never stored in readable form.</p></div><Link className="gradientButton" href={`/1forge/platform/${slug}`}>Open client control</Link></header><section className="panel credentialsPanel"><div className="panelTitle"><h3>One-time credentials</h3><span>{credentials.length} accounts</span></div><div className="credentialsTable"><div><b>Name</b><b>Login ID</b><b>Temporary password</b><b>Roles</b></div>{credentials.map((credential) => <div key={credential.loginId}><span>{credential.name}</span><code>{credential.loginId}</code><code>{credential.temporaryPassword}</code><span>{credential.roles.join(", ")}</span></div>)}</div></section></div>;

  return <div className="onboardingWizard">
    <aside className="panel wizardSteps"><p className="sectionEyebrow">Create HostIn client</p><h2>Setup progress</h2><div>{steps.map((label, index) => <button className={step === index + 1 ? "active" : step > index + 1 ? "complete" : ""} disabled={index + 1 > step} key={label} onClick={() => index + 1 < step && setStep(index + 1)} type="button"><i>{step > index + 1 ? "✓" : index + 1}</i><span>{label}<small>{step > index + 1 ? "Complete" : step === index + 1 ? "In progress" : "Pending"}</small></span></button>)}</div><Link href="/1forge/platform">← Back to clients</Link></aside>
    <form className="wizardCanvas" onSubmit={next}>
      <header><div><p className="crumb">Client onboarding / Step {step} of 9</p><h1>{steps[step - 1]}</h1><p>{step === 1 ? "Create the workspace identity and subscription shell." : step === 9 ? "Confirm the setup before creating live accounts and activating access." : "Configure this layer now; you can refine it later from Client Control."}</p></div><span>{Math.round(step / 9 * 100)}% complete</span></header>
      <section className="panel wizardPanel">{step === 1 ? <div className="wizardFormGrid">
        <WizardInput label="PG / Hostel name" value={details.name} onChange={(value) => updateDetails("name", value)} required />
        <WizardInput label="Workspace slug" value={details.slug} onChange={(value) => updateDetails("slug", value)} required />
        <WizardInput label="Owner name" value={details.ownerName} onChange={(value) => updateDetails("ownerName", value)} required />
        <WizardInput label="Owner phone" value={details.ownerPhone} onChange={(value) => updateDetails("ownerPhone", value)} required />
        <WizardInput label="Owner email" type="email" value={details.ownerEmail} onChange={(value) => updateDetails("ownerEmail", value)} />
        <WizardInput label="City / State" value={details.cityState} onChange={(value) => updateDetails("cityState", value)} required />
        <WizardInput label="Address" value={details.address} onChange={(value) => updateDetails("address", value)} />
        <WizardSelect label="Client type" value={details.clientType} options={["PG", "Hostel", "Co-living", "Girls PG", "Boys PG"]} onChange={(value) => updateDetails("clientType", value)} />
        <WizardInput label="Number of branches" type="number" value={String(details.branchCount)} onChange={(value) => updateDetails("branchCount", Number(value))} required />
        <WizardSelect label="Subscription plan" value={details.planId} options={plans.map((plan) => plan.id)} labels={plans.map((plan) => `${plan.name} · ₹${Number(plan.price_monthly).toLocaleString("en-IN")}/mo`)} onChange={(value) => updateDetails("planId", value)} />
        <WizardInput label="Start date" type="date" value={details.startDate} onChange={(value) => updateDetails("startDate", value)} />
        <WizardSelect label="Billing cycle" value={details.billingCycle} options={["monthly", "quarterly", "annual"]} onChange={(value) => updateDetails("billingCycle", value)} />
      </div> : null}
      {step === 2 ? <div className="wizardFormGrid"><WizardInput label="Building names (comma separated)" value={structure.buildingNames} onChange={(value) => setStructure((current) => ({ ...current, buildingNames: value }))}/><WizardInput label="Number of floors" type="number" value={String(structure.floorCount)} onChange={(value) => setStructure((current) => ({ ...current, floorCount: Number(value) }))}/><WizardSelect label="Gender type" value={structure.genderType} options={["boys", "girls", "co-ed", "family"]} onChange={(value) => setStructure((current) => ({ ...current, genderType: value }))}/><div className="wizardChecks">{[["Mess available", "messAvailable"],["Visitors allowed", "visitorAllowed"],["Guard available", "guardAvailable"],["Parent access required", "parentAccess"]].map(([label,key]) => <label key={key}><input checked={Boolean(structure[key as keyof typeof structure])} onChange={(event) => setStructure((current) => ({ ...current, [key]: event.target.checked }))} type="checkbox"/><span>{label}</span></label>)}</div></div> : null}
      {step === 3 ? <><div className="wizardFormGrid"><WizardSelect label="Floor" value={String(roomSetup.floorNumber)} options={floors.map((floor) => String(floor.floorNumber))} labels={floors.map((floor) => floor.floorName)} onChange={(value) => setRoomSetup((current) => ({ ...current, floorNumber: Number(value) }))}/><WizardInput label="Room number from" type="number" value={String(roomSetup.start)} onChange={(value) => setRoomSetup((current) => ({ ...current, start: Number(value) }))}/><WizardInput label="Room number to" type="number" value={String(roomSetup.end)} onChange={(value) => setRoomSetup((current) => ({ ...current, end: Number(value) }))}/><WizardInput label="Capacity per room" type="number" value={String(roomSetup.capacity)} onChange={(value) => setRoomSetup((current) => ({ ...current, capacity: Number(value) }))}/><WizardInput label="Rent per bed" type="number" value={String(roomSetup.monthlyRent)} onChange={(value) => setRoomSetup((current) => ({ ...current, monthlyRent: Number(value) }))}/><WizardSelect label="Room type" value={roomSetup.roomType} options={["single", "double", "triple", "dorm"]} onChange={(value) => setRoomSetup((current) => ({ ...current, roomType: value }))}/></div><button className="outlineButton" onClick={generateRooms} type="button">Generate room range</button><div className="roomDraftPreview">{rooms.slice(0, 30).map((room) => <span key={`${room.floorNumber}-${room.roomNumber}`}><b>{room.roomNumber}</b><small>{room.capacity} beds · ₹{room.monthlyRent.toLocaleString("en-IN")}</small></span>)}</div></> : null}
      {step === 4 ? <><div className="wizardImportBar"><label className="outlineButton">Import CSV<input accept=".csv,text/csv" onChange={importCsv} type="file"/></label><span>Columns: Name, Phone, Role, Room Number, Parent Name, Parent Phone, Email, Branch, Joining Date</span></div><div className="wizardFormGrid"><WizardInput label="Full name" value={personDraft.fullName} onChange={(value) => setPersonDraft((current) => ({ ...current, fullName: value }))}/><WizardInput label="Phone" value={personDraft.phone} onChange={(value) => setPersonDraft((current) => ({ ...current, phone: value }))}/><WizardInput label="Real email (optional)" type="email" value={personDraft.email || ""} onChange={(value) => setPersonDraft((current) => ({ ...current, email: value }))}/><WizardSelect label="Primary role" value={personDraft.roles[0]} options={roleOptions} onChange={(value) => setPersonDraft((current) => ({ ...current, roles: [value] }))}/><WizardInput label="Room number (tenant)" value={personDraft.roomNumber || ""} onChange={(value) => setPersonDraft((current) => ({ ...current, roomNumber: value }))}/><WizardInput label="Parent name" value={personDraft.parentName || ""} onChange={(value) => setPersonDraft((current) => ({ ...current, parentName: value }))}/><WizardInput label="Parent phone" value={personDraft.parentPhone || ""} onChange={(value) => setPersonDraft((current) => ({ ...current, parentPhone: value }))}/><WizardInput label="Joining date" type="date" value={personDraft.joiningDate || ""} onChange={(value) => setPersonDraft((current) => ({ ...current, joiningDate: value }))}/></div><button className="outlineButton" onClick={addPerson} type="button">Add person</button><PeopleDraftTable people={people}/></> : null}
      {step === 5 ? <div className="roleAssignmentList">{people.map((person, index) => <div key={`${person.phone}-${index}`}><span><strong>{person.fullName}</strong><small>{person.phone}</small></span><input aria-label={`Roles for ${person.fullName}`} value={person.roles.join(", ")} onChange={(event) => setPeople((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, roles: event.target.value.split(",").map((role) => role.trim().toLowerCase().replace(/\s+/g, "_")) } : item))}/><small>Comma-separated roles supported</small></div>)}</div> : null}
      {step === 6 ? <div className="accountPreviewList">{people.map((person, index) => { const login = person.email || `${person.fullName.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "")}.${details.slug}@hostin.app`; return <div key={`${person.phone}-${index}`}><label><input checked={person.createAccount} onChange={(event) => setPeople((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, createAccount: event.target.checked, loginId: login } : item))} type="checkbox"/><span><strong>{person.fullName}</strong><small>{login}</small></span></label><span className="statusPill active">Password reset required</span></div>; })}</div> : null}
      {step === 7 ? <div className="accessSetupGrid"><section><h3>Client features</h3>{featureOptions.map((feature) => <label key={feature}><span><strong>{feature.replace(/_/g, " ")}</strong><small>Available across approved roles</small></span><input checked={features[feature]} onChange={(event) => setFeatures((current) => ({ ...current, [feature]: event.target.checked }))} type="checkbox"/></label>)}</section><section><h3>Role dashboards</h3>{["owner","warden","tenant","parent","guard","staff"].map((role) => <label key={role}><span><strong>{role} app</strong><small>Disable to block every {role} login</small></span><input checked={roleDashboards[role]} onChange={(event) => setRoleDashboards((current) => ({ ...current, [role]: event.target.checked }))} type="checkbox"/></label>)}</section></div> : null}
      {step === 8 ? <div className="wizardFormGrid"><label><span>Primary client colour</span><div className="brandColorField"><input type="color" value={branding.themeColor} onChange={(event) => setBranding((current) => ({ ...current, themeColor: event.target.value }))}/><strong>{branding.themeColor}</strong></div></label><WizardSelect label="Billing cycle" value={branding.billingCycle} options={["monthly","quarterly","annual"]} onChange={(value) => setBranding((current) => ({ ...current, billingCycle: value }))}/>{features.dues ? <WizardInput label="Rent due day" type="number" value={String(branding.rentDueDay)} onChange={(value) => setBranding((current) => ({ ...current, rentDueDay: Number(value) }))}/> : null}{features.visitor_log ? <WizardInput label="Visitor allowed hours" value={branding.visitorHours} onChange={(value) => setBranding((current) => ({ ...current, visitorHours: value }))}/> : null}{features.mess_menu ? <WizardInput label="Meal timings" value={branding.mealTimings} onChange={(value) => setBranding((current) => ({ ...current, mealTimings: value }))}/> : null}{features.community ? <WizardInput label="Complaint escalation hours" type="number" value={String(branding.complaintEscalationHours)} onChange={(value) => setBranding((current) => ({ ...current, complaintEscalationHours: Number(value) }))}/> : null}</div> : null}
      {step === 9 ? <div className="activationReview"><div className="activationScore"><strong>Ready to activate</strong><span>{details.name}</span></div>{[["Client details", details.name],["Rooms setup", `${rooms.length} rooms · ${rooms.reduce((sum, room) => sum + room.capacity, 0)} beds`],["People added", `${people.length} people`],["Accounts generated", `${people.filter((person) => person.createAccount).length} accounts`],["Features enabled", `${Object.values(features).filter(Boolean).length} features`],["Branding applied", branding.themeColor],["Billing configured", branding.billingCycle]].map(([label,value]) => <div className="reviewLine" key={label}><span>✓</span><b>{label}</b><small>{value}</small></div>)}<p>Activation creates real workspace records and immediately enforces subscription, role-dashboard, feature, account, and override access rules.</p></div> : null}</section>
      <footer className="wizardFooter"><p className="formMessage" role="status">{message}</p><div>{step > 1 ? <button className="outlineButton" onClick={() => setStep((current) => current - 1)} type="button">Back</button> : null}<button className="gradientButton" disabled={busy || (step > 1 && !orgId)} type="submit">{busy ? "Saving..." : step === 9 ? "Activate client workspace" : "Save and continue"}</button></div></footer>
    </form>
  </div>;
}

function WizardInput({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label><span>{label}</span><input min={type === "number" ? 0 : undefined} onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value}/></label>; }
function WizardSelect({ label, value, options, labels, onChange }: { label: string; value: string; options: string[]; labels?: string[]; onChange: (value: string) => void }) { return <label><span>{label}</span><select onChange={(event) => onChange(event.target.value)} required value={value}>{options.map((option, index) => <option key={option} value={option}>{labels?.[index] || option.replace(/_/g, " ")}</option>)}</select></label>; }
function PeopleDraftTable({ people }: { people: PersonDraft[] }) { return <div className="peopleDraftTable"><div><b>Name</b><b>Role</b><b>Room</b><b>Account</b></div>{people.map((person, index) => <div key={`${person.phone}-${index}`}><span><strong>{person.fullName}</strong><small>{person.phone}</small></span><span>{person.roles.join(", ")}</span><span>{person.roomNumber || "—"}</span><span className={`statusPill ${person.createAccount ? "active" : "paused"}`}>{person.createAccount ? "Generate" : "Person only"}</span></div>)}</div>; }
