"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useColorTheme } from "./components/theme-system";

const pains = [
  ["01", "Rooms are hard to track", "No clear view of vacant beds, occupied rooms, or upcoming availability."],
  ["02", "Rent follow-ups eat your day", "Pending dues are scattered across notebooks, sheets, and personal chats."],
  ["03", "Gate registers get messy", "Entry, exit, visitor, and gate pass records are difficult to check later."],
  ["04", "Complaints disappear", "Important requests get buried under everyday WhatsApp messages."],
  ["05", "Parents keep calling", "There is no simple, privacy-safe way to share the right updates."],
  ["06", "Staff works without one system", "Owners cannot see whether daily tasks are actually moving."],
];

const features = [
  ["▦", "Rooms & occupancy", "See every floor, room, bed, and vacancy in one visual map."],
  ["◎", "Tenant management", "Keep profiles, documents, room details, and guardian information together."],
  ["₹", "Dues & payments", "Track rent, charges, payment history, pending dues, and reminders."],
  ["↗", "Gate passes", "Move requests, approvals, check-out, and return into one clean flow."],
  ["⌂", "Visitor management", "Record visitors and maintain a searchable check-in and check-out history."],
  ["◌", "Complaints & community", "Organize notices, complaints, discussions, and lost & found."],
  ["◇", "Mess & feedback", "Publish the weekly menu and understand how residents feel about meals."],
  ["♥", "Parent access", "Share selected ward, dues, announcement, and gate pass updates safely."],
];

const roleData = {
  Owner: ["Business at a glance", "Occupancy and revenue", "Pending dues", "Staff and reports"],
  Warden: ["Daily operations", "Rooms and tenants", "Gate pass approvals", "Complaints and mess"],
  Guard: ["Approved gate passes", "Visitor entry", "Check-in and check-out", "Clear daily log"],
  Tenant: ["Room and dues", "Gate pass requests", "Complaints", "Mess menu and notices"],
  Parent: ["Selected ward updates", "Gate pass history", "Dues visibility", "Announcements"],
};

const faqs = [
  ["Will 1Forge set it up for us?", "Yes. We help map your property, rooms, users, and workflows, then train the people who will use Hostin every day."],
  ["Can my warden and guard use it separately?", "Yes. Each person gets a focused view for their work, so guards do not have to navigate owner or warden tools."],
  ["Can tenants and parents access Hostin?", "Yes. They see only the information and actions selected for their role and property."],
  ["Can I start with only a few features?", "Yes. Start with the modules you need now and add more as your operations grow."],
  ["Is Hostin useful for a small PG?", "Yes. Hostin can simplify a single property today and support more beds or properties later."],
  ["Can it support multiple properties?", "Yes. Custom plans can be configured for owners running multiple PGs, hostels, or co-living properties."],
];

export default function LandingPage() {
  useColorTheme();
  const [activeRole, setActiveRole] = useState<keyof typeof roleData>("Owner");
  const [openFaq, setOpenFaq] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(
      ".marketingPage .landingSection > *, .painCard, .featureCard, .audienceGrid article, .pricingCard, .whyGrid article, .steps article"
    ));

    items.forEach((item, index) => {
      item.classList.add("revealItem");
      item.style.setProperty("--reveal-delay", `${(index % 5) * 70}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -7%" }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="marketingPage">
      <header className="topbar marketingNav">
        <a className="brand" href="#top" aria-label="Hostin home"><span>host</span>in<span>.</span></a>
        <nav className="topnav" aria-label="Public navigation">
          <a href="#features">Features</a><a href="#roles">Who it helps</a><a href="#setup">Setup</a><a href="#pricing">Plans</a>
        </nav>
        <div className="navActions"><Link className="navLogin" href="/login">Log in</Link><a className="gradientButton" href="#demo">Book free demo</a></div>
      </header>

      <section className="newHero" id="top">
        <div className="heroCopy">
          <p className="pill">Hostel management, handled.</p>
          <h1>Run your PG like a <em>real business.</em></h1>
          <p>Manage rooms, tenants, rent, gate passes, complaints, mess, staff, and parents from one modern platform—set up for you by 1Forge.</p>
          <div className="heroActions"><a className="gradientButton" href="#demo">Book free demo <span>→</span></a><a className="outlineButton" href="#features">Explore features</a></div>
          <div className="heroProof"><span>✓ Guided setup</span><span>✓ No tech team needed</span><span>✓ Built for Indian hostels</span></div>
        </div>
        <DashboardPreview />
      </section>

      <section className="painBand landingSection">
        <div className="splitHeading"><div><p className="sectionEyebrow">The daily reality</p><h2>Still managing your hostel on registers and WhatsApp?</h2></div><p>Manual systems work—until your property grows, your team gets busy, and important details start slipping through the cracks.</p></div>
        <div className="painGrid">{pains.map(([number,title,copy]) => <article className="painCard" key={title}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section className="ecosystem landingSection">
        <div className="landingSectionHeader"><p className="sectionEyebrow">One connected system</p><h2>Hostin brings your entire hostel into one place.</h2><p>Owners, wardens, guards, tenants, staff, and parents get the right tools for their part of the day.</p></div>
        <div className="orbit"><div className="orbitCenter"><span>hostin.</span><strong>Your property,<br/>under control</strong></div>{["Owner","Warden","Guard","Tenant","Parent","Staff"].map((role, index) => <div className={`orbitRole orbitRole${index + 1}`} key={role}><i>{role.charAt(0)}</i>{role}</div>)}</div>
      </section>

      <section className="landingSection" id="features">
        <div className="splitHeading"><div><p className="sectionEyebrow">Everything you need</p><h2>One place for every moving part.</h2></div><p>From the first vacant bed to the last rent reminder, Hostin keeps your team on the same page.</p></div>
        <div className="featureGrid">{features.map(([icon,title,copy]) => <article className="featureCard" key={title}><span>{icon}</span><h3>{title}</h3><p>{copy}</p><a href="#demo">See how it works <b>→</b></a></article>)}</div>
      </section>

      <section className="showcase landingSection roomShowcase">
        <div className="showcaseCopy"><p className="sectionEyebrow">The clearest room view</p><h2>See every room, bed, and vacancy at a glance.</h2><p>Instead of searching through registers or spreadsheets, your warden can instantly see what is full, what is available, and who is staying where.</p><ul><li>Floor-wise visual room map</li><li>Live full, partial, and vacant status</li><li>Open any room to view resident details</li></ul><a className="textLink" href="#demo">See Hostin for your property →</a></div>
        <RoomMap />
      </section>

      <section className="roleSection landingSection" id="roles">
        <div className="landingSectionHeader"><p className="sectionEyebrow">Made for the whole team</p><h2>One platform. Different views for everyone.</h2><p>Everyone gets what they need—without the clutter they do not.</p></div>
        <div className="roleTabs" role="tablist">{Object.keys(roleData).map(role => <button key={role} className={activeRole === role ? "active" : ""} onClick={() => setActiveRole(role as keyof typeof roleData)}>{role}</button>)}</div>
        <div className="rolePreview"><div className="roleScreen" key={`screen-${activeRole}`}><div className="miniSidebar"><b>hostin.</b>{["Overview","Rooms","Residents","Payments","Community"].map((item,index)=><span className={index===0?"selected":""} key={item}>{item}</span>)}</div><div className="miniMain"><small>{activeRole} dashboard</small><h3>Good morning, {activeRole}.</h3><div className="miniMetrics">{roleData[activeRole].slice(0,3).map((item,index)=><div key={item}><span>{item}</span><strong>{["92%","₹48k","12"][index]}</strong></div>)}</div><div className="miniChart"><span style={{height:"44%"}}/><span style={{height:"63%"}}/><span style={{height:"52%"}}/><span style={{height:"78%"}}/><span style={{height:"88%"}}/><span style={{height:"72%"}}/></div></div></div><div className="roleBenefits" key={`benefits-${activeRole}`}><span className="roleInitial">{activeRole.charAt(0)}</span><h3>{activeRole} view</h3>{roleData[activeRole].map(item => <p key={item}>✓ {item}</p>)}</div></div>
      </section>

      <section className="darkSection landingSection safetySection"><div><p className="sectionEyebrow">Safer daily operations</p><h2>More control for your staff.<br/>More trust for parents.</h2><p>Digital gate pass records, visitor logs, emergency contacts, entry history, and trackable complaints create a clear record of everyday hostel life.</p><div className="safetyTags">{["Gate pass records","Visitor logs","Entry history","Emergency contacts","Staff accountability","Complaint tracking"].map(x=><span key={x}>✓ {x}</span>)}</div></div><div className="gateCard"><div className="gateHead"><span>Today at the gate</span><b>Live</b></div>{[["Aarav Mehta","Out • 6:40 PM"],["Nisha Rao","Returned • 7:12 PM"],["Visitor: R. Singh","Checked in • 7:25 PM"]].map(([name,status],i)=><div className="gateRow" key={name}><i>{i===2?"V":name.charAt(0)}</i><p><strong>{name}</strong><span>{status}</span></p><b>✓</b></div>)}</div></section>

      <section className="showcase landingSection financeShowcase"><div className="financeMock"><div className="financeTop"><span>June collections</span><b>₹4,86,000</b><small>84% collected</small></div><div className="progress"><i/></div>{[["Paid","64 residents","₹4,86,000"],["Pending","12 residents","₹82,500"],["Overdue","4 residents","₹28,000"]].map(row=><div className="moneyRow" key={row[0]}><span>{row[0]}<small>{row[1]}</small></span><strong>{row[2]}</strong></div>)}</div><div className="showcaseCopy"><p className="sectionEyebrow">Payments made visible</p><h2>Stop chasing rent room to room.</h2><p>Know who paid, who did not, and what is pending—instantly. Track rent, electricity, damage charges, payment history, and reminders tenant by tenant.</p><a className="textLink" href="#demo">Explore dues and payments →</a></div></section>

      <section className="communitySection landingSection"><div className="landingSectionHeader"><p className="sectionEyebrow">Calmer communication</p><h2>Replace scattered WhatsApp messages.</h2><p>Important updates stay organized, visible, and trackable in one shared community space.</p></div><div className="communityMock"><div className="communityTabs"><b>Announcements</b><span>Complaints</span><span>Lost & Found</span></div><article><i>HN</i><div><small>HOSTEL NOTICE • 10:30 AM</small><h3>Water tank cleaning on Sunday</h3><p>Supply will pause between 11 AM and 1 PM. Please plan accordingly.</p></div><b>New</b></article><article><i>RK</i><div><small>MAINTENANCE • ROOM 204</small><h3>Bathroom tap repair</h3><p>Assigned to Manoj • Expected today</p></div><b className="resolved">In progress</b></article></div></section>

      <section className="parentStrip landingSection"><div><span className="bigIcon">♥</span><p className="sectionEyebrow">Parent confidence</p><h2>Give parents peace of mind—without giving up privacy.</h2><p>Parents can see selected ward updates, dues, gate pass history, and important announcements. Your hostel stays fully in control of what is shared.</p></div><div className="phoneMock"><div className="phoneTop"><b>hostin.</b><span>Parent view</span></div><p>Good evening, Mrs. Sharma</p><div className="wardCard"><small>Your ward</small><strong>Ananya Sharma</strong><span>Room 302 • Checked in</span></div>{["Latest gate pass","Dues status","Announcements"].map((x,i)=><div className="phoneRow" key={x}><i>{["↗","₹","◌"][i]}</i><span>{x}<small>{["Returned at 7:12 PM","All paid","2 new updates"][i]}</small></span><b>›</b></div>)}</div></section>

      <section className="setupSection landingSection" id="setup"><div className="setupIntro"><p className="sectionEyebrow">Managed by 1Forge</p><h2>You do not need a tech team. We set it up for you.</h2><p>We map your property, configure the right tools, onboard your people, and stay around after launch.</p><div className="setupChecks">{["Property and room mapping","Staff account setup","Tenant onboarding support","Owner, warden, and guard training","Feature customization","Monthly support"].map(x=><span key={x}>✓ {x}</span>)}</div></div><div className="steps">{[["01","We understand your property","Rooms, beds, staff, rent cycle, and rules."],["02","We set up Hostin","Your data, users, features, and views."],["03","Your team goes live","Everyone gets access and practical training."],["04","We support you monthly","Updates, changes, and help when needed."]].map(([num,title,copy])=><article key={num}><b>{num}</b><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div></section>

      <section className="modules landingSection"><div className="splitHeading"><div><p className="sectionEyebrow">Built around your property</p><h2>Start with what you need. Add more as you grow.</h2></div><p>Choose the parts that solve today’s problems. Your Hostin setup can evolve with your hostel.</p></div><div className="moduleCloud">{["Rooms","Tenants","Gate Pass","Visitors","Payments","Mess","Parent Portal","Community","Documents","Reports"].map((x,i)=><span className={i<4?"featured":""} key={x}>{i<4?"✓ ":"＋ "}{x}</span>)}</div></section>

      <section className="audience landingSection"><div className="landingSectionHeader"><p className="sectionEyebrow">Who Hostin is for</p><h2>Made for properties of every shape and size.</h2></div><div className="audienceGrid">{["Boys PG","Girls PG","Student hostels","Professional PGs","College hostels","Co-living spaces","Multi-property owners","Staff accommodation"].map((x,i)=><article key={x}><span>{["♂","♀","⌂","◇","▦","◎","↗","◌"][i]}</span><h3>{x}</h3></article>)}</div></section>

      <section className="whySection landingSection"><div><p className="sectionEyebrow">Why Hostin by 1Forge</p><h2>Not a generic CRM wearing a hostel badge.</h2><p>Hostin is designed around how Indian PGs and hostels actually operate—from the front gate to the owner’s reports.</p><a className="gradientButton" href="#demo">Talk to our team</a></div><div className="whyGrid">{["Purpose-built for PGs and hostels","Friendly for owners, staff, tenants, and parents","Setup and training handled by 1Forge","Works for one PG or a growing portfolio","Custom workflows when you need them","Ongoing monthly support available"].map((x,i)=><article key={x}><b>0{i+1}</b><p>{x}</p></article>)}</div></section>

      <section className="pricingSection landingSection" id="pricing"><div className="landingSectionHeader"><p className="sectionEyebrow">Flexible plans</p><h2>A plan that fits your property—not the other way around.</h2><p>Pricing is based on your number of beds, properties, and selected modules.</p></div><div className="pricingGrid">{[["Starter","For small PGs taking the first step online.","Core room and tenant operations"],["Growth","For active hostels with staff and daily workflows.","Operations, gate, payments, and community"],["Custom","For multi-property owners and advanced needs.","Tailored modules, workflows, and support"]].map(([title,copy,detail],i)=><article className={`pricingCard ${i===1?"popular":""}`} key={title}>{i===1&&<span>Most popular</span>}<small>{title}</small><h3>Custom pricing</h3><p>{copy}</p><strong>✓ {detail}</strong><a className={i===1?"gradientButton":"outlineButton"} href="#demo">Get custom pricing</a></article>)}</div></section>

      <section className="faqSection landingSection"><div><p className="sectionEyebrow">Frequently asked</p><h2>Questions before you make the switch?</h2><p>Good. A new system should make sense before it becomes part of your day.</p></div><div className="faqList">{faqs.map(([question,answer],index)=><article className={openFaq===index?"open":""} key={question}><button onClick={()=>setOpenFaq(openFaq===index?-1:index)}><span>{question}</span><b>{openFaq===index?"−":"+"}</b></button>{openFaq===index&&<p>{answer}</p>}</article>)}</div></section>

      <section className="demoSection landingSection" id="demo"><div className="demoCopy"><p className="sectionEyebrow">Your next, calmer workday</p><h2>Ready to make your hostel easier to manage?</h2><p>Book a free Hostin demo and see how your rooms, tenants, dues, gate passes, complaints, and staff operations can move into one clean system.</p><div className="demoPoint"><b>30 min</b><span>Personal product walkthrough</span></div><div className="demoPoint"><b>₹0</b><span>No-obligation consultation</span></div></div><form className="demoForm" onSubmit={event=>{event.preventDefault();setSubmitted(true)}}>{submitted?<div className="successMessage"><span>✓</span><h3>Demo request received.</h3><p>Thanks—we’ll get in touch to understand your property.</p><button type="button" className="outlineButton" onClick={()=>setSubmitted(false)}>Submit another</button></div>:<><h3>Book your free demo</h3><div className="formRow"><label><span>Your name</span><input required placeholder="Name" /></label><label><span>Phone number</span><input required type="tel" placeholder="+91 98765 43210" /></label></div><div className="formRow"><label><span>City</span><input required placeholder="Bengaluru" /></label><label><span>Property type</span><select defaultValue=""><option value="" disabled>Select type</option><option>PG</option><option>Hostel</option><option>Co-living</option><option>Other</option></select></label></div><label><span>Number of beds</span><input type="number" min="1" placeholder="e.g. 80" /></label><label><span>Anything we should know?</span><textarea placeholder="Tell us about your property or current challenges" /></label><button className="gradientButton fullButton" type="submit">Book free demo →</button><small>By submitting, you agree to be contacted about Hostin.</small></>}</form></section>

      <footer className="marketingFooter"><a className="brand" href="#top"><span>host</span>in<span>.</span></a><p>A fully managed hostel and PG operating system by 1Forge.</p><div><a href="#features">Features</a><a href="#setup">Setup</a><a href="#pricing">Plans</a><Link href="/login">Log in</Link></div><small>© {new Date().getFullYear()} 1Forge. Built for better hostel operations.</small></footer>
    </main>
  );
}

function DashboardPreview() {
  return <div className="dashboardPreview"><div className="previewTop"><b>hostin.</b><span>City House · Owner</span><i>KS</i></div><div className="previewBody"><aside><b>Overview</b><span>Rooms</span><span>Residents</span><span>Payments</span><span>Gate activity</span><span>Community</span></aside><section><small>MONDAY, 28 JUNE</small><h3>Good morning, Kavya.</h3><div className="previewMetrics"><article><span>Occupancy</span><b>92%</b><small>74 of 80 beds</small></article><article><span>Pending dues</span><b>₹48k</b><small>12 residents</small></article><article><span>Gate passes</span><b>08</b><small>3 awaiting approval</small></article></div><div className="previewLower"><article><div><b>Room occupancy</b><span>View all</span></div><div className="tinyRooms">{["101","102","103","104","201","202","203","204"].map((x,i)=><i className={i===3||i===7?"empty":i===2?"partial":""} key={x}>{x}</i>)}</div></article><article><b>Today’s activity</b>{["Rent received","Gate pass approved","Complaint assigned"].map((x,i)=><p key={x}><i>{["₹","↗","!"][i]}</i><span>{x}<small>{["Room 201 · ₹8,500","Ananya · 6:30 PM","Room 304 · Plumbing"][i]}</small></span></p>)}</article></div></section></div></div>;
}

function RoomMap() {
  const rooms = [["101","3 / 3","full"],["102","2 / 3","partial"],["103","3 / 3","full"],["104","0 / 2","empty"],["201","3 / 3","full"],["202","1 / 2","partial"],["203","2 / 2","full"],["204","0 / 3","empty"]];
  return <div className="roomMap"><div className="mapTop"><div><small>PROPERTY</small><strong>Sunrise Residency</strong></div><span>＋ Add room</span></div><div className="mapStats"><p><b>8</b><span>Rooms</span></p><p><b>19</b><span>Total beds</span></p><p><b>14</b><span>Occupied</span></p><p><b>5</b><span>Available</span></p></div><div className="floorTitle"><b>First & second floor</b><span><i/> Full <i/> Partial <i/> Vacant</span></div><div className="roomTiles">{rooms.map(([number,count,status])=><div className={status} key={number}><span>Room {number}</span><b>{count}</b><small>beds occupied</small></div>)}</div></div>;
}
